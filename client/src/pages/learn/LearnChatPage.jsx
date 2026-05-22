import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { extractFileContent } from '../../utils/fileExtractor';
import { useTranslation } from 'react-i18next';

function getInitials(profile) {
  const prenom = profile?.prenom || '';
  const nom = profile?.nom || '';
  if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return 'A';
}

function formatMessageTime(timestampString) {
  if (!timestampString) return '';
  try {
    const d = new Date(timestampString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Renders a LAURA markdown response into structured JSX.
 * Supports: ## headers, **bold**, - lists, --- separators, plain text.
 */
function RenderMessage({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ margin: '6px 0 6px 16px', padding: 0, listStyle: 'disc' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ marginBottom: '3px', lineHeight: '1.5' }}
              dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const parseBold = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  lines.forEach((line, i) => {
    // Separator ---
    if (/^---+$/.test(line.trim())) {
      flushList(i);
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(128,128,128,0.25)', margin: '10px 0' }} />);
      return;
    }
    // ## Header (exercise titles)
    if (/^##\s/.test(line)) {
      flushList(i);
      const content = parseBold(line.replace(/^##\s/, ''));
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: '1rem', margin: '12px 0 4px', color: 'var(--clr-brand)' }}
          dangerouslySetInnerHTML={{ __html: content }} />
      );
      return;
    }
    // ### Sub-header
    if (/^###\s/.test(line)) {
      flushList(i);
      const content = parseBold(line.replace(/^###\s/, ''));
      elements.push(
        <p key={i} style={{ fontWeight: 600, fontSize: '0.9rem', margin: '8px 0 2px' }}
          dangerouslySetInnerHTML={{ __html: content }} />
      );
      return;
    }
    // - list item
    if (/^[-*]\s/.test(line)) {
      listBuffer.push(parseBold(line.replace(/^[-*]\s/, '')));
      return;
    }
    // numbered list
    if (/^\d+\.\s/.test(line)) {
      listBuffer.push(parseBold(line));
      return;
    }
    flushList(i);
    // Empty line → spacing
    if (line.trim() === '') {
      elements.push(<br key={i} />);
      return;
    }
    // Detect interactive CTA (✅ ...) — highlight it
    if (line.startsWith('✅') || line.startsWith('📋') || line.startsWith('📝')) {
      elements.push(
        <p key={i} style={{ margin: '10px 0 4px', padding: '8px 12px', background: 'rgba(79,110,247,0.08)', borderLeft: '3px solid var(--clr-brand)', borderRadius: '4px', fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
      );
      return;
    }
    // Normal paragraph
    elements.push(
      <p key={i} style={{ margin: '3px 0', lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
    );
  });
  flushList('final');
  return <div style={{ fontSize: 'var(--tx-sm)' }}>{elements}</div>;
}

export default function LearnChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const { userProfile } = useAuth();
  const messagesEndRef = useRef(null);

  const profileContext = {
    prenom: userProfile?.prenom || t('common.roles.learner'),
    role: userProfile?.roleLabel || t('common.roles.learner'),
    niveau: userProfile?.niveau || t('common.roles.learner'),
    serie: userProfile?.serie || 'Général',
    examen: userProfile?.examen || t('common.roles.learner'),
    lang: i18n.language || 'fr'
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);

  // ── Document context for revision sessions ──────────────────────────────
  // Holds { id, titre, type, matiere, url, extractedText } when the session
  // is linked to a real resource (course or exam from the catalog).
  const [sessionDocument, setSessionDocument] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    async function loadHistory() {
      if (!userProfile?.uid) return;
      try {
        const chatRef = doc(db, 'chats', userProfile.uid);
        if (searchParams.get('new') === 'true') {
          await setDoc(chatRef, { messages: [] });
          setMessages([]);
          searchParams.delete('new');
          setSearchParams(searchParams);
        } else {
          const chatSnap = await getDoc(chatRef);
          if (chatSnap.exists()) {
            setMessages(chatSnap.data().messages || []);
          }
        }
      } catch (e) {
        console.error("Erreur de chargement de l'historique :", e);
      } finally {
        setIsInitializing(false);
      }
    }
    loadHistory();
  }, [userProfile?.uid, searchParams]);

  // ── Load resource document when session has a resourceId ──────────────
  useEffect(() => {
    const resourceId    = searchParams.get('resourceId');
    const resourceTitle = searchParams.get('resourceTitle');
    const sessionId     = searchParams.get('sessionId');

    if (sessionId) {
      setActiveSessionId(sessionId);
    }

    if (!resourceId) return;

    async function loadResourceDoc() {
      try {
        const snap = await getDoc(doc(db, 'resources', resourceId));
        if (snap.exists()) {
          const data = snap.data();
          setSessionDocument({
            id:            resourceId,
            titre:         data.titre  || resourceTitle || 'Document',
            type:          data.type   || '',
            matiere:       data.matiere || data.cible || '',
            url:           data.url    || null,
            // extractedText will be populated later if URL is available
            extractedText: data.extractedText || null
          });
        }
      } catch (err) {
        console.error('[LearnChat] Failed to load resource doc:', err);
      }
    }
    loadResourceDoc();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    // ── Session lancée depuis LearnRevisionPage ─────────────────────────
    const matiere      = searchParams.get('matiere');
    const chapitre     = searchParams.get('chapitre');
    const type         = searchParams.get('type') || 'Resume';
    const resourceTitle = searchParams.get('resourceTitle');

    if (matiere && chapitre) {
      // Nettoyer l'URL pour éviter le re-déclenchement
      const next = new URLSearchParams(searchParams);
      next.delete('matiere');
      next.delete('chapitre');
      next.delete('type');
      next.delete('sessionId');
      next.delete('resourceId');
      next.delete('resourceTitle');
      setSearchParams(next);

      const typeLabels = {
        Resume:   'un résumé de cours structuré',
        Quiz:     'un quiz interactif de 5 questions',
        Exercice: "des exercices de révision corrigés étape par étape",
        Examen:   "une préparation intensive à l'examen",
      };
      const typeLabel = typeLabels[type] || `une session de type "${type}"`;

      // Include resource name in the prompt for immediate contextualization
      const docInfo = resourceTitle ? ` basée sur le document **"${resourceTitle}"**` : '';
      const prompt = `Je souhaite faire ${typeLabel} sur **"${chapitre}"** en **${matiere}**${docInfo}. Lance la session de révision maintenant en te basant sur le contenu réel de ce document.`;
      setTimeout(() => handleSend(prompt), 100);
      return;
    }

    // ── Raccourcis prompt prédéfinis ────────────────────────────────────
    const promptKey     = searchParams.get('prompt');
    if (promptKey || resourceTitle) {
      let promptText = ''
      const defaultExam = userProfile?.examen && userProfile.examen !== 'Non défini' ? userProfile.examen : 'mon examen';
      const fullExam = defaultExam + (userProfile?.serie && userProfile.serie !== 'Général' && userProfile.serie !== 'Non défini' ? ' ' + userProfile.serie : '');
      
      if (promptKey === 'sujets_frequents') {
        promptText = t('learn.chat.prompts.frequent_subjects', { exam: fullExam });
      } else if (promptKey === 'corriges_types') {
        promptText = t('learn.chat.prompts.sample_exams', { exam: fullExam });
      } else if (promptKey === 'simulation_examen') {
        promptText = t('learn.chat.prompts.exam_simulation', { exam: fullExam });
      } else if (promptKey === 'plan_preparation') {
        promptText = t('learn.chat.prompts.prep_plan', { exam: fullExam });
      } else if (promptKey === 'programme_revision') {
        promptText = t('learn.chat.prompts.revision_program', { level: profileContext.niveau, exam: fullExam });
      } else if (resourceTitle) {
        promptText = t('learn.chat.prompts.revise_resource', { title: resourceTitle });
      }

      if (promptText) {
        searchParams.delete('prompt');
        searchParams.delete('resourceTitle');
        setSearchParams(searchParams);

        setTimeout(() => {
          handleSend(promptText);
        }, 100);
      }
    }
  }, [searchParams, isInitializing]);


  const handleFileAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show immediate preview while analyzing
    setAttachedFile({ name: file.name, type: file.type, status: 'analyzing', text: null });

    const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
    const result = await extractFileContent(file, API_BASE);

    setAttachedFile({
      name: file.name,
      type: file.type,
      status: result.status,
      text: result.text,
      pages: result.pages,
      method: result.method,
      note: result.note,
    });
  };

  const handleSend = async (customText) => {
    const textToSend = customText || input.trim();
    if ((!textToSend && !attachedFile) || isLoading) return;

    let fullUserText = textToSend;
    if (attachedFile) {
      if (attachedFile.text) {
        // Include extracted content so the AI can actually read and analyze it
        fullUserText = `${fullUserText}\n\n[📎 ${t('learn.chat.file.attachment_label', { name: attachedFile.name })}${attachedFile.pages ? ` (${attachedFile.pages} page${attachedFile.pages > 1 ? 's' : ''})` : ''}]\n\n--- ${t('learn.chat.file.extracted_header')} ---\n${attachedFile.text}\n--- ${t('learn.chat.file.extracted_footer')} ---`;
      } else {
        fullUserText = `[📎 ${t('learn.chat.file.attachment_label', { name: attachedFile.name })}] ${fullUserText}`;
      }
      setAttachedFile(null);
    }

    if (!customText) setInput('');
    const userMsgObj = { role: 'user', text: fullUserText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    if (userProfile?.uid) {
      const chatRef = doc(db, 'chats', userProfile.uid);
      setDoc(chatRef, { messages: arrayUnion(userMsgObj) }, { merge: true }).catch(console.error);
    }

    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

      // Build documentContext from the session-linked resource (if any)
      const documentContext = sessionDocument ? {
        id:            sessionDocument.id,
        titre:         sessionDocument.titre,
        type:          sessionDocument.type,
        matiere:       sessionDocument.matiere,
        extractedText: sessionDocument.extractedText || null
      } : null;

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:         fullUserText,
          mode:            'simple',
          userContext:     profileContext,
          history:         messages,
          documentContext: documentContext
        })
      });

      const data = await response.json();
      const lauraText = data.response || data.error || t('learn.chat.errors.no_response');
      const lauraMsgObj = { role: 'laura', text: lauraText, timestamp: new Date().toISOString() };

      setMessages(prev => [...prev, lauraMsgObj]);

      if (userProfile?.uid) {
        const chatRef = doc(db, 'chats', userProfile.uid);
        setDoc(chatRef, { messages: arrayUnion(lauraMsgObj) }, { merge: true }).catch(console.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsgObj = { role: 'laura', text: t('learn.chat.errors.server_unreachable'), timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsgObj]);

      if (userProfile?.uid) {
        const chatRef = doc(db, 'chats', userProfile.uid);
        setDoc(chatRef, { messages: arrayUnion(errorMsgObj) }, { merge: true }).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPrompt = (promptPrefix) => {
    setInput(promptPrefix);
    const textarea = document.getElementById('chat-textarea');
    if (textarea) textarea.focus();
  };

  const handleSaveMessage = async (textToSave) => {
    if (!userProfile?.uid) {
      alert(t('learn.chat.alerts.login_required'));
      return;
    }
    try {
      await addDoc(collection(db, 'users', userProfile.uid, 'savedNotes'), {
        text: textToSave,
        createdAt: new Date().toISOString()
      });
      alert(t('learn.chat.alerts.saved'));
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      alert(t('learn.chat.alerts.save_error'));
    }
  };

  const handleCompleteSession = async (score) => {
    if (!userProfile?.uid || !activeSessionId) return;

    try {
      setIsLoading(true);
      setIsCompletionModalOpen(false);

      const matiere = sessionDocument?.matiere || 'Général';
      const titre = sessionDocument?.titre || 'Cours';

      // 1. Update session status to "Terminé"
      await setDoc(doc(db, 'users', userProfile.uid, 'sessions', activeSessionId), {
        status: 'Terminé',
        completedAt: new Date().toISOString(),
        scoreEarned: score
      }, { merge: true });

      // 2. Increment Subject progress
      const currentSubProgress = userProfile?.matieresProgress?.[matiere] || 0;
      const newSubProgress = Math.min(100, currentSubProgress + score);
      const matieresProgressUpdate = {
        ...userProfile?.matieresProgress,
        [matiere]: newSubProgress
      };

      // 3. Increment currentGoal / goals progress
      let currentGoalUpdate = null;
      if (userProfile?.currentGoal) {
        const goalProg = userProfile.currentGoal.progress || 0;
        currentGoalUpdate = {
          ...userProfile.currentGoal,
          progress: Math.min(100, goalProg + score)
        };
      }

      let goalsUpdate = null;
      if (Array.isArray(userProfile?.goals) && userProfile.goals.length > 0) {
        goalsUpdate = userProfile.goals.map((g, idx) => {
          if (idx === 0) { // Update the most recent active goal
            return {
              ...g,
              progress: Math.min(100, (g.progress || 0) + score)
            };
          }
          return g;
        });
      }

      const userUpdateObj = {
        matieresProgress: matieresProgressUpdate
      };
      if (currentGoalUpdate) userUpdateObj.currentGoal = currentGoalUpdate;
      if (goalsUpdate) userUpdateObj.goals = goalsUpdate;

      await setDoc(doc(db, 'users', userProfile.uid), userUpdateObj, { merge: true });

      // 4. Record Activity in activities subcollection
      await addDoc(collection(db, 'users', userProfile.uid, 'activities'), {
        action: `Révision : ${titre}`,
        type: 'Révision',
        matiere: matiere,
        result: `Terminé (+${score}%)`,
        createdAt: new Date().toISOString()
      });

      // 5. Navigate to progress page with satisfaction message
      alert(`Félicitations ! Ta progression a été mise à jour : +${score}% en ${matiere} !`);
      navigate('/learn/progress');

    } catch (err) {
      console.error('[LearnChat] Failed to complete session:', err);
      alert('Une erreur est survenue lors de la validation.');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = getInitials(userProfile);

  return (
    <div className="chat-wrapper">

      {/* ── HEADER (Compact & Desktop only to save space on mobile) ── */}
      <div className="desktop-only" style={{ marginBottom: 'var(--sp-4)', flexShrink: 0 }}>

        {/* Session Document Context Banner */}
        {sessionDocument && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--rd-lg)',
            background: 'color-mix(in srgb, var(--clr-brand) 8%, var(--srf-base))',
            border: '1px solid color-mix(in srgb, var(--clr-brand) 25%, transparent)',
            marginBottom: 'var(--sp-4)'
          }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Session basée sur : {sessionDocument.titre}
              </p>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--txt-tertiary)' }}>
                {sessionDocument.type} · {sessionDocument.matiere || 'Toutes matières'} · LAURA répondra en s'appuyant sur ce document
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <button
                onClick={() => navigate('/learn/revision')}
                style={{ background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap' }}
              >
                Changer ↗
              </button>
              {activeSessionId && (
                <button
                  onClick={() => setIsCompletionModalOpen(true)}
                  className="laura-btn"
                  style={{
                    fontSize: 'var(--tx-xs)',
                    minHeight: '28px',
                    padding: '0 var(--sp-3)',
                    borderRadius: 'var(--rd-full)',
                    fontWeight: 600,
                    background: 'var(--clr-green)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  🎯 Terminer & Valider
                </button>
              )}
            </div>
          </div>
        )}

        <div className="row row--between">
          <div>
            <h1 className="laura-h2" style={{ margin: 0 }}>{t('learn.chat.header.prep_exam', { exam: profileContext.examen })}</h1>
            <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', margin: 0 }}>
              {t('learn.chat.header.subtitle')}
            </p>
          </div>
          <button
            onClick={async () => {
              setMessages([]);
              if (userProfile?.uid) {
                await setDoc(doc(doc(db, 'chats', userProfile.uid)), { messages: [] });
              }
            }}
            className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
          >
            🗑️ {t('learn.chat.header.clear_history')}
          </button>
        </div>
      </div>

      {/* ── CHAT MAIN CONTAINER ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

        {/* ── Messages List ── */}
        <div className="chat-messages no-scrollbar" style={{ padding: 'var(--sp-5)' }}>
          {isInitializing ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <span className="empty-state__icon">⏳</span>
              <p className="empty-state__title">{t('learn.chat.loading_session')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto', maxWidth: '360px' }}>
              <span className="empty-state__icon">✨</span>
              <p className="empty-state__title">{t('learn.chat.welcome.title')}</p>
              <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 'var(--sp-2)' }}>
                {t('learn.chat.welcome.desc')}
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--ai'}`}>
                  <div className="chat-msg__avatar">
                    {isUser ? initials : 'L'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', maxWidth: '100%' }}>
                    <div className="chat-msg__bubble">
                      {isUser ? m.text : <RenderMessage text={m.text} />}
                    </div>

                    {m.timestamp && (
                      <span style={{
                        fontSize: '9px',
                        color: 'var(--txt-tertiary)',
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        padding: '0 var(--sp-1)',
                        marginTop: '2px',
                        opacity: 0.8
                      }}>
                        {formatMessageTime(m.timestamp)}
                      </span>
                    )}

                    {/* AI action shortcuts — shown below each AI message */}
                    {!isUser && (
                      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)', paddingLeft: '2px' }}>
                        <button onClick={() => handleSend("suite")}
                          className="laura-btn laura-btn-primary" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          ▶ {t('learn.chat.actions.continue')}
                        </button>
                        <button onClick={() => handleSend("Explique cette réponse de manière plus simple.")}
                          className="laura-btn laura-btn-ghost" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          {t('learn.chat.actions.simplify')}
                        </button>
                        <button onClick={() => handleSend("Peux-tu approfondir ce concept ?")}
                          className="laura-btn laura-btn-ghost" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          {t('learn.chat.actions.deepen')}
                        </button>
                        <button onClick={() => handleSaveMessage(m.text)}
                          className="laura-btn laura-btn-secondary" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          💾 {t('learn.chat.actions.save')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="chat-msg chat-msg--ai">
              <div className="chat-msg__avatar">L</div>
              <div className="chat-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar and attachment controls ── */}
        <div style={{
          padding: 'var(--sp-4)',
          borderTop: '1px solid var(--brd-subtle)',
          background: 'var(--srf-raised)',
          flexShrink: 0
        }}>

          {/* File Preview Card */}
          {attachedFile && (
            <div className="card" style={{
              padding: 'var(--sp-4)',
              background: attachedFile.status === 'ready'
                ? 'color-mix(in srgb, var(--clr-green) 8%, var(--srf-base))'
                : attachedFile.status === 'no-text' || attachedFile.status === 'error'
                  ? 'color-mix(in srgb, var(--clr-warning) 8%, var(--srf-base))'
                  : 'var(--clr-brand-lt)',
              border: `1px solid ${attachedFile.status === 'ready' ? 'rgba(34,197,94,0.25)' : attachedFile.status === 'no-text' || attachedFile.status === 'error' ? 'rgba(234,179,8,0.25)' : 'rgba(79,110,247,0.2)'}`,
              borderRadius: 'var(--rd-lg)',
              marginBottom: 'var(--sp-3)',
              animation: 'slideIn var(--dur-base) var(--ease-out)'
            }}>
              <div className="row row--between">
                <div className="row" style={{ minWidth: 0, gap: 'var(--sp-3)' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                    {attachedFile.status === 'analyzing' ? '⏳' :
                     attachedFile.status === 'ready'     ? '✅' :
                     attachedFile.status === 'no-text'   ? '⚠️' :
                     attachedFile.status === 'error'     ? '❌' : '📎'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', margin: 0, color: 'var(--clr-brand)' }}>
                      {attachedFile.name}
                    </p>
                    <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>
                      {attachedFile.status === 'analyzing' && t('learn.chat.file.extracting')}
                      {attachedFile.status === 'ready' && t('learn.chat.file.extracted', { count: attachedFile.pages })}
                      {attachedFile.status === 'no-text' && (attachedFile.note || t('learn.chat.file.no_text'))}
                      {attachedFile.status === 'error' && t('learn.chat.file.error')}
                      {!attachedFile.status && t('learn.chat.file.ready')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="laura-btn laura-btn-ghost"
                  style={{ minHeight: '28px', width: '28px', padding: 0, borderRadius: 'var(--rd-full)', color: 'var(--txt-secondary)' }}
                  aria-label={t('learn.chat.file.remove')}
                >
                  ✕
                </button>
              </div>

              {attachedFile.status === 'ready' && (
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
                  <button
                    onClick={() => {
                      const prompt = `Analyse ce document et crée un quiz complet de 5 questions pour tester mes connaissances.`;
                      setAttachedFile(prev => prev);
                      handleSend(prompt);
                    }}
                    className="laura-btn laura-btn-primary"
                    style={{ fontSize: 'var(--tx-xs)', minHeight: '32px', padding: '0 var(--sp-4)' }}
                  >
                    ✨ {t('learn.chat.doc_actions.quiz')}
                  </button>
                  <button
                    onClick={() => {
                      const prompt = `Fais-moi un résumé clair et synthétique de ce document.`;
                      setAttachedFile(prev => prev);
                      handleSend(prompt);
                    }}
                    className="laura-btn laura-btn-secondary"
                    style={{ fontSize: 'var(--tx-xs)', minHeight: '32px', padding: '0 var(--sp-4)' }}
                  >
                    📝 {t('learn.chat.doc_actions.summarize')}
                  </button>
                  <button
                    onClick={() => {
                      const prompt = `Corrige et explique en détail tous les exercices présents dans ce document.`;
                      setAttachedFile(prev => prev);
                      handleSend(prompt);
                    }}
                    className="laura-btn laura-btn-secondary"
                    style={{ fontSize: 'var(--tx-xs)', minHeight: '32px', padding: '0 var(--sp-4)' }}
                  >
                    ✏️ {t('learn.chat.doc_actions.correct')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Toolbar : file attach + quick actions (compact, single row) ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>

            {/* 📎 Attach file — always first */}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0 var(--sp-3)', minHeight: '32px',
              fontSize: 'var(--tx-xs)', borderRadius: 'var(--rd-full)',
              cursor: 'pointer', border: '1px solid var(--brd-input)',
              background: 'var(--srf-base)', color: 'var(--txt-primary)',
              fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background var(--dur-fast)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--srf-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--srf-base)'}
            >
              📎 <span>{t('learn.chat.input.attach_file')}</span>
              <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
            </label>

            {/* Divider */}
            <span style={{ height: '20px', width: '1px', background: 'var(--brd-subtle)', flexShrink: 0 }} />

            {/* Quick action chips */}
            {[
              { labelKey: 'learn.chat.input.explain',  prompt: "Peux-tu m'expliquer en détail le concept suivant : " },
              { labelKey: 'learn.chat.input.revise',    prompt: "Je souhaite faire une session de révision complète sur : " },
              { labelKey: 'learn.chat.input.correct',   prompt: "Voici mon exercice, peux-tu le corriger étape par étape : " },
              { labelKey: 'learn.chat.input.quiz',       prompt: "Génère un quiz de 5 questions sur : " },
              { labelKey: 'learn.chat.input.resolve',   prompt: "Voici une épreuve complète, analyse-la et traite tous les exercices un par un : " },
            ].map(({ labelKey, prompt }) => (
              <button
                key={labelKey}
                onClick={() => handleActionPrompt(prompt)}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0 var(--sp-3)', minHeight: '32px',
                  fontSize: 'var(--tx-xs)', borderRadius: 'var(--rd-full)',
                  border: '1px solid var(--brd-subtle)',
                  background: 'transparent', color: 'var(--txt-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all var(--dur-fast)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-brand-lt)'; e.currentTarget.style.color = 'var(--clr-brand)'; e.currentTarget.style.borderColor = 'var(--clr-brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--txt-secondary)'; e.currentTarget.style.borderColor = 'var(--brd-subtle)'; }}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <textarea
              id="chat-textarea"
              rows="2"
              placeholder={t('learn.chat.input.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{
                width: '100%',
                padding: 'var(--sp-3) 60px var(--sp-3) var(--sp-4)',
                borderRadius: 'var(--rd-lg)',
                border: '1px solid var(--brd-input)',
                fontSize: 'var(--tx-base)',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font)',
                background: 'var(--srf-base)',
                color: 'var(--txt-primary)'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading}
              className="chat-send-btn"
              style={{
                position: 'absolute',
                right: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none'
              }}
              aria-label={t('learn.chat.input.send')}
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>

        </div>
      </div>

      {/* ── COMPLETION VALIDATION MODAL ── */}
      {isCompletionModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-4)',
          animation: 'fadeIn var(--dur-base) var(--ease-out)'
        }}>
          <div className="card" style={{
            maxWidth: '460px',
            width: '100%',
            background: 'var(--srf-base)',
            border: '1px solid var(--brd-default)',
            borderRadius: 'var(--rd-2xl)',
            boxShadow: 'var(--shd-2xl)',
            padding: 'var(--sp-6)',
            textAlign: 'center',
            animation: 'scaleIn var(--dur-base) var(--ease-spring)'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--sp-4)' }}>🎓</span>
            <h2 className="laura-h2" style={{ margin: '0 0 var(--sp-2)' }}>
              Bravo pour tes efforts !
            </h2>
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', marginBottom: 'var(--sp-6)' }}>
              Tu as terminé ta session de révision sur le document <strong>"{sessionDocument?.titre}"</strong>. Comment évalues-tu ton assimilation de ce cours ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
              {[
                { label: '🌟 Excellent ! (+10% de progression)', score: 10, variant: 'primary', color: 'var(--clr-green)' },
                { label: '👍 Assez bien compris (+5% de progression)', score: 5, variant: 'secondary', color: 'var(--clr-brand)' },
                { label: '⏳ Encore besoin de réviser (+2% de progression)', score: 2, variant: 'ghost', color: 'var(--txt-secondary)' }
              ].map(opt => (
                <button
                  key={opt.score}
                  onClick={() => handleCompleteSession(opt.score)}
                  className={`laura-btn`}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: '44px',
                    fontSize: 'var(--tx-sm)',
                    borderRadius: 'var(--rd-lg)',
                    fontWeight: 600,
                    border: '1px solid var(--brd-default)',
                    background: opt.variant === 'primary' ? 'var(--clr-green)' : opt.variant === 'secondary' ? 'var(--clr-brand-lt)' : 'transparent',
                    color: opt.variant === 'primary' ? 'white' : opt.variant === 'secondary' ? 'var(--clr-brand)' : 'var(--txt-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCompletionModalOpen(false)}
              style={{
                fontSize: 'var(--tx-xs)',
                color: 'var(--clr-error)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

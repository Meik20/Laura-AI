import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

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

export default function TutorChatPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  const chatEndRef = useRef(null);
  
  const uid = currentUser?.uid || userProfile?.uid;

  const profileContext = {
    prenom: userProfile?.prenom || userProfile?.nom || t('common.roles.tutor'),
    discipline: userProfile?.discipline || userProfile?.filiere || 'Général',
    etablissement: userProfile?.etablissement || 'Non défini',
    role: 'tutor',
    serie: userProfile?.discipline || userProfile?.filiere || 'Général'
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);

  const handleFileAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile({ name: file.name, type: file.type });
    }
  };

  const suggestions = [
    t('tutor.chat.suggestions.plan', "Générer un plan de cours"),
    t('tutor.chat.suggestions.exercise', "Créer une fiche d'exercices d'application"),
    t('tutor.chat.suggestions.exam', "Concevoir un sujet d'examen"),
    t('tutor.chat.suggestions.simplify', "Reformuler cette leçon de manière simple"),
    t('tutor.chat.suggestions.quiz', "Produire un quiz d'évaluation rapide")
  ];

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    async function loadHistory() {
      if (!uid) return;
      try {
        const chatRef = doc(db, 'chats', uid);
        const welcomeMsg = {
          role: 'laura',
          text: t('tutor.chat.welcome_message', { name: profileContext.prenom, discipline: profileContext.discipline }),
          timestamp: new Date().toISOString()
        };

        if (searchParams.get('new') === 'true') {
          await setDoc(chatRef, { messages: [welcomeMsg] });
          setMessages([welcomeMsg]);
          searchParams.delete('new');
          setSearchParams(searchParams);
        } else {
          const chatSnap = await getDoc(chatRef);
          if (chatSnap.exists() && chatSnap.data().messages?.length > 0) {
            setMessages(chatSnap.data().messages);
          } else {
            setMessages([welcomeMsg]);
          }
        }
      } catch (e) {
        console.error("Erreur de chargement de l'historique :", e);
      } finally {
        setIsInitializing(false);
      }
    }
    loadHistory();
  }, [uid]);

  const handleSend = async (textToSend) => {
    const userText = textToSend || input.trim();
    if ((!userText && !attachedFile) || isLoading) return;
    
    let fullUserText = userText;
    if (attachedFile) {
      fullUserText = `[📎 Fichier joint : ${attachedFile.name}] ${fullUserText}`;
      setAttachedFile(null);
    }

    if (!textToSend) setInput('');
    const userMsgObj = { role: 'user', text: fullUserText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    if (uid) {
      const chatRef = doc(db, 'chats', uid);
      setDoc(chatRef, { messages: arrayUnion(userMsgObj) }, { merge: true }).catch(console.error);
    }

    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
      const headers = { 'Content-Type': 'application/json' };
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: fullUserText, mode: 'simple', userContext: profileContext, history: messages })
      });
      
      const data = await response.json();
      const lauraText = data.response || data.error || t('tutor.chat.laura_error', "Désolée, je n'ai pas pu formuler une réponse.");
      const lauraMsgObj = { role: 'laura', text: lauraText, timestamp: new Date().toISOString() };
      
      setMessages(prev => [...prev, lauraMsgObj]);

      if (uid) {
        const chatRef = doc(db, 'chats', uid);
        setDoc(chatRef, { messages: arrayUnion(lauraMsgObj) }, { merge: true }).catch(console.error);
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsgObj = { role: 'laura', text: t('tutor.chat.network_error', "⚠️ Oups ! Je n'arrive pas à joindre le serveur pour le moment. Vérifiez votre connexion internet ou réessayez dans quelques instants."), timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsgObj]);
      
      if (uid) {
        const chatRef = doc(db, 'chats', uid);
        setDoc(chatRef, { messages: arrayUnion(errorMsgObj) }, { merge: true }).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToSubmission = async () => {
    const lastLauraMsg = [...messages].reverse().find(m => m.role === 'laura');
    if (!lastLauraMsg) {
      alert(t('tutor.chat.alert_no_content', "Aucun contenu généré par LAURA à convertir."));
      return;
    }
    if (!uid) {
      alert(t('tutor.chat.alert_no_user', "Utilisateur non identifié."));
      return;
    }

    try {
      const newRes = {
        titre: `Support généré par IA - ${new Date().toLocaleDateString()}`,
        type: 'Fiche',
        statut: 'brouillon',
        contenu: lastLauraMsg.text,
        auteurId: uid,
        auteur: userProfile?.nom || userProfile?.prenom || t('common.roles.tutor'),
        matiere: profileContext.discipline,
        niveau: userProfile?.niveau || 'Général',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'resources'), newRes);
      alert(t('tutor.chat.alert_export_success', "Contenu exporté avec succès dans vos soumissions (Brouillon) !"));
    } catch (err) {
      console.error("Erreur export soumission:", err);
      alert(t('tutor.chat.alert_export_error', "Erreur lors de l'exportation."));
    }
  };

  const initials = (userProfile?.prenom?.[0] || '') + (userProfile?.nom?.[0] || 'T');

  return (
    <div className="chat-wrapper">
      
      {/* HEADER */}
      <div className="row row--between" style={{ marginBottom: 'var(--sp-4)', flexShrink: 0 }}>
        <div>
          <h1 className="laura-h2" style={{ margin: 0 }}>{t('tutor.chat.title', 'Chat Pédagogique')}</h1>
          <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', margin: 0 }}>
            {t('tutor.chat.subtitle', "Utilisez l'IA pour générer et structurer vos contenus avant de les soumettre.")}
          </p>
        </div>
        <button 
          onClick={async () => {
            const welcomeMsg = {
              role: 'laura',
              text: t('tutor.chat.welcome_message', { name: profileContext.prenom, discipline: profileContext.discipline }),
              timestamp: new Date().toISOString()
            };
            setMessages([welcomeMsg]);
            if (uid) {
              await setDoc(doc(db, 'chats', uid), { messages: [welcomeMsg] });
            }
          }} 
          className="laura-btn laura-btn-ghost"
          style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          <i className="ti ti-trash"></i> {t('tutor.chat.new_chat', 'Nouveau Chat')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-5)', flex: 1, overflow: 'hidden' }}>
        
        {/* CHAT AREA */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          
          {/* Messages */}
          <div className="chat-messages no-scrollbar" style={{ padding: 'var(--sp-5)' }}>
            {isInitializing ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <span className="empty-state__icon"><i className="ti ti-loader-2" style={{ fontSize: '2.5rem', color: 'var(--clr-brand)' }}></i></span>
                <p className="empty-state__title">{t('tutor.chat.loading_session', 'Chargement de la session...')}</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--ai'}`}>
                    <div className="chat-msg__avatar" style={{ background: isUser ? 'var(--grd-brand)' : 'var(--clr-green-lt)', color: isUser ? 'white' : 'var(--txt-primary)', border: isUser ? 'none' : '1px solid var(--brd-subtle)', fontWeight: 700 }}>
                      {isUser ? initials : 'L'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', maxWidth: '100%' }}>
                      <div style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-tertiary)' }}>
                        {isUser ? t('tutor.chat.user_label', 'Vous') : t('tutor.chat.ai_label', 'LAURA Pédagogie')}
                      </div>
                      <div className="chat-msg__bubble" style={{ background: isUser ? 'var(--grd-brand)' : 'var(--srf-raised)', color: isUser ? 'white' : 'var(--txt-primary)' }}>
                        {m.text}
                      </div>

                      {m.timestamp && (
                        <span style={{
                          fontSize: '9px',
                          color: isUser ? 'var(--txt-secondary)' : 'var(--txt-tertiary)',
                          alignSelf: isUser ? 'flex-end' : 'flex-start',
                          padding: '0 var(--sp-1)',
                          marginTop: '2px',
                          opacity: 0.8
                        }}>
                          {formatMessageTime(m.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderTop: '1px solid var(--brd-subtle)', background: 'var(--srf-raised)' }}>
            
            {attachedFile && (
              <div className="card card--glass" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <div className="row row--between" style={{ alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--tx-xs)' }}>
                    <i className="ti ti-paperclip" style={{ color: 'var(--clr-green)' }} />
                    <span style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-bold)' }}>{t('tutor.chat.attached_doc', 'Document :')}</span>
                    <span className="badge badge--brand">{attachedFile.name}</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="laura-btn laura-btn-ghost" style={{ padding: 0, minHeight: 'auto', minWidth: 'auto', color: 'var(--clr-error)' }}><i className="ti ti-x"></i></button>
                </div>
                <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      const prompt = `[📎 Document joint : ${attachedFile.name}] J'ai partagé ce document pédagogique avec toi. Peux-tu l'analyser et m'aider à concevoir une fiche d'exercices d'application complète avec corrigé ?`;
                      setAttachedFile(null);
                      handleSend(prompt);
                    }}
                    className="laura-btn laura-btn-primary"
                    style={{ minHeight: '32px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-4)' }}
                  >
                    {t('tutor.chat.doc_btn_design', '✨ Concevoir des exercices à partir de ce cours')}
                  </button>
                </div>
              </div>
            )}

            <div className="row" style={{ gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)', alignItems: 'center' }}>
            <label className="chip" style={{ cursor: 'pointer', margin: 0, background: 'var(--srf-base)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className="ti ti-paperclip"></i> {t('tutor.chat.attach_file', 'Joindre un fichier / cours')}
                <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea 
                rows="3" 
                placeholder={t('tutor.chat.placeholder', "Ex: Génère un quiz de 5 questions sur le théorème de Thalès pour des élèves de 3ème...")} 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ width: '100%', padding: 'var(--sp-4) 4.5rem var(--sp-4) var(--sp-4)', borderRadius: 'var(--rd-lg)', border: '1px solid var(--brd-input)', background: 'var(--srf-base)', fontSize: 'var(--tx-base)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--txt-primary)' }}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading}
                className="laura-btn laura-btn-primary"
                style={{ position: 'absolute', right: '12px', bottom: '12px', minHeight: '38px', minWidth: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isLoading ? <i className="ti ti-loader-2"></i> : <i className="ti ti-send"></i>}
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR SUGGESTIONS (Desktop only) */}
        <div className="desktop-only" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          
          <div className="card" style={{ padding: 'var(--sp-5)', background: 'var(--grd-brand)', color: 'white', border: 'none' }}>
            <h3 style={{ fontSize: 'var(--tx-base)', margin: '0 0 var(--sp-3) 0', fontWeight: 'var(--fw-bold)' }}>{t('tutor.chat.quick_suggestions', 'Suggestions rapides')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', padding: 'var(--sp-3)', borderRadius: 'var(--rd-sm)', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all var(--dur-fast) var(--ease-std)', fontSize: 'var(--tx-xs)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <h3 style={{ fontSize: 'var(--tx-sm)', margin: '0 0 var(--sp-2) 0', color: 'var(--txt-primary)', fontWeight: 'var(--fw-bold)' }}>{t('tutor.chat.export_title', 'Export & Soumission')}</h3>
            <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', lineHeight: 'var(--lh-relaxed)', marginBottom: 'var(--sp-4)' }}>
              {t('tutor.chat.export_desc', "Une fois votre contenu généré et affiné, vous pouvez l'exporter directement comme brouillon dans vos soumissions.")}
            </p>
            <button onClick={handleConvertToSubmission} className="laura-btn laura-btn-secondary" style={{ width: '100%', justifyContent: 'center', minHeight: '36px', fontSize: 'var(--tx-xs)' }}>
              {t('tutor.chat.export_btn', 'Convertir en soumission')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

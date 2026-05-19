import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';

function getInitials(profile) {
  const prenom = profile?.prenom || '';
  const nom = profile?.nom || '';
  if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return 'A';
}

export default function LearnChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const { userProfile } = useAuth();
  const messagesEndRef = useRef(null);

  const profileContext = {
    prenom: userProfile?.prenom || 'Apprenant',
    role: userProfile?.roleLabel || 'Non défini',
    niveau: userProfile?.niveau || 'Non défini',
    serie: userProfile?.serie || 'Général',
    examen: userProfile?.examen || 'Non défini'
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);

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

  useEffect(() => {
    if (isInitializing) return;

    const promptKey = searchParams.get('prompt');
    const resourceTitle = searchParams.get('resourceTitle');

    if (promptKey || resourceTitle) {
      let promptText = '';
      if (promptKey === 'sujets_frequents') {
        promptText = `Quels sont les sujets et chapitres qui tombent le plus fréquemment à l'examen de mon niveau (${profileContext.examen}), et comment bien m'y préparer ?`;
      } else if (promptKey === 'corriges_types') {
        promptText = `Peux-tu me donner un exemple d'épreuve ou d'annale type pour mon examen (${profileContext.examen}) avec son corrigé détaillé et des conseils méthodologiques ?`;
      } else if (promptKey === 'simulation_examen') {
        promptText = `Je souhaite faire une simulation d'examen en condition réelle pour mon niveau (${profileContext.examen}). Donne-moi un sujet complet à traiter en temps limité.`;
      } else if (promptKey === 'plan_preparation') {
        promptText = `Élabore un plan de préparation complet et structuré pour mon examen (${profileContext.examen}), en ciblant les notions prioritaires à maîtriser.`;
      } else if (promptKey === 'programme_revision') {
        promptText = `Élabore un programme de révision sur mesure pour mon niveau (${profileContext.niveau}) et mon examen (${profileContext.examen}), en tenant compte de ma filière/série.`;
      } else if (resourceTitle) {
        promptText = `Peux-tu m'aider à réviser et m'expliquer en détail l'annale/épreuve suivante : "${resourceTitle}" ?`;
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

    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || '';
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/analyze-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.extractedText) {
        setAttachedFile({
          name: file.name,
          type: file.type,
          status: 'ready',
          text: data.extractedText,
          pages: data.pages,
          method: data.method,
        });
      } else {
        // File couldn't be parsed (scanned PDF, unsupported format)
        setAttachedFile({
          name: file.name,
          type: file.type,
          status: 'no-text',
          text: null,
          note: data.note || 'Impossible d\'extraire le texte de ce fichier.',
        });
      }
    } catch (err) {
      console.error('File analysis error:', err);
      setAttachedFile({ name: file.name, type: file.type, status: 'error', text: null });
    }
  };

  const handleSend = async (customText) => {
    const textToSend = customText || input.trim();
    if ((!textToSend && !attachedFile) || isLoading) return;

    let fullUserText = textToSend;
    if (attachedFile) {
      if (attachedFile.text) {
        // Include extracted content so the AI can actually read and analyze it
        fullUserText = `${fullUserText}\n\n[📎 Document joint : "${attachedFile.name}"${attachedFile.pages ? ` (${attachedFile.pages} page${attachedFile.pages > 1 ? 's' : ''})` : ''}]\n\n--- CONTENU EXTRAIT DU DOCUMENT ---\n${attachedFile.text}\n--- FIN DU DOCUMENT ---`;
      } else {
        fullUserText = `[📎 Fichier joint : ${attachedFile.name}] ${fullUserText}`;
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
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullUserText, mode: 'simple', userContext: profileContext, history: messages })
      });

      const data = await response.json();
      const lauraText = data.response || data.error || "Désolée, je n'ai pas pu formuler une réponse.";
      const lauraMsgObj = { role: 'laura', text: lauraText, timestamp: new Date().toISOString() };

      setMessages(prev => [...prev, lauraMsgObj]);

      if (userProfile?.uid) {
        const chatRef = doc(db, 'chats', userProfile.uid);
        setDoc(chatRef, { messages: arrayUnion(lauraMsgObj) }, { merge: true }).catch(console.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsgObj = { role: 'laura', text: "⚠️ Oups ! Je n'arrive pas à joindre le serveur pour le moment. Vérifiez votre connexion internet ou réessayez dans quelques instants.", timestamp: new Date().toISOString() };
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
      alert("Veuillez vous connecter pour sauvegarder des explications.");
      return;
    }
    try {
      await addDoc(collection(db, 'users', userProfile.uid, 'savedNotes'), {
        text: textToSave,
        createdAt: new Date().toISOString()
      });
      alert("Explication sauvegardée dans vos notes !");
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const initials = getInitials(userProfile);

  return (
    <div className="chat-wrapper">

      {/* ── HEADER (Compact & Desktop only to save space on mobile) ── */}
      <div className="row row--between desktop-only" style={{ marginBottom: 'var(--sp-4)', flexShrink: 0 }}>
        <div>
          <h1 className="laura-h2" style={{ margin: 0 }}>Préparation {profileContext.examen}</h1>
          <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', margin: 0 }}>
            Session d'études active avec votre tuteur LAURA
          </p>
        </div>
        <button
          onClick={async () => {
            setMessages([]);
            if (userProfile?.uid) {
              await setDoc(doc(db, 'chats', userProfile.uid), { messages: [] });
            }
          }}
          className="laura-btn laura-btn-ghost"
          style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
        >
          🗑️ Effacer l'historique
        </button>
      </div>

      {/* ── CHAT MAIN CONTAINER ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

        {/* ── Messages List ── */}
        <div className="chat-messages no-scrollbar" style={{ padding: 'var(--sp-5)' }}>
          {isInitializing ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <span className="empty-state__icon">⏳</span>
              <p className="empty-state__title">Chargement de la session...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto', maxWidth: '360px' }}>
              <span className="empty-state__icon">✨</span>
              <p className="empty-state__title">Bienvenue dans votre espace d'étude</p>
              <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 'var(--sp-2)' }}>
                Posez vos questions de cours, soumettez des exercices ou partagez un fichier pour démarrer.
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', maxWidth: '100%' }}>
                    <div className="chat-msg__bubble">
                      {m.text}
                    </div>

                    {/* AI action shortcuts */}
                    {!isUser && (
                      <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)', paddingLeft: '2px' }}>
                        <button onClick={() => handleSend("Explique cette réponse de manière plus simple.")}
                          className="laura-btn laura-btn-ghost" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          Simplifier
                        </button>
                        <button onClick={() => handleSend("Peux-tu approfondir ce concept ?")}
                          className="laura-btn laura-btn-ghost" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          Approfondir
                        </button>
                        <button onClick={() => handleSend("Génère un quiz de révision sur cette explication.")}
                          className="laura-btn laura-btn-ghost" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          Générer quiz
                        </button>
                        <button onClick={() => handleSaveMessage(m.text)}
                          className="laura-btn laura-btn-secondary" style={{ minHeight: '26px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          Sauvegarder
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
                      {attachedFile.status === 'analyzing' && 'Extraction du contenu en cours...'}
                      {attachedFile.status === 'ready' && `✓ Contenu extrait${attachedFile.pages ? ` · ${attachedFile.pages} page${attachedFile.pages > 1 ? 's' : ''}` : ''} · prêt pour analyse`}
                      {attachedFile.status === 'no-text' && (attachedFile.note || 'Texte non lisible — LAURA le verra quand même')}
                      {attachedFile.status === 'error' && 'Erreur d\'analyse — LAURA le verra quand même'}
                      {!attachedFile.status && 'Fichier prêt à l\'envoi'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="laura-btn laura-btn-ghost"
                  style={{ minHeight: '28px', width: '28px', padding: 0, borderRadius: 'var(--rd-full)', color: 'var(--txt-secondary)' }}
                  aria-label="Supprimer le fichier"
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
                    ✨ Créer un Quiz
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
                    📝 Résumer
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
                    ✏️ Corriger
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick prompt suggestions row */}
          <div className="no-scrollbar" style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--sp-3)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <label className="laura-btn laura-btn-secondary" style={{
              padding: '0 var(--sp-4)',
              minHeight: '34px',
              fontSize: 'var(--tx-xs)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--sp-1)'
            }}>
              <span>📎</span> Partager un fichier
              <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
            </label>

            <span style={{ width: '1px', background: 'var(--brd-subtle)', flexShrink: 0 }} />

            <button onClick={() => handleActionPrompt("Peux-tu m'expliquer en détail le concept suivant : ")}
              className="laura-btn laura-btn-ghost" style={{ padding: '0 var(--sp-4)', minHeight: '34px', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Expliquer
            </button>
            <button onClick={() => handleActionPrompt("Je souhaite faire une session de révision complète sur : ")}
              className="laura-btn laura-btn-ghost" style={{ padding: '0 var(--sp-4)', minHeight: '34px', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Réviser
            </button>
            <button onClick={() => handleActionPrompt("Voici mon exercice, peux-tu le corriger : ")}
              className="laura-btn laura-btn-ghost" style={{ padding: '0 var(--sp-4)', minHeight: '34px', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Corriger
            </button>
            <button onClick={() => handleActionPrompt("Génère un quiz de 5 questions sur : ")}
              className="laura-btn laura-btn-ghost" style={{ padding: '0 var(--sp-4)', minHeight: '34px', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Quiz
            </button>
          </div>

          {/* Text Input Row */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <textarea
              id="chat-textarea"
              rows="2"
              placeholder="Écrivez votre question ici..."
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
              aria-label="Envoyer"
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

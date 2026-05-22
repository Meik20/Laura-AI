import { useState, useEffect, useRef, useContext } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SupportWidget() {
  const { t } = useTranslation();
  const { currentUser, userProfile } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [inputText, setInputText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);

  const uid = currentUser?.uid;

  // Listen to the support chat for this user
  useEffect(() => {
    if (!uid) return;

    const docRef = doc(db, 'support_chats', uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
        setHasUnread(!!data.unreadByUser);

        // If the widget is open and there are unread messages, clear them
        if (isOpen && data.unreadByUser) {
          updateDoc(docRef, { unreadByUser: false }).catch(console.error);
        }
      } else {
        setMessages([]);
        setHasUnread(false);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid, isOpen]);

  // Scroll to bottom when messages change or widget opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!uid) return null;

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !firstMessage.trim()) return;

    setIsCreating(true);
    try {
      const docRef = doc(db, 'support_chats', uid);
      const name = `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() || currentUser?.displayName || 'Utilisateur';
      const email = userProfile?.email || currentUser?.email || 'N/A';
      const role = userProfile?.roleLabel || userProfile?.role || 'Apprenant';

      await setDoc(docRef, {
        userId: uid,
        userName: name,
        userEmail: email,
        userRole: role,
        subject: subject.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadByAdmin: true,
        unreadByUser: false,
        messages: [
          {
            senderId: uid,
            senderName: name,
            role: 'user',
            text: firstMessage.trim(),
            createdAt: new Date().toISOString()
          }
        ]
      });
      setSubject('');
      setFirstMessage('');
    } catch (err) {
      console.error("Erreur lors de l'envoi de la demande de support:", err);
      alert("Une erreur est survenue lors de l'envoi de votre message.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageObj = {
      senderId: uid,
      senderName: `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() || currentUser?.displayName || 'Utilisateur',
      role: 'user',
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    setInputText('');

    try {
      const docRef = doc(db, 'support_chats', uid);
      await updateDoc(docRef, {
        messages: arrayUnion(messageObj),
        lastMessageAt: new Date().toISOString(),
        unreadByAdmin: true,
        status: 'pending' // reopen if resolved
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
    }
  };

  return (
    <div style={{ position: 'fixed', zIndex: 999 }} className="support-widget-container">
      {/* Styles */}
      <style>{`
        .support-widget-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--clr-brand, #7c3aed);
          color: white;
          border: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
        }
        .support-widget-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .support-widget-bubble:active {
          transform: scale(0.95);
        }
        .support-badge-unread {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid var(--srf-page, #121214);
        }
        .support-panel {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 360px;
          height: 500px;
          max-height: calc(100vh - 140px);
          background: var(--srf-base, #1e1e24);
          border: 1px solid var(--brd-subtle, rgba(255,255,255,0.08));
          border-radius: var(--rd-xl, 16px);
          box-shadow: var(--shd-xl, 0 12px 32px rgba(0,0,0,0.3));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: supportSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom right;
        }
        @keyframes supportSlideUp {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(40px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (max-width: 480px) {
          .support-widget-bubble {
            bottom: 84px;
            right: 16px;
            width: 50px;
            height: 50px;
            font-size: 20px;
          }
          .support-panel {
            bottom: 146px;
            right: 16px;
            width: calc(100vw - 32px);
            height: 420px;
          }
        }
        .support-header {
          background: var(--grd-brand, linear-gradient(135deg, #7c3aed, #4f46e5));
          color: white;
          padding: var(--sp-4, 16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .support-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--sp-4, 16px);
          background: var(--srf-page, #121214);
        }
        .support-footer {
          padding: var(--sp-3, 12px) var(--sp-4, 16px);
          background: var(--srf-base, #1e1e24);
          border-top: 1px solid var(--brd-subtle, rgba(255,255,255,0.08));
        }
        .support-input-row {
          display: flex;
          gap: var(--sp-2, 8px);
          align-items: center;
        }
        .support-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--brd-input, rgba(255,255,255,0.12));
          background: var(--srf-page, #121214);
          color: var(--txt-primary, #ffffff);
          font-size: 14px;
          font-family: inherit;
        }
        .support-input:focus {
          outline: none;
          border-color: var(--clr-brand, #7c3aed);
        }
        .support-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--clr-brand, #7c3aed);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }
        .support-send-btn:hover {
          background: #6d28d9;
        }
        .support-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .support-msg {
          margin-bottom: 12px;
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.4;
          word-break: break-word;
        }
        .support-msg--user {
          background: var(--clr-brand, #7c3aed);
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }
        .support-msg--admin {
          background: var(--srf-raised, #2a2a32);
          color: var(--txt-primary, #ffffff);
          margin-right: auto;
          border-bottom-left-radius: 4px;
          border: 1px solid var(--brd-subtle, rgba(255,255,255,0.05));
        }
      `}</style>

      {/* Floating Button */}
      <button 
        className="support-widget-bubble" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contacter le support technique"
        title="Support technique"
      >
        <i className={`ti ti-${isOpen ? 'x' : 'headset'}`} />
        {hasUnread && !isOpen && <span className="support-badge-unread" />}
      </button>

      {/* Support Chat Panel */}
      {isOpen && (
        <div className="support-panel">
          {/* Header */}
          <div className="support-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-headset" style={{ fontSize: '20px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '14px' }}>Support Client</strong>
                <span style={{ fontSize: '10px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> 
                  Équipe en ligne
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', padding: 0 }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="support-body no-scrollbar">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-tertiary)' }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
                <span style={{ fontSize: '12px', marginTop: '8px' }}>Chargement...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Ticket creation form if no message thread exists */
              <form onSubmit={handleStartChat} style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <i className="ti ti-message-chatbot" style={{ fontSize: '42px', color: 'var(--clr-brand)' }} />
                  <h4 style={{ margin: '8px 0 4px', fontSize: '15px', color: 'var(--txt-primary)' }}>Comment pouvons-nous vous aider ?</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--txt-secondary)', padding: '0 12px' }}>
                    Posez votre question ci-dessous, notre équipe administrative vous répondra très rapidement.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Sujet de votre demande (ex: Connexion, Contenu...)"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--brd-input, rgba(255,255,255,0.12))',
                    background: 'var(--srf-raised, #2a2a32)',
                    color: 'var(--txt-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />

                <textarea
                  placeholder="Décrivez votre problème en détail..."
                  required
                  rows="4"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--brd-input, rgba(255,255,255,0.12))',
                    background: 'var(--srf-raised, #2a2a32)',
                    color: 'var(--txt-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />

                <button
                  type="submit"
                  disabled={isCreating || !subject.trim() || !firstMessage.trim()}
                  className="laura-btn laura-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', minHeight: '38px', fontSize: '13px', marginTop: '6px' }}
                >
                  {isCreating ? 'Envoi...' : 'Envoyer ma demande'}
                </button>
              </form>
            ) : (
              /* Chat Thread Mode */
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                {messages.map((m, idx) => {
                  const isAdmin = m.role === 'admin';
                  return (
                    <div 
                      key={idx} 
                      className={`support-msg support-msg--${isAdmin ? 'admin' : 'user'}`}
                    >
                      <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 'bold', marginBottom: '2px' }}>
                        {isAdmin ? 'Administration' : 'Vous'}
                      </div>
                      <div>{m.text}</div>
                      <div style={{ fontSize: '9px', opacity: 0.6, textAlign: 'right', marginTop: '4px' }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer (only in Chat Mode) */}
          {messages.length > 0 && (
            <div className="support-footer">
              <form onSubmit={handleSendMessage} className="support-input-row">
                <input
                  type="text"
                  placeholder="Répondre..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="support-input"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()} 
                  className="support-send-btn"
                  aria-label="Envoyer"
                >
                  <i className="ti ti-send" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

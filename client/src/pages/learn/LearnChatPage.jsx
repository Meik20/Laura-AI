import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';

export default function LearnChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const { userProfile } = useAuth();
  
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

  const handleFileAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile({ name: file.name, type: file.type });
    }
  };

  const handleSend = async (customText) => {
    const textToSend = customText || input.trim();
    if ((!textToSend && !attachedFile) || isLoading) return;
    
    let fullUserText = textToSend;
    if (attachedFile) {
      fullUserText = `[📎 Fichier joint : ${attachedFile.name}] ${fullUserText}`;
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
        body: JSON.stringify({ message: fullUserText, mode: 'simple', userContext: profileContext })
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
      alert("Explication sauvegardée avec succès dans vos notes !");
    } catch (err) {
      console.error("Erreur de sauvegarde:", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', height: 'calc(100vh - 120px)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
        <div>
          <h1 className="laura-h1">Préparation {profileContext.examen}</h1>
          <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>
            Chat Contextuel LAURA
          </p>
        </div>
        <button 
          onClick={async () => {
            setMessages([]);
            if (userProfile?.uid) {
              await setDoc(doc(db, 'chats', userProfile.uid), { messages: [] });
            }
          }} 
          className="laura-btn laura-btn-primary"
        >
          <span>+</span> Nouvelle conversation
        </button>
      </div>

      <div className="laura-page-grid" style={{ flex: 1, minHeight: 0, gridTemplateColumns: '1fr' }}>
        
        {/* ZONE CENTRALE : CHAT */}
        <div className="laura-page-main laura-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          
          {/* Liste des Messages */}
          <div style={{ flex: 1, padding: 'var(--sp-6)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {isInitializing ? (
              <div className="laura-empty">Chargement de l'historique...</div>
            ) : messages.length === 0 ? (
              <div className="laura-empty">Aucun message. Posez votre première question à LAURA !</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--sp-4)' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: 'var(--r-md)', flexShrink: 0, 
                    background: m.role === 'user' ? 'var(--laura-primary)' : 'var(--laura-surface)', 
                    border: m.role === 'user' ? 'none' : '1px solid var(--laura-border-strong)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'white', fontWeight: 700, fontSize: '1rem', overflow: 'hidden' 
                  }}>
                    {m.role === 'user' ? 'A' : (
                      <img src="/icon.png" alt="LAURA" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--laura-text-1)' }}>
                      {m.role === 'user' ? 'Vous' : 'LAURA'}
                    </div>
                    <div className="laura-body" style={{ color: 'var(--laura-text-1)', background: m.role === 'user' ? 'var(--laura-bg-soft)' : 'var(--laura-surface)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)', border: '1px solid var(--laura-border-soft)' }}>
                      {m.text}
                    </div>
                    
                    {/* Actions sur la réponse de l'IA */}
                    {m.role === 'laura' && (
                      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
                        <button onClick={() => handleSend("Peux-tu réexpliquer cela de manière plus simple et imagée ?")} className="laura-btn laura-btn-ghost" style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Simplifier</button>
                        <button onClick={() => handleSend("Peux-tu approfondir cette explication avec des exemples concrets et avancés ?")} className="laura-btn laura-btn-ghost" style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Approfondir</button>
                        <button onClick={() => handleSend("Génère un petit quiz sur l'explication que tu viens de donner pour vérifier ma compréhension.")} className="laura-btn laura-btn-ghost" style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Générer quiz</button>
                        <button onClick={() => handleSend("Donne-moi un exercice d'application similaire pour m'entraîner.")} className="laura-btn laura-btn-ghost" style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Exercice similaire</button>
                        <button onClick={() => handleSaveMessage(m.text)} className="laura-btn laura-btn-secondary" style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Sauvegarder</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
 
          {/* Zone de Saisie */}
          <div style={{ padding: 'var(--sp-5)', borderTop: '1px solid var(--laura-border-soft)', background: 'var(--laura-bg-soft)' }}>
            
            {attachedFile && (
              <div className="laura-alert laura-alert-success" style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📎 Fichier joint :</span>
                    <span style={{ background: 'white', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--laura-border-soft)' }}>{attachedFile.name}</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer' }}>✕</button>
                </div>
                <button 
                  onClick={() => {
                    const prompt = `[📎 Cours partagé : ${attachedFile.name}] J'ai partagé mon cours avec toi. Peux-tu analyser ce document et créer un quiz interactif complet (avec QCM et explications) pour tester mes connaissances sur ce cours ?`;
                    setAttachedFile(null);
                    handleSend(prompt);
                  }}
                  className="laura-btn laura-btn-primary"
                  style={{ marginTop: 'var(--sp-3)' }}
                >
                  ✨ Transformer en Quiz
                </button>
              </div>
            )}
 
            {/* Actions rapides de saisie */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', overflowX: 'auto', paddingBottom: '4px' }}>
              <label className="laura-btn laura-btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px', cursor: 'pointer' }}>
                <span>📎</span> Partager un cours
                <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
              </label>
              <div style={{ width: '1px', background: 'var(--laura-border-strong)' }}></div>
              <button onClick={() => handleActionPrompt("Peux-tu m'expliquer en détail le concept suivant : ")} className="laura-btn laura-btn-ghost" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}>Expliquer</button>
              <button onClick={() => handleActionPrompt("Je souhaite faire une session de révision complète sur : ")} className="laura-btn laura-btn-ghost" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}>Réviser</button>
              <button onClick={() => handleActionPrompt("Voici mon exercice, peux-tu le corriger : ")} className="laura-btn laura-btn-ghost" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}>Corriger</button>
              <button onClick={() => handleActionPrompt("Génère un quiz de 5 questions sur : ")} className="laura-btn laura-btn-ghost" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}>Quiz</button>
            </div>
 
            <div style={{ position: 'relative' }}>
              <textarea 
                id="chat-textarea"
                rows="3" 
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
                  width: '100%', padding: '1rem 4rem 1rem 1rem', borderRadius: 'var(--r-md)', 
                  border: '1px solid var(--laura-border-strong)', fontSize: '16px', outline: 'none', 
                  resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--laura-font-body)',
                  background: 'var(--laura-surface)'
                }}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading}
                style={{ 
                  position: 'absolute', right: '12px', bottom: '12px', 
                  background: isLoading ? 'var(--laura-text-3)' : 'var(--laura-text-1)', 
                  color: 'white', border: 'none', width: '36px', height: '36px', 
                  borderRadius: '8px', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {isLoading ? '...' : '→'}
              </button>
            </div>
          </div>
 
        </div>
 
      </div>
    </div>
  );
}

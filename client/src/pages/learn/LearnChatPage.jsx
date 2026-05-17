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
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
          setMessages(chatSnap.data().messages || []);
        }
      } catch (e) {
        console.error("Erreur de chargement de l'historique :", e);
      } finally {
        setIsInitializing(false);
      }
    }
    loadHistory();
  }, [userProfile?.uid]);

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
      const response = await fetch('/api/chat', {
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
      const errorMsgObj = { role: 'laura', text: "⚠️ Une erreur de connexion au serveur est survenue. Si vous êtes en environnement de développement local, assurez-vous que le serveur backend Express est bien démarré (exécutez `npm start` ou `node server/index.js` dans un terminal).", timestamp: new Date().toISOString() };
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
    <div style={{ display: 'flex', height: '100%', gap: '2rem' }}>
      
      {/* ZONE CENTRALE : CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1.2rem', border: '1px solid #E5E5E2', overflow: 'hidden' }}>
        
        {/* En-tête du Chat */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E5E2', background: '#FAFAFA' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Préparation {profileContext.examen}</h2>
          <span style={{ color: '#6E6E6B', fontSize: '0.9rem' }}>Chat Contextuel LAURA</span>
        </div>

        {/* Liste des Messages */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {isInitializing ? (
            <div style={{ textAlign: 'center', color: '#6E6E6B', padding: '2rem' }}>Chargement de l'historique...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6E6E6B', padding: '2rem' }}>Aucun message. Posez votre première question à LAURA !</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: m.role === 'user' ? '#00D4AA' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                  {m.role === 'user' ? 'A' : 'L'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>
                    {m.role === 'user' ? 'Vous' : 'LAURA'}
                  </div>
                  <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                  
                  {/* Actions sur la réponse de l'IA */}
                  {m.role === 'laura' && (
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => handleSend("Peux-tu réexpliquer cela de manière plus simple et imagée ?")} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>Simplifier</button>
                      <button onClick={() => handleSend("Peux-tu approfondir cette explication avec des exemples concrets et avancés ?")} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>Approfondir</button>
                      <button onClick={() => handleSend("Génère un petit quiz sur l'explication que tu viens de donner pour vérifier ma compréhension.")} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>Générer quiz</button>
                      <button onClick={() => handleSend("Donne-moi un exercice d'application similaire pour m'entraîner.")} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>Exercice similaire</button>
                      <button onClick={() => handleSaveMessage(m.text)} style={{ background: '#10B981', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Sauvegarder</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zone de Saisie */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', background: '#FAFAFA' }}>
          
          {attachedFile && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>📎 Fichier / Cours joint :</span>
                  <span style={{ background: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #D1FAE5' }}>{attachedFile.name}</span>
                </div>
                <button onClick={() => setAttachedFile(null)} style={{ background: 'transparent', border: 'none', color: '#065F46', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    const prompt = `[📎 Cours partagé : ${attachedFile.name}] J'ai partagé mon cours avec toi. Peux-tu analyser ce document et créer un quiz interactif complet (avec QCM et explications) pour tester mes connaissances sur ce cours ?`;
                    setAttachedFile(null);
                    handleSend(prompt);
                  }}
                  style={{ background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
                >
                  <span>✨</span> Transformer mon cours en Quiz interactif
                </button>
                <span style={{ fontSize: '0.85rem', color: '#047857' }}>Ou posez une question personnalisée ci-dessous ↓</span>
              </div>
            </div>
          )}

          {/* Actions rapides de saisie */}
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'center' }}>
            <label style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
              <span>📎</span> Partager un cours / fichier
              <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
            </label>
            <div style={{ width: '1px', background: '#E5E5E2', height: '20px', margin: '0 0.2rem' }}></div>
            <button onClick={() => handleActionPrompt("Peux-tu m'expliquer en détail le concept suivant : ")} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Expliquer</button>
            <button onClick={() => handleActionPrompt("Je souhaite faire une session de révision complète sur : ")} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Réviser</button>
            <button onClick={() => handleActionPrompt("Voici mon exercice/devoir, peux-tu le corriger et m'expliquer mes erreurs : ")} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Corriger</button>
            <button onClick={() => handleActionPrompt("Génère un quiz de 5 questions avec corrigé sur : ")} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>Quiz</button>
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
              style={{ width: '100%', padding: '1rem 4rem 1rem 1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', fontSize: '1.05rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading}
              style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: isLoading ? '#6E6E6B' : '#1A1A1A', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>
        </div>

      </div>

      {/* ZONE LATÉRALE : CONTEXTE */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
        
        {/* Contexte Profil */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Contexte Profil</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Profil</span><span style={{ fontWeight: 600 }}>{profileContext.role}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Niveau</span><span style={{ fontWeight: 600 }}>{profileContext.niveau}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Série</span><span style={{ fontWeight: 600 }}>{profileContext.serie}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Examen</span><span style={{ fontWeight: 600 }}>{profileContext.examen}</span></div>
          </div>
        </div>

        {/* Ressources Liées */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Ressources liées</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#444', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ color: '#6E6E6B', fontSize: '0.9rem', listStyle: 'none', marginLeft: '-1.2rem' }}>Aucune ressource pour l'instant</li>
          </ul>
        </div>

        {/* Suggestions */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Suggestions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => handleSend("Donne-moi un quiz rapide de 3 questions sur mon programme actuel.")} style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444', fontWeight: 600 }}>Donne un quiz</button>
            <button onClick={() => handleSend("Donne-moi un exercice type d'examen avec son corrigé détaillé.")} style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444', fontWeight: 600 }}>Exercice type</button>
            <button onClick={() => handleSend("Peux-tu simplifier les concepts clés de mon programme actuel ?")} style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444', fontWeight: 600 }}>Simplifie ce concept</button>
          </div>
        </div>

      </div>

    </div>
  );
}

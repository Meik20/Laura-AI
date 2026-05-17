import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';

export default function LearnChatPage() {
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    const userMsgObj = { role: 'user', text: userText, timestamp: new Date().toISOString() };
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
        body: JSON.stringify({ message: userText, mode: 'simple', userContext: profileContext })
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
      const errorMsgObj = { role: 'laura', text: "Une erreur de réseau est survenue. Veuillez réessayer.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsgObj]);
      
      if (userProfile?.uid) {
        const chatRef = doc(db, 'chats', userProfile.uid);
        setDoc(chatRef, { messages: arrayUnion(errorMsgObj) }, { merge: true }).catch(console.error);
      }
    } finally {
      setIsLoading(false);
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
                  
                  {/* Actions sur la réponse de l'IA (Point 9.3) */}
                  {m.role === 'laura' && (
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      {['Simplifier', 'Approfondir', 'Générer quiz', 'Exercice similaire', 'Sauvegarder'].map(action => (
                        <button key={action} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Zone de Saisie */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', background: '#FAFAFA' }}>
          
          {/* Actions rapides de saisie (Point 9.3) */}
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6E6E6B', fontWeight: 600, fontSize: '0.9rem' }}>
              <span>📎</span> Joindre fichier
            </button>
            <div style={{ width: '1px', background: '#E5E5E2', margin: '0 0.5rem' }}></div>
            {['Expliquer', 'Réviser', 'Corriger', 'Quiz'].map(action => (
              <button key={action} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {action}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea 
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
              onClick={handleSend}
              disabled={isLoading}
              style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: isLoading ? '#6E6E6B' : '#1A1A1A', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>
        </div>

      </div>

      {/* ZONE LATÉRALE : CONTEXTE (Point 9.2) */}
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
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Donne un quiz</button>
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Exercice type</button>
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Simplifie ce concept</button>
          </div>
        </div>

      </div>

    </div>
  );
}

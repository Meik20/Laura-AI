import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';

export default function TutorChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, userProfile } = useAuth();
  
  const uid = currentUser?.uid || userProfile?.uid;

  const profileContext = {
    prenom: userProfile?.prenom || userProfile?.nom || 'Tuteur',
    discipline: userProfile?.discipline || userProfile?.filiere || 'Général',
    etablissement: userProfile?.etablissement || 'Non défini'
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
    "Générer un plan de cours",
    "Créer un exercice",
    "Préparer un support visuel",
    "Reformuler cette leçon",
    "Produire un brouillon"
  ];

  useEffect(() => {
    async function loadHistory() {
      if (!uid) return;
      try {
        const chatRef = doc(db, 'chats', uid);
        const welcomeMsg = {
          role: 'laura',
          text: `Bonjour Professeur ${profileContext.prenom}. Je suis configurée pour vous assister dans la création de matériel pédagogique en ${profileContext.discipline}. Que souhaitez-vous préparer aujourd'hui ?`,
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
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullUserText, mode: 'simple', userContext: profileContext })
      });
      
      const data = await response.json();
      
      const lauraText = data.response || data.error || "Désolée, je n'ai pas pu formuler une réponse.";
      const lauraMsgObj = { role: 'laura', text: lauraText, timestamp: new Date().toISOString() };
      
      setMessages(prev => [...prev, lauraMsgObj]);

      if (uid) {
        const chatRef = doc(db, 'chats', uid);
        setDoc(chatRef, { messages: arrayUnion(lauraMsgObj) }, { merge: true }).catch(console.error);
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsgObj = { role: 'laura', text: "⚠️ Oups ! Je n'arrive pas à joindre le serveur pour le moment. Vérifiez votre connexion internet ou réessayez dans quelques instants.", timestamp: new Date().toISOString() };
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
      alert("Aucun contenu généré par LAURA à convertir.");
      return;
    }
    if (!uid) {
      alert("Utilisateur non identifié.");
      return;
    }

    try {
      const newRes = {
        titre: `Support généré par IA - ${new Date().toLocaleDateString()}`,
        type: 'Support',
        statut: 'brouillon',
        contenu: lastLauraMsg.text,
        auteurId: uid,
        auteur: userProfile?.nom || userProfile?.prenom || 'Tuteur',
        matiere: profileContext.discipline,
        niveau: userProfile?.niveau || 'Général',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'resources'), newRes);
      alert("Contenu exporté avec succès dans vos soumissions (Brouillon) !");
    } catch (err) {
      console.error("Erreur export soumission:", err);
      alert("Erreur lors de l'exportation.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Chat Pédagogique</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1rem' }}>
            Utilisez l'IA pour générer et structurer vos contenus avant de les soumettre.
          </p>
        </div>
        <button 
          onClick={async () => {
            const welcomeMsg = {
              role: 'laura',
              text: `Bonjour Professeur ${profileContext.prenom}. Je suis configurée pour vous assister dans la création de matériel pédagogique en ${profileContext.discipline}. Que souhaitez-vous préparer aujourd'hui ?`,
              timestamp: new Date().toISOString()
            };
            setMessages([welcomeMsg]);
            if (uid) {
              await setDoc(doc(db, 'chats', uid), { messages: [welcomeMsg] });
            }
          }} 
          style={{ padding: '0.8rem 1.5rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#008563'} 
          onMouseLeave={e => e.currentTarget.style.background = '#00A37A'}
        >
          <span>+</span> Nouvelle conversation
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
        
        {/* CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1.5rem', border: '1px solid #E5E5E2', overflow: 'hidden' }}>
          
          {/* Messages */}
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {isInitializing ? (
              <div style={{ textAlign: 'center', color: '#6E6E6B', padding: '2rem' }}>Chargement du chat pédagogique...</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, background: m.role === 'user' ? '#00A37A' : 'white', border: m.role === 'user' ? 'none' : '1px solid #E5E5E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem', overflow: 'hidden', boxShadow: m.role === 'user' ? 'none' : '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {m.role === 'user' ? 'Vous' : (
                      <img src="/icon.png" alt="LAURA" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>
                      {m.role === 'user' ? 'Vous' : 'LAURA Pédagogie'}
                    </div>
                    <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', background: '#FAFAFA' }}>
            
            {attachedFile && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>📎 Fichier joint :</span>
                    <span style={{ background: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #D1FAE5' }}>{attachedFile.name}</span>
                  </div>
                  <button onClick={() => setAttachedFile(null)} style={{ background: 'transparent', border: 'none', color: '#065F46', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      const prompt = `[📎 Document joint : ${attachedFile.name}] J'ai partagé ce document pédagogique avec toi. Peux-tu l'analyser et m'aider à concevoir une fiche d'exercices d'application complète avec corrigé ?`;
                      setAttachedFile(null);
                      handleSend(prompt);
                    }}
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}
                  >
                    <span>✨</span> Concevoir des exercices à partir de ce cours
                  </button>
                  <span style={{ fontSize: '0.85rem', color: '#047857' }}>Ou posez une question personnalisée ci-dessous ↓</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'center' }}>
              <label style={{ background: '#00A37A', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0, 163, 122, 0.2)' }}>
                <span>📎</span> Importer un cours / fichier
                <input type="file" onChange={handleFileAttachment} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea 
                rows="3" 
                placeholder="Ex: Génère un quiz de 5 questions sur le théorème de Thalès pour des élèves de 3ème..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ width: '100%', padding: '1rem 4.5rem 1rem 1rem', borderRadius: '1rem', border: '1px solid #E5E5E2', fontSize: '1.05rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading}
                style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: isLoading ? '#6E6E6B' : '#1A1A1A', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? '...' : '→'}
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR SUGGESTIONS */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#1A1A1A', padding: '1.5rem', borderRadius: '1.5rem', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', fontWeight: 700 }}>Suggestions rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.8rem 1rem', borderRadius: '0.5rem', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Export & Soumission</h3>
            <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Une fois votre contenu généré et affiné, vous pourrez l'exporter directement comme brouillon dans vos soumissions.
            </p>
            <button onClick={handleConvertToSubmission} style={{ width: '100%', padding: '0.8rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
              Convertir en soumission
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

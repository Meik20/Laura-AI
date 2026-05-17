import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function TutorHistoryPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!userProfile?.uid) return;
      try {
        // Fetch chat messages
        const chatSnap = await getDoc(doc(db, 'chats', userProfile.uid));
        let chatMsgs = [];
        if (chatSnap.exists() && chatSnap.data().messages) {
          const allMsgs = chatSnap.data().messages;
          allMsgs.forEach((m, idx) => {
            if (m.role === 'user') {
              chatMsgs.push({
                id: `chat-${idx}`,
                typeDoc: 'chat',
                title: m.text,
                createdAt: m.timestamp || new Date().toISOString(),
                preview: allMsgs[idx + 1]?.text || 'En attente de réponse...'
              });
            }
          });
        }

        // Fetch submissions
        const resSnap = await getDocs(collection(db, 'resources'));
        let subMsgs = [];
        resSnap.forEach(d => {
          const data = d.data();
          if (data.auteurId === userProfile.uid) {
            subMsgs.push({
              id: d.id,
              typeDoc: 'submission',
              title: data.titre || 'Soumission',
              createdAt: data.createdAt || new Date().toISOString(),
              preview: `Type : ${data.type || 'Général'} · Statut : ${data.statut || 'Brouillon'}`
            });
          }
        });

        const combined = [...chatMsgs, ...subMsgs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryItems(combined);
      } catch (err) {
        console.error("Erreur de récupération de l'historique tuteur :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [userProfile?.uid]);

  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Historique Pédagogique</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Retrouvez vos anciennes conversations avec l'IA et vos soumissions de ressources.
        </p>
      </div>

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6E6E6B', fontSize: '1.1rem' }}>Chargement de l'historique...</div>
        ) : historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6E6E6B', fontSize: '1.1rem' }}>Aucun historique disponible. Démarrez un chat ou une soumission !</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {historyItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#FAFAFA', borderRadius: '1.2rem', border: '1px solid #F0F0EE', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ flex: 1, marginRight: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: item.typeDoc === 'submission' ? '#E0F2FE' : '#FEF3C7', color: item.typeDoc === 'submission' ? '#0369A1' : '#D97706', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {item.typeDoc === 'submission' ? 'Soumission' : 'Chat Pédagogique'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>
                      {new Date(item.createdAt).toLocaleDateString()} à {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A' }}>
                    {item.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#6E6E6B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.preview}
                  </p>
                </div>

                <button onClick={() => item.typeDoc === 'submission' ? navigate('/tutor/submissions') : navigate('/tutor/chat')} style={{ padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                  {item.typeDoc === 'submission' ? 'Gérer' : 'Reprendre'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

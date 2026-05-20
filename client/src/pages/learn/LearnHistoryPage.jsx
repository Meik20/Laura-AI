import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LearnHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!userProfile?.uid) return;
      try {
        // Fetch sessions de révision
        const sessionsSnap = await getDocs(collection(db, 'users', userProfile.uid, 'sessions'));
        const sessionsData = sessionsSnap.docs.map(d => ({ id: d.id, typeDoc: 'session', ...d.data() }));

        // Fetch messages du chat principal
        const chatSnap = await getDoc(doc(db, 'chats', userProfile.uid));
        let chatMsgs = [];
        if (chatSnap.exists() && chatSnap.data().messages) {
          const allMsgs = chatSnap.data().messages;
          // Regrouper les messages par questions de l'utilisateur
          allMsgs.forEach((m, idx) => {
            if (m.role === 'user') {
              chatMsgs.push({
                id: `chat-${idx}`,
                typeDoc: 'chat',
                title: m.text,
                createdAt: m.timestamp || new Date().toISOString(),
                preview: allMsgs[idx + 1]?.text || t('learn.history.waiting_reply', 'En attente de réponse...')
              });
            }
          });
        }

        const combined = [...sessionsData, ...chatMsgs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSessions(combined);
      } catch (err) {
        console.error("Erreur de récupération de l'historique :", err);
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>{t('learn.history.title', "Historique d'apprentissage")}</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          {t('learn.history.subtitle', "Retrouvez vos anciennes conversations et sessions de révision avec LAURA.")}
        </p>
      </div>

      <div className="learn-card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6E6E6B', fontSize: '1.1rem' }}>{t('learn.history.loading', "Chargement de l'historique...")}</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6E6E6B', fontSize: '1.1rem' }}>{t('learn.history.empty', "Aucun historique disponible. Démarrez une conversation ou une révision !")}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {sessions.map(item => (
              <div key={item.id} className="history-item-row" style={{ padding: '1.5rem', background: '#FAFAFA', borderRadius: '1.2rem', border: '1px solid #F0F0EE', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ flex: 1, marginRight: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: item.typeDoc === 'session' ? '#E0F2FE' : '#FEF3C7', color: item.typeDoc === 'session' ? '#0369A1' : '#D97706', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      {item.typeDoc === 'session' ? t('learn.history.type_session', 'Session de Révision') : t('learn.history.type_chat', 'Chat IA')}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>
                      {new Date(item.createdAt).toLocaleDateString()} à {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A' }}>
                    {item.typeDoc === 'session' ? `${item.type} : ${item.chapitre}` : item.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#6E6E6B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.typeDoc === 'session' ? `${t('learn.history.subject', 'Matière')} : ${item.matiere} · ${t('learn.history.duration', 'Durée')} : ${item.duree} ${t('learn.history.min', 'min')}` : item.preview}
                  </p>
                </div>
 
                <button onClick={() => item.typeDoc === 'session' ? navigate(`/learn/chat?sessionId=${item.id}&matiere=${encodeURIComponent(item.matiere)}&chapitre=${encodeURIComponent(item.chapitre)}`) : navigate('/learn/chat')} style={{ padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                  {t('learn.history.resume_btn', 'Reprendre')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

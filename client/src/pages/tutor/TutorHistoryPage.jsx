import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function TutorHistoryPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const uid = currentUser?.uid || userProfile?.uid;

  useEffect(() => {
    async function fetchHistory() {
      if (!uid) return;
      try {
        // Fetch chat messages
        const chatSnap = await getDoc(doc(db, 'chats', uid));
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
                preview: allMsgs[idx + 1]?.text || t('tutor.history.waiting_reply', 'En attente de réponse...')
              });
            }
          });
        }

        // Fetch submissions
        const resSnap = await getDocs(collection(db, 'resources'));
        let subMsgs = [];
        resSnap.forEach(d => {
          const data = d.data();
          if (data.auteurId === uid) {
            subMsgs.push({
              id: d.id,
              typeDoc: 'submission',
              title: data.titre || t('tutor.submissions.table.untitled', 'Sans titre'),
              createdAt: data.createdAt || new Date().toISOString(),
              preview: t('tutor.history.preview_submission', {
                type: data.type || t('tutor.resources.general', 'Général'),
                status: data.statut || t('tutor.submissions.table.status_brouillon', 'Brouillon')
              })
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
  }, [uid]);

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="stack stack--lg animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div>
        <h1 className="laura-h1">{t('tutor.history.title', 'Historique Pédagogique')}</h1>
        <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
          {t('tutor.history.subtitle', "Retrouvez vos anciennes conversations avec l'IA et vos soumissions de ressources.")}
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        {isLoading ? (
          <div className="empty-state">
            <span className="empty-state__icon">⏳</span>
            <p className="empty-state__title">{t('tutor.history.loading', 'Chargement de l\'historique...')}</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📭</span>
            <p className="empty-state__title">{t('tutor.history.empty', 'Aucun historique disponible')}</p>
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>{t('tutor.history.empty_hint', 'Démarrez un chat ou une soumission !')}</p>
          </div>
        ) : (
          <div className="stack stack--md">
            {historyItems.map(item => (
              <div key={item.id} className="row row--between" style={{ padding: 'var(--sp-4)', background: 'var(--srf-raised)', borderRadius: 'var(--rd-lg)', border: '1px solid var(--brd-subtle)', alignItems: 'center', gap: 'var(--sp-4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <span className={`badge ${item.typeDoc === 'submission' ? 'badge--brand' : 'badge--warning'}`}>
                      {item.typeDoc === 'submission' ? t('tutor.history.submission_label', 'Soumission') : t('tutor.history.chat_label', 'Chat Pédagogique')}
                    </span>
                    <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
                      {new Date(item.createdAt).toLocaleDateString(locale)} à {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="truncate" style={{ margin: '0 0 var(--sp-1) 0', fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="truncate" style={{ margin: 0, fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                    {item.preview}
                  </p>
                </div>

                <button onClick={() => item.typeDoc === 'submission' ? navigate('/tutor/submissions') : navigate('/tutor/chat')} className="laura-btn laura-btn-secondary" style={{ minHeight: '34px', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap' }}>
                  {item.typeDoc === 'submission' ? t('tutor.history.btn_manage', 'Gérer') : t('tutor.history.btn_resume', 'Reprendre')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

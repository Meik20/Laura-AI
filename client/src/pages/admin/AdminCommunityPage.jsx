import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, deleteDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function AdminCommunityPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [forums, setForums] = useState({});

  useEffect(() => {
    // Listen to forum memberships
    const q = query(collection(db, 'forum_memberships'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(reqs);

      // Fetch forum details for these requests
      const forumIds = [...new Set(reqs.map(r => r.forumId))];
      const forumsData = { ...forums };
      for (const fId of forumIds) {
        if (!forumsData[fId]) {
          const fDoc = await getDoc(doc(db, 'forums', fId));
          if (fDoc.exists()) forumsData[fId] = fDoc.data();
        }
      }
      setForums(forumsData);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Admin actions to delete or suspend a forum
  const handleDeleteForum = async (forumId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce forum ? Cette action est irréversible.')) return;
    try {
      // Delete forum document
      await deleteDoc(doc(db, 'forums', forumId));
      // Delete related memberships
      const membershipsSnap = await getDocs(query(collection(db, 'forum_memberships'), where('forumId', '==', forumId)));
      const batch = writeBatch(db);
      membershipsSnap.forEach((docSnap) => batch.delete(doc(db, 'forum_memberships', docSnap.id)));
      await batch.commit();
      toast.success('Forum supprimé avec succès');
    } catch (e) {
      console.error('Erreur suppression forum:', e);
      toast.error('Erreur lors de la suppression du forum');
    }
  };

  const handleSuspendForum = async (forumId) => {
    if (!window.confirm('Suspendre ce forum ? Les membres ne pourront plus y accéder.')) return;
    try {
      await updateDoc(doc(db, 'forums', forumId), { statut: 'suspendu' });
      toast.success('Forum suspendu');
    } catch (e) {
      console.error('Erreur suspension forum:', e);
      toast.error('Erreur lors de la suspension du forum');
    }
  };

  const handleAction = async (reqId, newStatus) => {
    try {
      await updateDoc(doc(db, 'forum_memberships', reqId), { statut: newStatus });
      setSelectedUser(null);
    } catch (e) {
      console.error("Erreur update statut:", e);
      alert(t('admin.community.error_update'));
    }
  };
  return (
    <div className="stack stack--lg">
      <div className="page-header">
        <h1 className="laura-h1">{t('admin.community.title')}</h1>
        <p style={{ marginTop: 'var(--sp-1)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
          {t('admin.community.subtitle')}
        </p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Liste des demandes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--brd-subtle)' }}>
            <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>{t('admin.community.requests')}</h2>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.community.loading')}</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.community.empty')}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="laura-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--srf-raised)', borderBottom: '1px solid var(--brd-subtle)' }}>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>{t('admin.community.table.student')}</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>{t('admin.community.table.forum')}</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>{t('admin.community.table.status')}</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right', fontSize: 'var(--tx-xs)' }}>{t('admin.community.table.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => {
                      const forum = forums[req.forumId];
                      return (
                        <tr key={req.id} style={{ borderBottom: '1px solid var(--brd-subtle)' }}>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                            <div style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--tx-sm)' }}>{req.userName}</div>
                            <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>{req.userEmail}</div>
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--tx-sm)' }}>
                            {forum?.nom || 'Forum inconnu'}
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                            <span className={`badge ${req.statut === 'approuve' ? 'badge--success' : req.statut === 'rejete' ? 'badge--error' : 'badge--warning'}`}>
                              {req.statut}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedUser(req)}
                              className="laura-btn laura-btn-ghost"
                              style={{ minHeight: '32px', fontSize: 'var(--tx-xs)' }}
                            >
                              {t('admin.community.actions.view_profile')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral : Profil utilisateur */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--brd-subtle)' }}>
            <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>{t('admin.community.modal.title')}</h2>
          </div>
          <div className="card__body" style={{ padding: 'var(--sp-5)' }}>
            {selectedUser ? (
              <div className="stack stack--md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--rd-full)', background: 'var(--clr-brand-lt)', color: 'var(--clr-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--fw-bold)', fontSize: '1.2rem' }}>
                    {selectedUser.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--tx-base)' }}>{selectedUser.userName}</h3>
                    <p style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>{selectedUser.userEmail}</p>
                  </div>
                </div>

                <div style={{ background: 'var(--srf-raised)', padding: 'var(--sp-4)', borderRadius: 'var(--rd-md)', fontSize: 'var(--tx-sm)' }}>
                  <div style={{ marginBottom: 'var(--sp-2)' }}><strong>{t('admin.community.modal.level')}</strong> {selectedUser.userNiveau || t('admin.community.modal.not_specified')}</div>
                  <div style={{ marginBottom: 'var(--sp-2)' }}><strong>{t('admin.community.modal.serie')}</strong> {selectedUser.userSerie || t('admin.community.modal.not_specified')}</div>
                  <div><strong>{t('admin.community.modal.exam')}</strong> {selectedUser.userExamen || t('admin.community.modal.not_specified')}</div>
                </div>

                <div style={{ padding: 'var(--sp-3)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)' }}>
                  <p style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>
                    {t('admin.community.modal.requested_forum')} <strong>{forums[selectedUser.forumId]?.nom}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--tx-xs)' }}>
                    {t('admin.community.modal.check_profile')}
                  </p>
                </div>

                {selectedUser.statut === 'en_attente' && (
                  <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
                    <button onClick={() => handleAction(selectedUser.id, 'rejete')} className="laura-btn laura-btn-ghost" style={{ flex: 1, color: 'var(--clr-error)' }}>
                      {t('admin.community.actions.reject')}
                    </button>
                    <button onClick={() => handleAction(selectedUser.id, 'approuve')} className="laura-btn laura-btn-primary" style={{ flex: 1, background: 'var(--clr-success)', borderColor: 'var(--clr-success)' }}>
                      {t('admin.community.actions.approve')}
                    </button>
                  </div>
                )}
                {selectedUser.statut !== 'en_attente' && (
                  <div style={{ textAlign: 'center', color: 'var(--txt-tertiary)', fontSize: 'var(--tx-sm)', marginTop: 'var(--sp-4)' }}>
                    {t('admin.community.status_already', { status: selectedUser.statut })}
                    <button onClick={() => handleAction(selectedUser.id, 'en_attente')} className="laura-btn laura-btn-ghost" style={{ marginTop: 'var(--sp-2)', width: '100%' }}>
                      {t('admin.community.actions.reset_pending')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--txt-tertiary)', padding: 'var(--sp-8) 0' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--sp-2)' }}>👤</span>
                {t('admin.community.select_profile_hint')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

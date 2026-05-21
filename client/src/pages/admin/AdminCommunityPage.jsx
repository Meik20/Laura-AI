import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, deleteDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function AdminCommunityPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [allForums, setAllForums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [forums, setForums] = useState({});
  const [activeTab, setActiveTab] = useState('forums'); // 'forums' | 'requests'
  const [memberCounts, setMemberCounts] = useState({}); // forumId -> count

  // 1. Listen to all forums in real-time
  useEffect(() => {
    const qForums = query(collection(db, 'forums'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(qForums, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllForums(data);
      // Also build the forums lookup map
      const forumsMap = {};
      data.forEach(f => { forumsMap[f.id] = f; });
      setForums(forumsMap);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Listen to forum memberships (requests)
  useEffect(() => {
    const q = query(collection(db, 'forum_memberships'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(reqs);

      // Count approved members per forum
      const counts = {};
      reqs.forEach(r => {
        if (r.statut === 'approuve') {
          counts[r.forumId] = (counts[r.forumId] || 0) + 1;
        }
      });
      setMemberCounts(counts);
    });
    return () => unsub();
  }, []);

  // ── Admin Forum Actions ──

  const handleDeleteForum = async (forumId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce forum ? Cette action est irréversible.')) return;
    try {
      await deleteDoc(doc(db, 'forums', forumId));
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

  const handleReactivateForum = async (forumId) => {
    try {
      await updateDoc(doc(db, 'forums', forumId), { statut: 'actif' });
      toast.success('Forum réactivé');
    } catch (e) {
      console.error('Erreur réactivation forum:', e);
      toast.error('Erreur lors de la réactivation du forum');
    }
  };

  const handleApproveForum = async (forum) => {
    try {
      // 1. Approve the forum
      await updateDoc(doc(db, 'forums', forum.id), { statut: 'actif' });
      
      // 2. Automatically approve the creator's membership
      if (forum.createurId) {
        const membershipsSnap = await getDocs(
          query(
            collection(db, 'forum_memberships'), 
            where('forumId', '==', forum.id),
            where('userId', '==', forum.createurId),
            where('statut', '==', 'en_attente')
          )
        );
        const batch = writeBatch(db);
        membershipsSnap.forEach((docSnap) => {
          batch.update(doc(db, 'forum_memberships', docSnap.id), { statut: 'approuve' });
        });
        await batch.commit();
      }

      toast.success('Forum approuvé et activé avec succès');
    } catch (e) {
      console.error('Erreur approbation forum:', e);
      toast.error("Erreur lors de l'approbation du forum");
    }
  };

  // ── Admin Membership Actions ──

  const handleAction = async (reqId, newStatus) => {
    try {
      await updateDoc(doc(db, 'forum_memberships', reqId), { statut: newStatus });
      setSelectedUser(null);
    } catch (e) {
      console.error("Erreur update statut:", e);
      alert(t('admin.community.error_update'));
    }
  };

  // ── Helpers ──

  const pendingCount = requests.filter(r => r.statut === 'en_attente').length;

  const tabStyle = (tab) => ({
    padding: 'var(--sp-3) var(--sp-5)',
    fontSize: 'var(--tx-sm)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: activeTab === tab ? 'var(--clr-brand)' : 'var(--txt-secondary)',
    borderBottom: activeTab === tab ? '2px solid var(--clr-brand)' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div className="stack stack--lg">
      <div className="page-header">
        <h1 className="laura-h1">{t('admin.community.title')}</h1>
        <p style={{ marginTop: 'var(--sp-1)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
          {t('admin.community.subtitle')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--brd-subtle)', marginBottom: 'var(--sp-4)' }}>
        <button style={tabStyle('forums')} onClick={() => setActiveTab('forums')}>
          <i className="ti ti-building-community" style={{ marginRight: 'var(--sp-2)' }} />
          Forums ({allForums.length})
        </button>
        <button style={tabStyle('requests')} onClick={() => setActiveTab('requests')}>
          <i className="ti ti-clipboard-list" style={{ marginRight: 'var(--sp-2)' }} />
          Demandes {pendingCount > 0 && <span style={{ marginLeft: '6px', background: 'var(--clr-error)', color: 'white', borderRadius: 'var(--rd-full)', padding: '1px 8px', fontSize: '11px' }}>{pendingCount}</span>}
        </button>
      </div>

      {/* ═══════════ TAB: FORUMS MANAGEMENT ═══════════ */}
      {activeTab === 'forums' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card__header" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--brd-subtle)' }}>
            <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>Gestion des forums de classe</h2>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.community.loading')}</div>
            ) : allForums.length === 0 ? (
              <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                <i className="ti ti-building-community" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--sp-3)', color: 'var(--clr-brand)' }} />
                Aucun forum de classe n'a encore été créé.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="laura-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--srf-raised)', borderBottom: '1px solid var(--brd-subtle)' }}>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>Forum</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>Niveau</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontSize: 'var(--tx-xs)' }}>Série</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'center', fontSize: 'var(--tx-xs)' }}>Membres</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'center', fontSize: 'var(--tx-xs)' }}>Statut</th>
                      <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right', fontSize: 'var(--tx-xs)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allForums.map(f => {
                      const isSuspended = f.statut === 'suspendu';
                      const isPending = f.statut === 'en_attente';
                      return (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--brd-subtle)', opacity: isSuspended ? 0.6 : 1 }}>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
                            <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>{f.nom}</div>
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--tx-sm)' }}>{f.niveau || '—'}</td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', fontSize: 'var(--tx-sm)' }}>{f.serie || '—'}</td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'center', fontSize: 'var(--tx-sm)' }}>
                            <span style={{ 
                              background: 'var(--clr-brand-lt)', 
                              color: 'var(--clr-brand)', 
                              padding: '2px 10px', 
                              borderRadius: 'var(--rd-full)', 
                              fontWeight: 'var(--fw-bold)', 
                              fontSize: 'var(--tx-xs)' 
                            }}>
                              {memberCounts[f.id] || 0}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'center' }}>
                            {isPending ? (
                              <span className="badge badge--warning">
                                <i className="ti ti-hourglass" style={{ marginRight: '4px' }} />
                                En attente
                              </span>
                            ) : (
                              <span className={`badge ${isSuspended ? 'badge--error' : 'badge--success'}`}>
                                <i className={`ti ti-${isSuspended ? 'ban' : 'circle-check'}`} style={{ marginRight: '4px' }} />
                                {isSuspended ? 'Suspendu' : 'Actif'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
                              {isPending && (
                                <button
                                  onClick={() => handleApproveForum(f)}
                                  className="laura-btn laura-btn-ghost"
                                  style={{ minHeight: '30px', fontSize: 'var(--tx-xs)', color: 'var(--clr-success)' }}
                                >
                                  <i className="ti ti-check" style={{ marginRight: '4px' }} /> Approuver
                                </button>
                              )}
                              {isSuspended ? (
                                <button
                                  onClick={() => handleReactivateForum(f.id)}
                                  className="laura-btn laura-btn-ghost"
                                  style={{ minHeight: '30px', fontSize: 'var(--tx-xs)', color: 'var(--clr-success)' }}
                                >
                                  <i className="ti ti-lock-open" style={{ marginRight: '4px' }} /> Réactiver
                                </button>
                              ) : f.statut === 'actif' || !f.statut ? (
                                <button
                                  onClick={() => handleSuspendForum(f.id)}
                                  className="laura-btn laura-btn-ghost"
                                  style={{ minHeight: '30px', fontSize: 'var(--tx-xs)', color: 'var(--clr-warning)' }}
                                >
                                  <i className="ti ti-player-pause" style={{ marginRight: '4px' }} /> Suspendre
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleDeleteForum(f.id)}
                                className="laura-btn laura-btn-ghost"
                                style={{ minHeight: '30px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
                              >
                                <i className="ti ti-trash" style={{ marginRight: '4px' }} /> Supprimer
                              </button>
                            </div>
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
      )}

      {/* ═══════════ TAB: MEMBERSHIP REQUESTS ═══════════ */}
      {activeTab === 'requests' && (
        <div className="l-page-grid">
          {/* Liste des demandes — hidden on mobile when a user is selected */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', ...(selectedUser ? { display: 'none' } : {}) }}
               data-panel="list">
            {/* Force display on desktop even when user selected */}
            <style>{`@media (min-width: 1024px) { [data-panel="list"] { display: flex !important; } }`}</style>
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
                          <tr key={req.id} style={{ borderBottom: '1px solid var(--brd-subtle)', cursor: 'pointer' }}
                              onClick={() => setSelectedUser(req)}>
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
                                onClick={e => { e.stopPropagation(); setSelectedUser(req); }}
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

          {/* Panneau détail — always visible on desktop, only when selectedUser on mobile */}
          <div className="card" style={{ display: selectedUser ? 'flex' : 'none', flexDirection: 'column' }}
               data-panel="detail">
            <style>{`@media (min-width: 1024px) { [data-panel="detail"] { display: flex !important; } }`}</style>
            <div className="card__header" style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--brd-subtle)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              {/* Back button — mobile only */}
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="laura-btn laura-btn-ghost mobile-only"
                  style={{ minHeight: '32px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-base)', color: 'var(--txt-secondary)' }}
                  aria-label="Retour"
                >
                  <i className="ti ti-arrow-left" />
                </button>
              )}
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
                  <i className="ti ti-user-circle" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 'var(--sp-2)', color: 'var(--clr-brand)' }} />
                  {t('admin.community.select_profile_hint')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

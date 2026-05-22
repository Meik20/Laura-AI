import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      setMessageTitle('');
      setMessageContent('');
    }
  }, [selectedUser]);

  const handleSendMessage = async () => {
    if (!selectedUser || !messageTitle.trim() || !messageContent.trim()) return;
    setIsSending(true);
    try {
      const messagesRef = collection(db, 'users', selectedUser.id, 'messages');
      await addDoc(messagesRef, {
        title: messageTitle.trim(),
        content: messageContent.trim(),
        createdAt: new Date().toISOString()
      });
      alert("Message envoyé avec succès !");
      setMessageTitle('');
      setMessageContent('');
    } catch (err) {
      console.error("Erreur lors de l'envoi du message :", err);
      alert("Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((docItem) => {
          const data = docItem.data();
          const roleVal = data.roleLabel || (data.role === 'teacher' ? 'Tuteur' : 'Apprenant');
          usersList.push({
            id: docItem.id,
            nom: `${data.prenom || ''} ${data.nom || ''}`.trim() || 'Sans nom',
            role: roleVal,
            rawRole: roleVal.toLowerCase(),
            detail: data.discipline || data.niveau || data.filiere || 'N/A',
            statut: data.statut || (data.isTutorPending ? 'en attente' : 'actif'),
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString('fr-FR') : 'N/A',
            email: data.email || 'N/A',
            raw: data
          });
        });
        setUsers(usersList);
      } catch (err) {
        console.error("Erreur de récupération des utilisateurs :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleGrantContributor = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        statut: 'Contributeur',
        roleLabel: 'Tuteur Contributeur',
        adminMessage: 'Félicitations, vos droits de Tuteur Contributeur ont été validés avec succès !'
      }, { merge: true });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, statut: 'Contributeur', role: 'Tuteur Contributeur', rawRole: 'tuteur contributeur' } : u));
      setSelectedUser(null);
      alert(t('admin.users.modal.success'));
    } catch (err) {
      console.error("Erreur lors de l'attribution des droits :", err);
      alert(t('admin.users.modal.error'));
    }
  };

  const getTranslatedRole = (roleStr) => {
    if (!roleStr) return '';
    const r = roleStr.toLowerCase();
    if (r === 'élève' || r === 'eleve' || r === 'apprenant') return t('common.roles.learner');
    if (r === 'tuteur') return t('common.roles.tutor');
    if (r === 'admin') return t('common.roles.admin');
    if (r === 'étudiant' || r === 'etudiant') return t('admin.users.filters.students');
    if (r === 'tuteur contributeur') return `${t('common.roles.tutor')} Contributor`;
    return roleStr;
  };

  return (
    <div className="stack stack--lg animate-in">
      
      {/* MODAL GÉRER UTILISATEUR */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('admin.users.modal.title')}</h2>
              <button onClick={() => setSelectedUser(null)} className="modal-close" aria-label="Close">✕</button>
            </div>
            
            <div className="modal-panel__body stack stack--md">
              <div className="stack stack--sm" style={{ fontSize: 'var(--tx-sm)' }}>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>{t('admin.users.modal.name')}</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.nom}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>{t('admin.users.modal.email')}</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.email}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>{t('admin.users.modal.current_role')}</strong> <span style={{ color: 'var(--txt-primary)' }}>{getTranslatedRole(selectedUser.role)}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>{t('admin.users.modal.detail')}</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.detail}</span></div>
                <div>
                  <strong style={{ color: 'var(--txt-secondary)' }}>{t('admin.users.modal.status')}</strong>{' '}
                  <span className={`badge ${selectedUser.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--green'}`}>
                    {selectedUser.statut}
                  </span>
                </div>
              </div>

              {selectedUser.statut === 'En attente de contribution' && (
                <div className="alert alert--warning">
                  <span>{t('admin.users.modal.pending_contrib_alert')}</span>
                </div>
              )}

              {/* MESSAGING FORM */}
              <div style={{ borderTop: '1px solid var(--brd-subtle)', paddingTop: 'var(--sp-4)', marginTop: 'var(--sp-2)' }} className="stack stack--xs">
                <h3 className="laura-h3" style={{ fontSize: 'var(--tx-sm)', margin: '0 0 var(--sp-2) 0', fontWeight: 'var(--fw-bold)' }}>
                  📩 Envoyer un message direct
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <input
                    type="text"
                    placeholder="Sujet du message (ex: Session validée, Information...)"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--sp-2) var(--sp-3)',
                      borderRadius: 'var(--rd-md)',
                      border: '1px solid var(--brd-input)',
                      fontSize: 'var(--tx-xs)',
                      background: 'var(--srf-base)',
                      color: 'var(--txt-primary)',
                      fontFamily: 'inherit'
                    }}
                  />
                  <textarea
                    placeholder="Contenu du message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: 'var(--sp-2) var(--sp-3)',
                      borderRadius: 'var(--rd-md)',
                      border: '1px solid var(--brd-input)',
                      fontSize: 'var(--tx-xs)',
                      background: 'var(--srf-base)',
                      color: 'var(--txt-primary)',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageTitle.trim() || !messageContent.trim()}
                    className="btn btn--primary"
                    style={{
                      alignSelf: 'flex-end',
                      fontSize: 'var(--tx-xs)',
                      padding: 'var(--sp-2) var(--sp-4)',
                      marginTop: 'var(--sp-1)'
                    }}
                  >
                    {isSending ? 'Envoi en cours...' : 'Envoyer'}
                  </button>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-4)', borderTop: '1px solid var(--brd-subtle)', paddingTop: 'var(--sp-3)' }}>
                <button onClick={() => setSelectedUser(null)} className="btn btn--secondary">{t('admin.users.modal.close')}</button>
                {selectedUser.statut === 'En attente de contribution' && (
                  <button onClick={() => handleGrantContributor(selectedUser.id)} className="btn btn--primary" style={{ background: 'var(--clr-success)', color: 'white' }}>
                    {t('admin.users.modal.grant')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('admin.users.title')}</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            {t('admin.users.subtitle')}
          </p>
        </div>
      </div>

      <div className="chip-row">
        {[
          { key: 'all', label: t('admin.users.filters.all') },
          { key: 'pupils', label: t('admin.users.filters.pupils') },
          { key: 'students', label: t('admin.users.filters.students') },
          { key: 'tutors', label: t('admin.users.filters.tutors') },
          { key: 'suspended', label: t('admin.users.filters.suspended') }
        ].map((f, i) => (
          <button 
            key={i} 
            onClick={() => setFilter(f.key)}
            className="chip"
            style={{ 
              background: filter === f.key ? 'var(--clr-brand-lt)' : '', 
              color: filter === f.key ? 'var(--clr-brand)' : '', 
              borderColor: filter === f.key ? 'var(--clr-brand)' : '', 
              fontWeight: filter === f.key ? 'var(--fw-bold)' : '' 
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.users.table.user')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.users.table.role')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.users.table.date')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.users.table.status')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>{t('admin.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.users.loading')}</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.users.empty')}</td></tr>
              ) : (
                users
                  .filter(u => {
                    if (filter === 'all') return true;
                    if (filter === 'pupils') return u.rawRole === 'élève' || u.rawRole === 'eleve' || u.rawRole === 'apprenant';
                    if (filter === 'students') return u.rawRole === 'étudiant' || u.rawRole === 'etudiant';
                    if (filter === 'tutors') return u.rawRole.includes('tuteur') || u.rawRole.includes('teacher');
                    if (filter === 'suspended') return u.statut === 'suspendu' || u.statut === 'suspended';
                    return true;
                  })
                  .map((usr, idx) => (
                    <tr key={usr.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <strong style={{ display: 'block', color: 'var(--txt-primary)', fontWeight: 'var(--fw-semibold)' }}>{usr.nom}</strong>
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>{usr.email}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span style={{ color: 'var(--txt-primary)', fontWeight: 'var(--fw-medium)' }}>{getTranslatedRole(usr.role)}</span>
                      <span style={{ color: 'var(--txt-tertiary)', display: 'block', fontSize: 'var(--tx-xs)' }}>{usr.detail}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{usr.date}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${usr.statut === 'Contributeur' ? 'badge--green' : usr.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--brand'}`}>
                        {usr.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <button onClick={() => setSelectedUser(usr)} className="btn btn--secondary btn--sm">{t('admin.users.actions.manage')}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

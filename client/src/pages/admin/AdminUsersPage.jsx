import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((docItem) => {
          const data = docItem.data();
          usersList.push({
            id: docItem.id,
            nom: `${data.prenom || ''} ${data.nom || ''}`.trim() || 'Sans nom',
            role: data.roleLabel || (data.role === 'teacher' ? 'Tuteur' : 'Apprenant'),
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
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, statut: 'Contributeur', role: 'Tuteur Contributeur' } : u));
      setSelectedUser(null);
      alert("Droits de contributeur accordés avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'attribution des droits :", err);
      alert("Erreur lors de l'attribution des droits.");
    }
  };

  return (
    <div className="stack stack--lg animate-in">
      
      {/* MODAL GÉRER UTILISATEUR */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Gestion de l'utilisateur</h2>
              <button onClick={() => setSelectedUser(null)} className="modal-close" aria-label="Fermer">✕</button>
            </div>
            
            <div className="modal-panel__body stack stack--md">
              <div className="stack stack--sm" style={{ fontSize: 'var(--tx-sm)' }}>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Nom :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.nom}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Email :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.email}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Rôle actuel :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.role}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Détail / Discipline :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedUser.detail}</span></div>
                <div>
                  <strong style={{ color: 'var(--txt-secondary)' }}>Statut :</strong>{' '}
                  <span className={`badge ${selectedUser.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--green'}`}>
                    {selectedUser.statut}
                  </span>
                </div>
              </div>

              {selectedUser.statut === 'En attente de contribution' && (
                <div className="alert alert--warning">
                  <span>Cet utilisateur a demandé à devenir <strong>Tuteur Contributeur</strong> pour soumettre des contenus à la communauté.</span>
                </div>
              )}

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
                <button onClick={() => setSelectedUser(null)} className="btn btn--secondary">Fermer</button>
                {selectedUser.statut === 'En attente de contribution' && (
                  <button onClick={() => handleGrantContributor(selectedUser.id)} className="btn btn--primary" style={{ background: 'var(--clr-success)', color: 'white' }}>
                    Accorder droits Contributeur
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Utilisateurs</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Gestion globale des comptes de la plateforme.
          </p>
        </div>
      </div>

      <div className="chip-row">
        {['Tous', 'Élèves', 'Étudiants', 'Tuteurs', 'Suspendus'].map((f, i) => (
          <button 
            key={i} 
            onClick={() => setFilter(f)}
            className="chip"
            style={{ 
              background: filter === f ? 'var(--clr-brand-lt)' : '', 
              color: filter === f ? 'var(--clr-brand)' : '', 
              borderColor: filter === f ? 'var(--clr-brand)' : '', 
              fontWeight: filter === f ? 'var(--fw-bold)' : '' 
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Utilisateur</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rôle & Détail</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date d'inscription</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement des utilisateurs...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Aucun utilisateur trouvé.</td></tr>
              ) : (
                users
                  .filter(u => {
                    if (filter === 'Tous') return true;
                    if (filter === 'Élèves') return u.role === 'Élève';
                    if (filter === 'Étudiants') return u.role === 'Étudiant';
                    if (filter === 'Tuteurs') return u.role.includes('Tuteur');
                    if (filter === 'Suspendus') return u.statut === 'suspendu';
                    return true;
                  })
                  .map((usr, idx) => (
                    <tr key={usr.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <strong style={{ display: 'block', color: 'var(--txt-primary)', fontWeight: 'var(--fw-semibold)' }}>{usr.nom}</strong>
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>{usr.email}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span style={{ color: 'var(--txt-primary)', fontWeight: 'var(--fw-medium)' }}>{usr.role}</span>
                      <span style={{ color: 'var(--txt-tertiary)', display: 'block', fontSize: 'var(--tx-xs)' }}>{usr.detail}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{usr.date}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${usr.statut === 'Contributeur' ? 'badge--green' : usr.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--brand'}`}>
                        {usr.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <button onClick={() => setSelectedUser(usr)} className="btn btn--secondary btn--sm">Gérer</button>
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

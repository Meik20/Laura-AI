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
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* MODAL GÉRER UTILISATEUR */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0F1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '500px', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Gestion de l'utilisateur</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <div><strong style={{ color: '#94A3B8' }}>Nom :</strong> {selectedUser.nom}</div>
              <div><strong style={{ color: '#94A3B8' }}>Email :</strong> {selectedUser.email}</div>
              <div><strong style={{ color: '#94A3B8' }}>Rôle actuel :</strong> {selectedUser.role}</div>
              <div><strong style={{ color: '#94A3B8' }}>Détail / Discipline :</strong> {selectedUser.detail}</div>
              <div><strong style={{ color: '#94A3B8' }}>Statut :</strong> <span style={{ color: selectedUser.statut === 'En attente de contribution' ? '#F59E0B' : '#10B981', fontWeight: 700 }}>{selectedUser.statut}</span></div>
            </div>

            {selectedUser.statut === 'En attente de contribution' && (
              <div style={{ background: '#FEF3C7', color: '#92400E', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.9rem', lineHeight: 1.4 }}>
                Cet utilisateur a demandé à devenir <strong>Tuteur Contributeur</strong> pour soumettre des contenus à la communauté.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
              {selectedUser.statut === 'En attente de contribution' && (
                <button onClick={() => handleGrantContributor(selectedUser.id)} style={{ padding: '0.8rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Accorder droits Contributeur</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Utilisateurs</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>
          Gestion globale des comptes de la plateforme.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {['Tous', 'Élèves', 'Étudiants', 'Tuteurs', 'Suspendus'].map((f, i) => (
          <button 
            key={i} 
            onClick={() => setFilter(f)}
            style={{ 
              background: filter === f ? '#3B82F6' : 'rgba(255,255,255,0.05)', 
              color: filter === f ? 'white' : '#94A3B8', 
              border: 'none', 
              padding: '0.6rem 1.2rem', 
              borderRadius: '2rem', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Utilisateur</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Rôle & Détail</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Date d'inscription</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des utilisateurs...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucun utilisateur trouvé.</td></tr>
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
                .map((usr) => (
                  <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{usr.nom}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{usr.role}</span>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.85rem' }}>{usr.detail}</span>
                  </td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{usr.date}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ background: usr.statut === 'Contributeur' ? '#10B98120' : usr.statut === 'En attente de contribution' ? '#F59E0B20' : '#3B82F620', color: usr.statut === 'Contributeur' ? '#10B981' : usr.statut === 'En attente de contribution' ? '#F59E0B' : '#3B82F6', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {usr.statut.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                    <button onClick={() => setSelectedUser(usr)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Gérer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

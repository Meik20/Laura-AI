import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            nom: `${data.prenom || ''} ${data.nom || ''}`.trim() || 'Sans nom',
            role: data.roleLabel || 'Apprenant',
            detail: data.niveau || data.filiere || 'N/A',
            statut: data.isTutorPending ? 'en attente' : 'actif',
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString('fr-FR') : 'N/A'
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
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
                  if (filter === 'Tuteurs') return u.role === 'Tuteur' || u.isTutor;
                  if (filter === 'Suspendus') return u.statut === 'suspendu';
                  return true;
                })
                .map((usr, i) => (
                  <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{usr.nom}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{usr.role}</span>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.85rem' }}>{usr.detail}</span>
                  </td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{usr.date}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ background: usr.statut === 'actif' ? '#10B98120' : '#EF444420', color: usr.statut === 'actif' ? '#10B981' : '#EF4444', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {usr.statut.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Gérer</button>
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

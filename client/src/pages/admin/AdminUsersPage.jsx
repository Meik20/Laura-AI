export default function AdminUsersPage() {
  const users = [
    { id: 'USR-01', nom: 'Amina B.', role: 'Élève', detail: 'Terminale D', statut: 'actif', date: '01/05/2026' },
    { id: 'USR-02', nom: 'Paul K.', role: 'Étudiant', detail: 'L2 Informatique', statut: 'actif', date: '02/05/2026' },
    { id: 'USR-03', nom: 'Marc D.', role: 'Tuteur', detail: 'Contributeur', statut: 'suspendu', date: '10/04/2026' },
  ];

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
          <button key={i} style={{ background: i === 0 ? '#3B82F6' : 'rgba(255,255,255,0.05)', color: i === 0 ? 'white' : '#94A3B8', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer' }}>
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
            {users.map((usr, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

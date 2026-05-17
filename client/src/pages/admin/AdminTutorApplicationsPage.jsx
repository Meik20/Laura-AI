export default function AdminTutorApplicationsPage() {
  const applications = [
    { id: 'APP-01', nom: 'Jean Dupont', discipline: 'Mathématiques', niveau: 'Lycée', experience: '5 ans', statut: 'en_attente', date: '16/05/2026' },
    { id: 'APP-02', nom: 'Marie Curie', discipline: 'Physique', niveau: 'Université', experience: '12 ans', statut: 'test_requis', date: '15/05/2026' },
    { id: 'APP-03', nom: 'Alain Turing', discipline: 'Informatique', niveau: 'Lycée', experience: '2 ans', statut: 'valide', date: '10/05/2026' }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'en_attente': return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>En attente</span>;
      case 'test_requis': return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>Test Requis</span>;
      case 'valide': return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>Validé</span>;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Candidatures Tuteurs</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>
          Gérez et validez les accès enseignants.
        </p>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Candidat</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Discipline</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Expérience</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'white' }}>{app.nom}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Soumis le {app.date}</div>
                </td>
                <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>
                  <div style={{ fontWeight: 600 }}>{app.discipline}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Niveau: {app.niveau}</div>
                </td>
                <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{app.experience}</td>
                <td style={{ padding: '1.5rem' }}>{getStatusBadge(app.statut)}</td>
                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                      Ouvrir le dossier
                    </button>
                    {app.statut === 'en_attente' && (
                      <button style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                        Valider
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

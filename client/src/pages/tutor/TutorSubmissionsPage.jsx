export default function TutorSubmissionsPage() {
  const isContributor = true; // Simuler droits

  const submissions = [
    { id: 'SUB-001', titre: 'Quiz sur les probabilités (10 questions)', type: 'Quiz', niveau: 'Terminale D', statut: 'en_revue', date: '15 Mai 2026' },
    { id: 'SUB-002', titre: 'Fiche méthode : Équations différentielles', type: 'Fiche', niveau: 'Terminale C', statut: 'valide', date: '10 Mai 2026' },
    { id: 'SUB-003', titre: 'Exercices types : Nombres complexes', type: 'Exercice', niveau: 'Terminale C', statut: 'a_corriger', date: '12 Mai 2026' },
    { id: 'SUB-004', titre: 'Brouillon : Schémas SVT', type: 'Support', niveau: '1ère D', statut: 'brouillon', date: 'Aujourd\'hui' },
  ];

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'brouillon': return { label: 'Brouillon', bg: '#F5F4EF', color: '#6E6E6B' };
      case 'soumis': return { label: 'Soumis', bg: '#E0F2FE', color: '#0369A1' };
      case 'en_revue': return { label: 'En revue', bg: '#FEF3C7', color: '#92400E' };
      case 'a_corriger': return { label: 'À corriger', bg: '#FEE2E2', color: '#B91C1C' };
      case 'valide': return { label: 'Validé (Publié)', bg: '#D1FAE5', color: '#065F46' };
      case 'rejete': return { label: 'Rejeté', bg: '#F3F4F6', color: '#374151' };
      default: return { label: 'Inconnu', bg: '#F5F4EF', color: '#6E6E6B' };
    }
  };

  if (!isContributor) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', background: 'white', padding: '4rem 2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Espace Soumission RESTREINT</h1>
        <p style={{ color: '#6E6E6B', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Vous devez avoir le statut <strong>Tuteur Contributeur</strong> pour proposer et gérer du contenu sur la plateforme.
        </p>
        <button style={{ padding: '1rem 2rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '1.05rem' }}>
          Faire la demande d'accès
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Vos Soumissions</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Gérez le contenu que vous proposez à la communauté LAURA.
          </p>
        </div>
        <button style={{ padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>+</span> Nouvelle soumission
        </button>
      </div>

      {/* FILTRES RAPIDES */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '1rem' }}>
        {['Toutes', 'Brouillons', 'En attente', 'À corriger', 'Validées'].map((f, i) => (
          <button key={i} style={{ background: i === 0 ? '#1A1A1A' : 'transparent', color: i === 0 ? 'white' : '#6E6E6B', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {/* TABLEAU DES SOUMISSIONS */}
      <div style={{ background: 'white', borderRadius: '1.2rem', border: '1px solid #E5E5E2', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E5E2' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Titre de la ressource</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Type</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Niveau Cible</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Date</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#6E6E6B' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, i) => {
              const statusStyle = getStatusStyle(sub.statut);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F0F0EE', transition: 'background 0.2s', ':hover': { background: '#FAFAFA' } }}>
                  <td style={{ padding: '1.5rem', fontWeight: 600, color: '#1A1A1A' }}>{sub.titre}</td>
                  <td style={{ padding: '1.5rem', color: '#444' }}>{sub.type}</td>
                  <td style={{ padding: '1.5rem', color: '#444' }}>{sub.niveau}</td>
                  <td style={{ padding: '1.5rem', color: '#6E6E6B' }}>{sub.date}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <button style={{ background: 'transparent', border: '1px solid #E5E5E2', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', color: '#1A1A1A' }}>Gérer</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

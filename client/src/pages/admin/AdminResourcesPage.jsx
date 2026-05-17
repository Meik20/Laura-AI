export default function AdminResourcesPage() {
  const resources = [
    { id: 'RES-01', titre: 'Annale BAC Maths 2023', type: 'Annale', cible: 'BAC / Terminale', statut: 'publie' },
    { id: 'RES-02', titre: 'Fiche: Probabilités', type: 'Fiche', cible: 'Terminale', statut: 'publie' },
    { id: 'RES-03', titre: 'Quiz SVT Génétique', type: 'Quiz', cible: 'Terminale D', statut: 'brouillon' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Catalogue Ressources</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Gérez les contenus disponibles sur la plateforme.</p>
        </div>
        <button style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
          + Ajouter une ressource
        </button>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Titre</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Type</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Cible d'accès</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{res.titre}</td>
                <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{res.type}</td>
                <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{res.cible}</td>
                <td style={{ padding: '1.5rem' }}>
                  <span style={{ background: res.statut === 'publie' ? '#10B98120' : '#F59E0B20', color: res.statut === 'publie' ? '#10B981' : '#F59E0B', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    {res.statut.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                  <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Éditer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

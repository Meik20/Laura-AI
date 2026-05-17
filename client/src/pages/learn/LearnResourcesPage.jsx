import { useState } from 'react';

export default function LearnResourcesPage() {
  const profileContext = {
    role: 'Élève', niveau: 'Terminale', serie: 'D', examen: 'BAC'
  };

  const [filters, setFilters] = useState({
    matiere: '', type: '', examen: '', serie: ''
  });

  const resources = [
    {
      id: 1, title: 'Annale BAC Maths 2023',
      type: 'Annale', matiere: 'Mathématiques', serie: 'D', examen: 'BAC',
      icon: '📝'
    },
    {
      id: 2, title: 'Fiche de cours : Probabilités',
      type: 'Fiche', matiere: 'Mathématiques', niveau: 'Terminale',
      icon: '📄'
    },
    {
      id: 3, title: 'Exercices corrigés - Suites',
      type: 'Exercices', matiere: 'Mathématiques', examen: 'BAC',
      icon: '🏋️'
    },
    {
      id: 4, title: 'Schéma Bilan : Génétique',
      type: 'Schéma', matiere: 'SVT', niveau: 'Terminale', serie: 'D',
      icon: '🧬'
    }
  ];

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Ressources</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Ressources adaptées à votre profil : <strong style={{ color: '#1A1A1A' }}>{profileContext.niveau} {profileContext.serie} · {profileContext.examen}</strong>
        </p>
      </div>

      {/* FILTRES (Point 12.2) */}
      <div style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #E5E5E2', flexWrap: 'wrap' }}>
        <select name="matiere" value={filters.matiere} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 200px' }}>
          <option value="">Toutes les matières</option><option value="Mathématiques">Mathématiques</option><option value="SVT">SVT</option>
        </select>
        <select name="type" value={filters.type} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 200px' }}>
          <option value="">Tous les types</option><option value="Annale">Annale</option><option value="Fiche">Fiche</option><option value="Exercices">Exercices</option>
        </select>
        <select name="examen" value={filters.examen} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 200px' }}>
          <option value="">Tous les examens</option><option value="BAC">BAC</option><option value="Probatoire">Probatoire</option>
        </select>
      </div>

      {/* GRILLE DE RESSOURCES (Point 12.3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {resources.map(res => (
          <div key={res.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>{res.icon}</div>
              <div>
                <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3 }}>{res.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ background: '#F5F4EF', color: '#6E6E6B', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{res.type}</span>
                  <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{res.matiere}</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}></div>

            {/* Actions sur la ressource */}
            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F0F0EE', paddingTop: '1rem' }}>
              <button style={{ flex: 1, padding: '0.6rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Ouvrir</button>
              <button style={{ flex: 1, padding: '0.6rem', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>LAURA AI</button>
              <button style={{ padding: '0.6rem', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.5rem', cursor: 'pointer' }}>🔖</button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default function LearnExamsPage() {
  const profileContext = {
    examen: 'BAC'
  };

  const actionStyle = {
    flex: 1, padding: '1.5rem', background: 'white', border: '1px solid #E5E5E2', 
    borderRadius: '1.2rem', textAlign: 'center', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Préparation aux examens</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Objectif actuel : <strong style={{ color: '#1A1A1A' }}>{profileContext.examen}</strong>
          </p>
        </div>
      </div>

      {/* OUTILS PRINCIPAUX (Point 11.3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>📚</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Annales</span>
        </button>
        <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>🎯</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Sujets fréquents</span>
        </button>
        <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>✅</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Corrigés</span>
        </button>
        <button style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>⏱️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Simulation</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        
        {/* ANNALES RECOMMANDÉES (Point 11.3) */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Annales recommandées</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['BAC Maths 2023', 'BAC Maths 2022', 'BAC Physique 2023'].map((annale, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F5F4EF', borderRadius: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{annale}</span>
                <button style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Ouvrir</button>
              </li>
            ))}
          </ul>
        </div>

        {/* PRÉPARATION GUIDÉE (Point 11.4) */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Préparation Guidée</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span> Demander un plan de préparation à LAURA AI
            </button>
            <button style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔍</span> Réviser les sujets qui tombent souvent
            </button>
            <button style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span> Lancer une simulation en condition réelle
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

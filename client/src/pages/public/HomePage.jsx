import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const handleStart = () => {
    // Si connecté, diriger vers dashboard, sinon vers signup (Simulation)
    const isLoggedIn = false;
    if (isLoggedIn) navigate('/learn/dashboard');
    else navigate('/signup');
  };

  const featureCard = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', textAlign: 'left', flex: 1, minWidth: '250px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem', background: '#F5F4EF', borderBottom: '1px solid #E5E5E2' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            L'intelligence artificielle éducative qui <span style={{ color: '#00D4AA' }}>accompagne vos apprentissages</span>
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#6E6E6B', marginBottom: '3rem', lineHeight: 1.5 }}>
            LAURA AI est votre tuteur personnel sur-mesure. Des révisions ciblées, des examens préparés avec précision et des explications toujours claires.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleStart} style={{ padding: '1.2rem 2.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s' }}>
              Commencer gratuitement
            </button>
            <Link to="/how-it-works" style={{ padding: '1.2rem 2.5rem', background: 'white', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
              Voir comment ça marche
            </Link>
          </div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <section style={{ padding: '6rem 2rem', background: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '3rem' }}>Pour qui est LAURA AI ?</h2>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div style={{ ...featureCard, background: '#FAFAFA' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Pour les Élèves (Secondaire)</h3>
            <p style={{ color: '#6E6E6B', lineHeight: 1.6 }}>Préparation au BAC, Probatoire ou BEPC. Obtenez des explications simplifiées, des fiches de révisions générées à la volée et des annales corrigées.</p>
          </div>

          <div style={{ ...featureCard, background: '#FAFAFA' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Pour les Étudiants (Supérieur)</h3>
            <p style={{ color: '#6E6E6B', lineHeight: 1.6 }}>Un accompagnement approfondi pour les filières universitaires, les préparations aux partiels, concours et soutenances.</p>
          </div>

        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section style={{ padding: '6rem 2rem', background: '#1A1A1A', color: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Des fonctionnalités surpuissantes</h2>
        <p style={{ fontSize: '1.2rem', color: '#94A3B8', marginBottom: '4rem' }}>Tout ce dont vous avez besoin pour réussir, réuni en un seul endroit.</p>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          
          <div style={{ ...featureCard, background: '#262626', border: '1px solid #333', color: 'white' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#00D4AA' }}>Chat Contextuel</h3>
            <p style={{ color: '#A3A3A3', fontSize: '0.95rem' }}>Dialogue interactif adapté à votre niveau, capable de générer des quiz à la demande.</p>
          </div>
          
          <div style={{ ...featureCard, background: '#262626', border: '1px solid #333', color: 'white' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#7C6FFF' }}>Objectifs & Suivi</h3>
            <p style={{ color: '#A3A3A3', fontSize: '0.95rem' }}>Définissez vos objectifs (ex: "Réviser 8 chapitres de Maths") et suivez votre progression en temps réel.</p>
          </div>

          <div style={{ ...featureCard, background: '#262626', border: '1px solid #333', color: 'white' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#F59E0B' }}>Simulateur d'Examens</h3>
            <p style={{ color: '#A3A3A3', fontSize: '0.95rem' }}>Entraînez-vous dans les conditions réelles sur une immense base de données d'annales.</p>
          </div>

          <div style={{ ...featureCard, background: '#262626', border: '1px solid #333', color: 'white' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#3B82F6' }}>Ressources Intelligentes</h3>
            <p style={{ color: '#A3A3A3', fontSize: '0.95rem' }}>Le système ne vous propose que les documents qui correspondent à votre série et vos lacunes.</p>
          </div>

        </div>
      </section>

      {/* DEVENEZ TUTEUR */}
      <section style={{ padding: '6rem 2rem', background: '#00D4AA', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#004D3E' }}>Vous êtes enseignant ?</h2>
          <p style={{ fontSize: '1.2rem', color: '#006B56', marginBottom: '2.5rem', fontWeight: 600 }}>
            Rejoignez la communauté LAURA AI. Partagez votre expertise, proposez vos ressources et aidez des milliers d'élèves à réussir.
          </p>
          <Link to="/become-tutor" style={{ padding: '1.2rem 2.5rem', background: 'white', color: '#00A37A', border: 'none', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>
            Découvrir le programme Tuteur
          </Link>
        </div>
      </section>

    </div>
  );
}

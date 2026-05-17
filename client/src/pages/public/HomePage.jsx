import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const qrUrl = typeof window !== 'undefined' ? window.location.origin : 'https://laura-ai.vercel.app';

  const handleStart = () => {
    const isLoggedIn = false;
    if (isLoggedIn) navigate('/learn/dashboard');
    else navigate('/signup');
  };

  const featureCard = {
    background: 'var(--color-bg-card)',
    padding: '2rem',
    borderRadius: 'var(--radius-xl)',
    border: 'var(--border-width-thin) solid var(--color-border-default)',
    textAlign: 'left',
    flex: 1,
    minWidth: '250px',
  };

  const darkFeatureCard = {
    background: 'var(--color-neutral-800)',
    border: 'var(--border-width-thin) solid var(--color-neutral-700)',
    color: 'var(--color-text-inverse)',
    padding: '2rem',
    borderRadius: 'var(--radius-xl)',
    textAlign: 'left',
    flex: 1,
    minWidth: '250px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--color-bg-page)', borderBottom: 'var(--border-width-thin) solid var(--color-border-default)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            L'intelligence artificielle éducative qui <span style={{ color: 'var(--color-primary)' }}>accompagne vos apprentissages</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '3rem', lineHeight: 1.6 }}>
            LAURA est votre tuteur personnel sur-mesure. Des révisions ciblées, des examens préparés avec précision et des explications toujours claires.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleStart}
              style={{ padding: '1.2rem 2.5rem', background: 'var(--color-primary)', color: 'var(--color-white)', border: 'none', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', transition: 'background-color var(--transition-fast)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Commencer gratuitement
            </button>
            <Link
              to="/how-it-works"
              style={{ padding: '1.2rem 2.5rem', background: 'var(--color-bg-card)', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'all var(--transition-fast)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-card)'}
            >
              Voir comment ça marche
            </Link>
          </div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <section style={{ padding: '6rem 2rem', background: 'var(--color-bg-card)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Pour qui est LAURA ?</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>Un outil pensé pour chaque étape du parcours scolaire des jeunes camerounais.</p>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

          <div style={{ ...featureCard, background: 'var(--color-bg-page)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Pour les Élèves (Secondaire)</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>Préparation au BAC, Probatoire ou BEPC. Des explications simplifiées, des fiches de révisions générées à la volée et des annales corrigées.</p>
          </div>

          <div style={{ ...featureCard, background: 'var(--color-bg-page)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Pour les Étudiants (Supérieur)</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>Un accompagnement approfondi pour les filières universitaires, les préparations aux partiels, concours et soutenances.</p>
          </div>

        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section style={{ padding: '6rem 2rem', background: 'var(--color-neutral-900)', color: 'var(--color-white)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--color-white)' }}>Des fonctionnalités surpuissantes</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-neutral-400)', marginBottom: '4rem' }}>Tout ce dont vous avez besoin pour réussir, réuni en un seul endroit.</p>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

          <div style={darkFeatureCard}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#7fc3f7', fontWeight: 800 }}>Chat Contextuel</h3>
            <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.95rem', lineHeight: 1.6 }}>Dialogue interactif adapté à votre niveau, capable de générer des quiz à la demande.</p>
          </div>

          <div style={darkFeatureCard}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--color-brand-green)', fontWeight: 800 }}>Objectifs & Suivi</h3>
            <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.95rem', lineHeight: 1.6 }}>Définissez vos objectifs et suivez votre progression en temps réel avec des indicateurs clairs.</p>
          </div>

          <div style={darkFeatureCard}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--color-brand-amber)', fontWeight: 800 }}>Simulateur d'Examens</h3>
            <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.95rem', lineHeight: 1.6 }}>Entraînez-vous dans les conditions réelles sur une immense base de données d'annales africaines.</p>
          </div>

          <div style={darkFeatureCard}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--color-brand-coral)', fontWeight: 800 }}>Ressources Intelligentes</h3>
            <p style={{ color: 'var(--color-neutral-400)', fontSize: '0.95rem', lineHeight: 1.6 }}>Le système ne vous propose que les documents qui correspondent à votre série et vos lacunes.</p>
          </div>

        </div>
      </section>

      {/* SECTION VERSION MOBILE & QR CODE */}
      <section style={{ padding: '6rem 2rem', background: 'var(--color-bg-page)', borderBottom: 'var(--border-width-thin) solid var(--color-border-default)', textAlign: 'center' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto', background: 'var(--color-bg-card)', padding: '3.5rem 2.5rem', borderRadius: '2rem', border: 'var(--border-width-thin) solid var(--color-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '3rem', flexWrap: 'wrap-reverse', boxShadow: 'var(--shadow-sm)' }}>
          
          <div style={{ flex: 1, textAlign: 'left', minWidth: '300px' }}>
            <span style={{ background: 'var(--color-brand-green-light)', color: 'var(--color-brand-green-dark)', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem', display: 'inline-block' }}>⚡ Version Mobile & PWA</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              Emportez LAURA partout avec vous
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Scannez le QR code ci-contre avec votre smartphone pour ouvrir instantanément l'application sur mobile. Grâce à notre format PWA optimisé, vous pouvez l'installer directement sur votre écran d'accueil sans passer par l'App Store ou Google Play, et profiter de toutes les fonctionnalités de LAURA en un clic !
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> Mode PWA Installable
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> Notifications instantanées
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> Fluidité tactile maximale
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--color-neutral-100)', padding: '2rem', borderRadius: '1.5rem', border: 'var(--border-width-thin) solid var(--color-border-default)', width: '220px', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ background: 'var(--color-bg-card)', padding: '1rem', borderRadius: '1rem', border: 'var(--border-width-thin) solid var(--color-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`} 
                alt="QR Code LAURA AI" 
                style={{ width: '160px', height: '160px', display: 'block' }} 
              />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'center' }}>Scannez pour installer</span>
          </div>

        </div>
      </section>

      {/* DEVENEZ TUTEUR */}
      <section style={{ padding: '6rem 2rem', background: 'var(--color-primary)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--color-white)' }}>Vous êtes enseignant ?</h2>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-primary-light)', marginBottom: '2.5rem', fontWeight: 600, lineHeight: 1.6 }}>
            Rejoignez la communauté LAURA. Partagez votre expertise, proposez vos ressources et aidez des milliers d'élèves à réussir.
          </p>
          <Link
            to="/become-tutor"
            style={{ padding: '1.2rem 2.5rem', background: 'var(--color-bg-card)', color: 'var(--color-primary)', border: 'none', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 800, textDecoration: 'none', display: 'inline-block', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Découvrir le programme Tuteur →
          </Link>
        </div>
      </section>

    </div>
  );
}

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  const qrUrl = typeof window !== 'undefined' ? window.location.origin : 'https://laura-ai.vercel.app';

  const handleStart = () => {
    const isLoggedIn = false;
    if (isLoggedIn) navigate('/learn/dashboard');
    else navigate('/signup');
  };

  return (
    <div className="laura-page" style={{ paddingBottom: 'var(--sp-12)' }}>

      {/* HERO SECTION */}
      <section className="laura-hero" style={{ margin: 'var(--sp-6) 0', borderRadius: 'var(--r-2xl)' }}>
        <div className="laura-hero-body" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div className="laura-pill" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.25)', color: 'white' }}>
            ✨ Découvrez la nouvelle version 2.0
          </div>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="laura-hero-text" style={{ marginBottom: '1.5rem' }}>
              L'intelligence artificielle éducative qui accompagne vos apprentissages
            </h1>
            <p className="laura-body-lg" style={{ marginBottom: '3rem', opacity: 0.9 }}>
              LAURA est votre tuteur personnel sur-mesure. Des révisions ciblées, des examens préparés avec précision et des explications toujours claires.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleStart} className="laura-btn" style={{ background: 'white', color: 'var(--laura-primary)', padding: '0 32px', minHeight: '56px', fontSize: '16px' }}>
                Commencer gratuitement
              </button>
              <Link to="/how-it-works" className="laura-btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '0 32px', minHeight: '56px', fontSize: '16px' }}>
                Voir comment ça marche
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <section style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 className="laura-h2" style={{ marginBottom: '1rem' }}>Pour qui est LAURA ?</h2>
        <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: '3rem' }}>Un outil pensé pour chaque étape du parcours scolaire.</p>
        
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="laura-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎒</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem' }}>Pour les Élèves (Secondaire)</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Préparation au BAC, Probatoire ou BEPC. Des explications simplifiées, des fiches de révisions générées à la volée et des annales corrigées.</p>
          </div>

          <div className="laura-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem' }}>Pour les Étudiants (Supérieur)</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Un accompagnement approfondi pour les filières universitaires, les préparations aux partiels, concours et soutenances.</p>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2 className="laura-h2" style={{ marginBottom: '1rem' }}>Des fonctionnalités surpuissantes</h2>
        <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: '4rem' }}>Tout ce dont vous avez besoin pour réussir, réuni en un seul endroit.</p>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          
          <div className="laura-card-tint" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem', color: 'var(--laura-primary)' }}>Chat Contextuel</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Dialogue interactif adapté à votre niveau, capable de générer des quiz à la demande.</p>
          </div>

          <div className="laura-card-tint" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem', color: 'var(--laura-success)' }}>Objectifs & Suivi</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Définissez vos objectifs et suivez votre progression en temps réel avec des indicateurs clairs.</p>
          </div>

          <div className="laura-card-tint" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem', color: 'var(--laura-warning)' }}>Simulateur d'Examens</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Entraînez-vous dans les conditions réelles sur une immense base de données d'annales africaines.</p>
          </div>

          <div className="laura-card-tint" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
            <h3 className="laura-h3" style={{ marginBottom: '0.75rem', color: 'var(--laura-danger)' }}>Ressources Intelligentes</h3>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Le système ne vous propose que les documents qui correspondent à votre série et vos lacunes.</p>
          </div>

        </div>
      </section>

      {/* SECTION VERSION MOBILE & QR CODE */}
      <section style={{ padding: '4rem 1rem' }}>
        <div className="laura-card" style={{ maxWidth: '950px', margin: '0 auto', padding: '3.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '3rem', flexWrap: 'wrap-reverse' }}>
          
          <div style={{ flex: 1, textAlign: 'left', minWidth: '300px' }}>
            <div className="laura-pill" style={{ background: 'var(--laura-success-bg)', color: 'var(--laura-success)', marginBottom: '1.2rem' }}>
              ⚡ Version Mobile & PWA
            </div>
            <h2 className="laura-h2" style={{ marginBottom: '1rem' }}>
              Emportez LAURA partout avec vous
            </h2>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: '2rem' }}>
              Scannez le QR code ci-contre avec votre smartphone pour ouvrir instantanément l'application sur mobile. Grâce à notre format PWA optimisé, vous pouvez l'installer directement sur votre écran d'accueil sans passer par l'App Store ou Google Play !
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--laura-success)', fontWeight: 600 }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> Mode PWA Installable
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--laura-success)', fontWeight: 600 }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span> Notifications instantanées
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--laura-bg-soft)', padding: '2rem', borderRadius: 'var(--r-xl)', width: '220px', flexShrink: 0 }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`} 
                alt="QR Code LAURA AI" 
                style={{ width: '160px', height: '160px', display: 'block' }} 
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--laura-text-2)' }}>Scannez pour installer</span>
          </div>

        </div>
      </section>

      {/* DEVENEZ TUTEUR */}
      <section style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="laura-card-soft" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', background: 'var(--laura-surface-tint)' }}>
          <h2 className="laura-h2" style={{ marginBottom: '1rem', color: 'var(--laura-primary)' }}>Vous êtes enseignant ?</h2>
          <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: '2.5rem' }}>
            Rejoignez la communauté LAURA. Partagez votre expertise, proposez vos ressources et aidez des milliers d'élèves à réussir.
          </p>
          <Link to="/become-tutor" className="laura-btn laura-btn-primary" style={{ padding: '0 32px', minHeight: '52px', fontSize: '15px' }}>
            Découvrir le programme Tuteur →
          </Link>
        </div>
      </section>

    </div>
  );
}

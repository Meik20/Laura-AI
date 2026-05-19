import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '◎', color: 'var(--clr-brand)',
    title: 'Chat Contextuel',
    desc: 'Dialogue interactif adapté à votre niveau, capable de générer des quiz à la demande.',
  },
  {
    icon: '▲', color: 'var(--clr-green)',
    title: 'Objectifs & Suivi',
    desc: 'Définissez vos objectifs et suivez votre progression en temps réel avec des indicateurs clairs.',
  },
  {
    icon: '✦', color: 'var(--clr-warning)',
    title: 'Simulateur d\'Examens',
    desc: 'Entraînez-vous dans les conditions réelles sur une immense base d\'annales camerounaises et africaines.',
  },
  {
    icon: '⊕', color: 'var(--clr-error)',
    title: 'Ressources Intelligentes',
    desc: 'Le système ne vous propose que les documents correspondant à votre série et vos lacunes.',
  },
];

const AUDIENCES = [
  {
    icon: '🎒',
    title: 'Pour les Élèves (Secondaire)',
    desc: 'Préparation au BAC, Probatoire ou BEPC. Des explications simplifiées, des fiches de révisions et des annales corrigées.',
  },
  {
    icon: '🎓',
    title: 'Pour les Étudiants (Supérieur)',
    desc: 'Un accompagnement approfondi pour les filières universitaires, préparations aux partiels, examens, concours et soutenances.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const qrUrl = typeof window !== 'undefined' ? window.location.origin : 'https://laura-ai.vercel.app';

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="home-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero__inner">

          {/* Announcement badge */}
          <div className="home-hero__badge">
            ✨ Découvrez la nouvelle version 2.0
          </div>

          <h1 className="home-hero__title">
            L'intelligence artificielle éducative qui accompagne vos apprentissages
          </h1>

          <p className="home-hero__sub">
            LAURA est votre tuteur personnel sur-mesure. Des révisions ciblées, des examens préparés avec précision et des explications toujours claires.
          </p>

          <div className="home-hero__cta">
            <Link to="/signup" className="laura-btn" style={{
              background: 'white', color: 'var(--clr-brand)',
              minHeight: '52px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)',
              fontWeight: 'var(--fw-bold)', boxShadow: '0 4px 20px rgba(255,255,255,0.3)'
            }}>
              Commencer gratuitement
            </Link>
            <Link to="/how-it-works" className="laura-btn" style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.45)',
              minHeight: '52px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)',
            }}>
              Comment ça marche →
            </Link>
          </div>

          {/* Social proof */}
          <div className="home-hero__trust">
            <span>✓ Gratuit</span>
            <span>✓ Sans téléchargement</span>
            <span>✓ Adapté au programme africain</span>
          </div>
        </div>
      </section>

      {/* ── AUDIENCES ────────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section__inner">
          <div className="home-section__header">
            <h2>Pour qui est LAURA ?</h2>
            <p>Un outil pensé pour chaque étape du parcours scolaire.</p>
          </div>

          <div className="card-grid">
            {AUDIENCES.map(({ icon, title, desc }) => (
              <div key={title} className="card card--hoverable" style={{ padding: 'var(--sp-8)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-5)' }}>{icon}</div>
                <h3 style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--tx-lg)' }}>{title}</h3>
                <p style={{ fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="home-section home-section--tinted">
        <div className="home-section__inner">
          <div className="home-section__header">
            <h2>Des fonctionnalités surpuissantes</h2>
            <p>Tout ce dont vous avez besoin pour réussir, réuni en un seul endroit.</p>
          </div>

          <div className="card-grid card-grid--3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {FEATURES.map(({ icon, color, title, desc }) => (
              <div key={title} className="card card--hoverable" style={{ padding: 'var(--sp-6)' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--rd-md)',
                  background: `${color}18`, color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', marginBottom: 'var(--sp-4)'
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', color }}>{title}</h3>
                <p style={{ fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA / MOBILE ─────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section__inner">
          <div className="home-pwa">
            <div className="home-pwa__text">
              <span className="badge badge--green" style={{ marginBottom: 'var(--sp-4)', display: 'inline-flex' }}>
                ⚡ Version Mobile & PWA
              </span>
              <h2 style={{ marginBottom: 'var(--sp-4)' }}>Emportez LAURA partout avec vous</h2>
              <p style={{ marginBottom: 'var(--sp-6)', fontSize: 'var(--tx-base)', lineHeight: 'var(--lh-relaxed)' }}>
                Scannez le QR code avec votre smartphone pour ouvrir l'application sur mobile. Grâce à notre format PWA optimisé, installez-la directement sur votre écran d'accueil sans passer par l'App Store.
              </p>
              <div className="stack stack--sm">
                {['Mode PWA Installable', 'Notifications instantanées', 'Fonctionne hors-ligne'].map(f => (
                  <div key={f} className="row" style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>
                    <span>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="home-pwa__qr">
              <div style={{ background: 'white', padding: 'var(--sp-4)', borderRadius: 'var(--rd-lg)' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code LAURA AI"
                  style={{ width: '160px', height: '160px', display: 'block' }}
                />
              </div>
              <p style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', textAlign: 'center' }}>
                Scannez pour installer
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEACHER CTA ──────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section__inner">
          <div className="home-cta-panel">
            <div className="home-cta-panel__badge">Pour les enseignants</div>
            <h2 className="home-cta-panel__title">Vous êtes enseignant ?</h2>
            <p className="home-cta-panel__sub">
              Rejoignez la communauté LAURA. Partagez votre expertise, proposez vos ressources et aidez des milliers d'élèves à réussir.
            </p>
            <Link to="/become-tutor" className="laura-btn laura-btn-primary" style={{ minHeight: '50px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)' }}>
              Découvrir le programme Tuteur →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

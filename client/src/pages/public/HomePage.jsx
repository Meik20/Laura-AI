import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  {
    icon: 'message-circle', color: 'var(--clr-brand)',
    titleKey: 'home.features.chat.title',
    descKey: 'home.features.chat.desc',
  },
  {
    icon: 'target', color: 'var(--clr-green)',
    titleKey: 'home.features.goals.title',
    descKey: 'home.features.goals.desc',
  },
  {
    icon: 'certificate', color: 'var(--clr-warning)',
    titleKey: 'home.features.exams.title',
    descKey: 'home.features.exams.desc',
  },
  {
    icon: 'folders', color: 'var(--clr-error)',
    titleKey: 'home.features.resources.title',
    descKey: 'home.features.resources.desc',
  },
];

const AUDIENCES = [
  {
    icon: 'book-2',
    titleKey: 'home.audiences.student.title',
    descKey: 'home.audiences.student.desc',
  },
  {
    icon: 'book-3',
    titleKey: 'home.audiences.college.title',
    descKey: 'home.audiences.college.desc',
  },
];

export default function HomePage() {
  const { t } = useTranslation();
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
            {t('home.hero.announcement')}
          </div>

          <h1 className="home-hero__title">
            {t('home.hero.title')}
          </h1>

          <p className="home-hero__sub">
            {t('home.hero.sub')}
          </p>

          <div className="home-hero__cta">
            <Link to="/signup" className="laura-btn" style={{
              background: 'white', color: 'var(--clr-brand)',
              minHeight: '52px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)',
              fontWeight: 'var(--fw-bold)', boxShadow: '0 4px 20px rgba(255,255,255,0.3)'
            }}>
              {t('home.hero.cta_start')}
            </Link>
            <Link to="/how-it-works" className="laura-btn" style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.45)',
              minHeight: '52px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)',
            }}>
              {t('home.hero.cta_how')}
            </Link>
          </div>

          {/* Social proof */}
          <div className="home-hero__trust">
            <span>{t('home.hero.trust_free')}</span>
            <span>{t('home.hero.trust_no_download')}</span>
            <span>{t('home.hero.trust_african_program')}</span>
          </div>
        </div>
      </section>

      {/* ── AUDIENCES ────────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section__inner">
          <div className="home-section__header">
            <h2>{t('home.audiences.title')}</h2>
            <p>{t('home.audiences.sub')}</p>
          </div>

          <div className="card-grid">
            {AUDIENCES.map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} className="card card--hoverable" style={{ padding: 'var(--sp-8)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-5)' }}><i className={`ti ti-${icon}`} /></div>
                <h3 style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--tx-lg)' }}>{t(titleKey)}</h3>
                <p style={{ fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="home-section home-section--tinted">
        <div className="home-section__inner">
          <div className="home-section__header">
            <h2>{t('home.features.title')}</h2>
            <p>{t('home.features.sub')}</p>
          </div>

          <div className="card-grid card-grid--3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {FEATURES.map(({ icon, color, titleKey, descKey }) => (
              <div key={titleKey} className="card card--hoverable" style={{ padding: 'var(--sp-6)' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--rd-md)',
                  background: `${color}18`, color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', marginBottom: 'var(--sp-4)'
                }}>
                  <i className={`ti ti-${icon}`} />
                </div>
                <h3 style={{ fontSize: 'var(--tx-md)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', color }}>{t(titleKey)}</h3>
                <p style={{ fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{t(descKey)}</p>
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
                {t('home.pwa.badge')}
              </span>
              <h2 style={{ marginBottom: 'var(--sp-4)' }}>{t('home.pwa.title')}</h2>
              <p style={{ marginBottom: 'var(--sp-6)', fontSize: 'var(--tx-base)', lineHeight: 'var(--lh-relaxed)' }}>
                {t('home.pwa.desc')}
              </p>
              <div className="stack stack--sm">
                {[
                  t('home.pwa.features.installable'),
                  t('home.pwa.features.notifications'),
                  t('home.pwa.features.offline')
                ].map(f => (
                  <div key={f} className="row" style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>
                    <i className="ti ti-check" style={{ marginRight: 'var(--sp-2)' }} /> {f}
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
                {t('home.pwa.qr_caption')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEACHER CTA ──────────────────────────────────────────────────── */}
      <section className="home-section">
        <div className="home-section__inner">
          <div className="home-cta-panel">
            <div className="home-cta-panel__badge">{t('home.teacher.badge')}</div>
            <h2 className="home-cta-panel__title">{t('home.teacher.title')}</h2>
            <p className="home-cta-panel__sub">
              {t('home.teacher.sub')}
            </p>
            <Link to="/become-tutor" className="laura-btn laura-btn-primary" style={{ minHeight: '50px', padding: '0 var(--sp-8)', fontSize: 'var(--tx-md)' }}>
              {t('home.teacher.cta')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

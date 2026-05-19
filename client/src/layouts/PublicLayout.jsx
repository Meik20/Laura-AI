import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  const isFr = currentLang.startsWith('fr');

  return (
    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', background: 'var(--srf-raised)', padding: '2px 6px', borderRadius: '20px', border: '1px solid var(--brd-subtle)' }}>
      <button
        onClick={() => i18n.changeLanguage('fr')}
        title="Français"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: isFr ? 1 : 0.35,
          transform: isFr ? 'scale(1.1)' : 'scale(0.9)',
          transition: 'all 0.2s',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="20" height="13" style={{ borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          <rect width="900" height="600" fill="#ED2939"/>
          <rect width="600" height="600" fill="#fff"/>
          <rect width="300" height="600" fill="#002395"/>
        </svg>
      </button>
      <span style={{ color: 'var(--brd-strong)', fontSize: '10px', userSelect: 'none' }}>|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        title="English"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: !isFr ? 1 : 0.35,
          transform: !isFr ? 'scale(1.1)' : 'scale(0.9)',
          transition: 'all 0.2s',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="13" style={{ borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          <rect width="60" height="30" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </svg>
      </button>
    </div>
  );
}

const AUTH_ROUTES = ['/login', '/signup', '/tutor/apply', '/tutor/status'];
const AUTH_WIDE   = ['/become-tutor', '/how-it-works'];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Auth pages: centered single-column, no navbar ──
  if (AUTH_ROUTES.some(p => pathname.startsWith(p))) {
    return (
      <div className="public-auth-shell" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <LanguageSwitcher />
        </div>
        <Link to="/" className="public-auth-logo">
          <img src="/logo.png" alt="LAURA" style={{ height: '44px' }} />
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="public-shell">

      {/* ── Topbar ── */}
      <header className="public-topbar">
        <div className="public-topbar__inner">

          {/* Brand */}
          <Link to="/" className="public-topbar__brand">
            <img src="/icon.png" alt="LAURA" style={{ height: '36px' }} />
            <span className="public-topbar__name">laura ai</span>
          </Link>

          {/* Desktop nav */}
          <nav className="public-topbar__nav desktop-only" aria-label="Navigation publique">
            <NavLink to="/how-it-works" className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`}>
              Comment ça marche
            </NavLink>
            <NavLink to="/become-tutor" className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`}>
              Devenez tuteur
            </NavLink>
          </nav>

          {/* Desktop CTA */}
          <div className="public-topbar__actions desktop-only" style={{ gap: '16px' }}>
            <LanguageSwitcher />
            <Link to="/login" className="public-nav-link">Connexion</Link>
            <Link to="/signup" className="laura-btn laura-btn-primary" style={{ minHeight: '38px', padding: '0 var(--sp-5)', fontSize: 'var(--tx-sm)' }}>
              S'inscrire gratuitement
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="l-topbar__menu-btn mobile-only"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="public-mobile-nav" role="navigation" aria-label="Navigation mobile">
            <NavLink to="/how-it-works" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Comment ça marche
            </NavLink>
            <NavLink to="/become-tutor" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Devenez tuteur
            </NavLink>
            <hr className="divider" />
            <div style={{ padding: '8px 12px' }}>
              <LanguageSwitcher />
            </div>
            <Link to="/login" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Connexion
            </Link>
            <Link to="/signup" className="laura-btn laura-btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
              S'inscrire gratuitement
            </Link>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="public-footer">
        <div className="public-footer__inner">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Link to="/" className="public-footer__brand" style={{ marginBottom: 0 }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '36px', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
              <span className="public-footer__name">laura ai</span>
            </Link>
            <span style={{ fontSize: '13px', color: 'var(--txt-tertiary)', opacity: 0.8, letterSpacing: '0.2px' }}>
              Learning AI & Unified Resource Assistant
            </span>
          </div>
          <div className="public-footer__links">
            <Link to="/how-it-works" className="public-footer__link">Comment ça marche</Link>
            <Link to="/become-tutor" className="public-footer__link">Devenez tuteur</Link>
            <Link to="/login"        className="public-footer__link">Connexion</Link>
          </div>
          <p className="public-footer__copy">© 2026 LAURA — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}

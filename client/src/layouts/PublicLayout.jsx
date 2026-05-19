import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';

const AUTH_ROUTES = ['/login', '/signup', '/tutor/apply', '/tutor/status'];
const AUTH_WIDE   = ['/become-tutor', '/how-it-works'];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Auth pages: centered single-column, no navbar ──
  if (AUTH_ROUTES.some(p => pathname.startsWith(p))) {
    return (
      <div className="public-auth-shell">
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
          <div className="public-topbar__actions desktop-only">
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
          <Link to="/" className="public-footer__brand">
            <img src="/logo.png" alt="LAURA" style={{ height: '36px', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
            <span className="public-footer__name">laura ai</span>
          </Link>
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

import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const AUTH_ROUTES = ['/login', '/signup', '/tutor/apply', '/tutor/status'];
const AUTH_WIDE   = ['/become-tutor', '/how-it-works'];

export default function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

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
              {t('nav.how_it_works')}
            </NavLink>
            <NavLink to="/become-tutor" className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`}>
              {t('nav.become_tutor')}
            </NavLink>
          </nav>

          {/* Desktop CTA */}
          <div className="public-topbar__actions desktop-only" style={{ gap: '16px' }}>
            <LanguageSwitcher />
            <Link to="/login" className="public-nav-link">{t('nav.login')}</Link>
            <Link to="/signup" className="laura-btn laura-btn-primary" style={{ minHeight: '38px', padding: '0 var(--sp-5)', fontSize: 'var(--tx-sm)' }}>
              {t('nav.signup')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="l-topbar__menu-btn mobile-only"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <i className="ti ti-x" /> : <i className="ti ti-menu-2" />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="public-mobile-nav" role="navigation" aria-label="Navigation mobile">
            <NavLink to="/how-it-works" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.how_it_works')}
            </NavLink>
            <NavLink to="/become-tutor" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.become_tutor')}
            </NavLink>
            <hr className="divider" />
            <div style={{ padding: '8px 12px' }}>
              <LanguageSwitcher />
            </div>
            <Link to="/login" className="public-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.login')}
            </Link>
            <Link to="/signup" className="laura-btn laura-btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
              {t('nav.signup')}
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
            <Link to="/how-it-works" className="public-footer__link">{t('nav.how_it_works')}</Link>
            <Link to="/become-tutor" className="public-footer__link">{t('nav.become_tutor')}</Link>
            <Link to="/login"        className="public-footer__link">{t('nav.login')}</Link>
          </div>
          <p className="public-footer__copy">{t('nav.rights_reserved')}</p>
        </div>
      </footer>
    </div>
  );
}

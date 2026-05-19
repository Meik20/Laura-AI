import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/tutor/dashboard',   labelKey: 'tutor.nav.dashboard',     icon: '⊞' },
  { to: '/tutor/chat',        labelKey: 'tutor.nav.chat',        icon: '◎' },
  { to: '/tutor/resources',   labelKey: 'tutor.nav.resources',     icon: '⊕' },
  { to: '/tutor/submissions', labelKey: 'tutor.nav.submissions',    icon: '▣' },
  { to: '/tutor/history',     labelKey: 'tutor.nav.history',     icon: '↺' },
  { to: '/tutor/profile',     labelKey: 'tutor.nav.profile',icon: '◉' },
  { to: '/tutor/settings',    labelKey: 'tutor.nav.settings',       icon: '⊛' },
];

const BOTTOM_NAV = [
  { to: '/tutor/dashboard',   labelKey: 'tutor.nav.overview_short',   icon: '⊞' },
  { to: '/tutor/chat',        labelKey: 'tutor.nav.chat',   icon: '◎' },
  { to: '/tutor/resources',   labelKey: 'tutor.nav.catalogue', icon: '⊕' },
  { to: '/tutor/submissions', labelKey: 'tutor.nav.activity',  icon: '▣' },
  { to: '/tutor/profile',     labelKey: 'tutor.nav.profile_short',    icon: '◉' },
];

function getInitials(p) {
  const a = p?.prenom?.[0] || '';
  const b = p?.nom?.[0] || '';
  return (a + b).toUpperCase() || 'T';
}

export default function TutorLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = useCallback(async () => {
    try   { await logout(); navigate('/login'); }
    catch { /* silent */ }
  }, [logout, navigate]);

  const closeDrawer = () => setDrawerOpen(false);
  const initials    = getInitials(userProfile);
  const roleLabel   = userProfile?.roleLabel || t('common.roles.tutor');
  const displayName = userProfile?.prenom || currentUser?.displayName || t('common.roles.tutor');

  return (
    <div className="l-app">

      {/* Backdrop */}
      <div className={`l-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />

      {/* Sidebar */}
      <aside className={`l-sidebar${drawerOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
        <div className="l-sidebar__header">
          <NavLink to="/tutor/dashboard" className="l-sidebar__brand" onClick={closeDrawer}>
            <img src="/icon.png" alt="LAURA" className="l-sidebar__logo" />
            <span className="l-sidebar__name">laura ai</span>
          </NavLink>
          <button className="l-sidebar__toggle desktop-only" onClick={() => setCollapsed(c => !c)} aria-label={t('common.actions.toggle_sidebar')}>
            {collapsed ? '›' : '‹'}
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label={t('common.actions.close')}>✕</button>
        </div>

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation tuteur">
          {NAV_ITEMS.map(({ to, labelKey, icon }) => (
            <NavLink key={to} to={to} onClick={closeDrawer}
              className={({ isActive }) => `l-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? t(labelKey) : undefined}
            >
              <span className="l-nav-item__icon" aria-hidden="true">{icon}</span>
              <span className="l-nav-item__label">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="l-sidebar__footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', overflow: 'hidden' }}>
            <div className="avatar avatar--sm" style={{ flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', margin: 0 }}>{displayName}</p>
                <p className="truncate" style={{ fontSize: 'var(--tx-xs)', color: 'var(--clr-green)', margin: 0 }}>{roleLabel}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed ? '⏻' : `⏻ ${t('common.actions.logout')}`}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="l-main">
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label={t('common.actions.open_menu')}>☰</button>
            <NavLink to="/tutor/dashboard" className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '30px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-green-lt)', color: 'var(--clr-green)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                {t('common.roles.tutor').toUpperCase()}
              </span>
            </NavLink>
            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              {t('tutor.header.title')}
            </p>
          </div>
          <div className="l-topbar__right" style={{ gap: '16px', alignItems: 'center' }}>
            <LanguageSwitcher />
            <span className="desktop-only" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
              {roleLabel} · <strong style={{ color: 'var(--txt-primary)' }}>{displayName}</strong>
            </span>
            <div className="avatar avatar--sm" style={{ background: 'var(--clr-green-lt)', color: 'var(--clr-green)' }}>{initials}</div>
          </div>
        </header>

        <main className="l-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="l-bottom-nav" aria-label="Navigation mobile">
        {BOTTOM_NAV.map(({ to, labelKey, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `l-bottom-nav__item${isActive ? ' active' : ''}`}>
            <span className="l-bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

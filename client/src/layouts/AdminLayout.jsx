import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/admin/dashboard',          labelKey: 'admin.nav.overview',    icon: '⊞' },
  { to: '/admin/users',              labelKey: 'admin.nav.users',   icon: '◉' },
  { to: '/admin/tutor-applications', labelKey: 'admin.nav.applications',   icon: '▣' },
  { to: '/admin/resources',          labelKey: 'admin.nav.catalogue',      icon: '⊕' },
  { to: '/admin/contributions',      labelKey: 'admin.nav.contributions',  icon: '⬆' },
  { to: '/admin/submissions',        labelKey: 'admin.nav.submissions',    icon: '📤' },
  { to: '/admin/access-rules',       labelKey: 'admin.nav.access',          icon: '◈' },
  { to: '/admin/audit',              labelKey: 'admin.nav.logs',           icon: '↺' },
  { to: '/admin/settings',           labelKey: 'admin.nav.settings',       icon: '⊛' },
];

const BOTTOM_NAV = [
  { to: '/admin/dashboard',   labelKey: 'admin.nav.overview_short',         icon: '⊞' },
  { to: '/admin/users',       labelKey: 'admin.nav.members',     icon: '◉' },
  { to: '/admin/submissions', labelKey: 'admin.nav.submissions_short', icon: '📤' },
  { to: '/admin/resources',   labelKey: 'admin.nav.resources',  icon: '⊕' },
  { to: '/admin/settings',    labelKey: 'admin.nav.settings_short',    icon: '⊛' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout } = useContext(AuthContext);
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

  return (
    <div className="l-app">

      {/* Backdrop */}
      <div className={`l-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />

      {/* Sidebar */}
      <aside className={`l-sidebar${drawerOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}
             style={{ '--sidebar-accent': 'var(--clr-error)' }}>
        <div className="l-sidebar__header">
          <NavLink to="/admin/dashboard" className="l-sidebar__brand" onClick={closeDrawer}>
            <img src="/icon.png" alt="LAURA" className="l-sidebar__logo" />
            <span className="l-sidebar__name">laura ai</span>
          </NavLink>
          <button className="l-sidebar__toggle desktop-only" onClick={() => setCollapsed(c => !c)} aria-label={t('common.actions.toggle_sidebar')}>
            {collapsed ? '›' : '‹'}
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label={t('common.actions.close')}>✕</button>
        </div>

        {/* Admin role badge */}
        {!collapsed && (
          <div style={{ padding: 'var(--sp-3) var(--sp-4) 0', flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-1)',
              fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)',
              background: 'var(--clr-error-lt)', color: 'var(--clr-error)',
              padding: '3px 10px', borderRadius: 'var(--rd-full)'
            }}>
              ◈ {t('admin.role_badge')}
            </span>
          </div>
        )}

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation admin">
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
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed ? '⏻' : `⏻ ${t('admin.logout')}`}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="l-main">
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label={t('common.actions.open_menu')}>☰</button>
            <NavLink to="/admin/dashboard" className="mobile-only"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '30px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                {t('admin.role_badge')}
              </span>
            </NavLink>
            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              {t('admin.header.title')}
            </p>
          </div>
          <div className="l-topbar__right" style={{ gap: '16px', alignItems: 'center' }}>
            <LanguageSwitcher />
            <span className="desktop-only"
              style={{ fontSize: 'var(--tx-xs)', background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '3px 10px', borderRadius: 'var(--rd-full)', fontWeight: 'var(--fw-bold)' }}>
              ◈ {t('admin.role_label')}
            </span>
            <div className="avatar avatar--sm" style={{ background: 'var(--clr-error-lt)', color: 'var(--clr-error)' }}>A</div>
          </div>
        </header>

        <main className="l-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="l-bottom-nav" aria-label="Navigation mobile admin">
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

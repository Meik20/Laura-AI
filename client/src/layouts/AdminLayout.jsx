import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useContext, useState, useCallback, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/admin/dashboard',          labelKey: 'admin.nav.overview',       icon: 'layout-dashboard' },
  { to: '/admin/users',              labelKey: 'admin.nav.users',          icon: 'user-circle' },
  { to: '/admin/tutor-applications', labelKey: 'admin.nav.applications',   icon: 'clipboard-list' },
  { to: '/admin/tutors',             labelKey: 'admin.nav.tutors',         icon: 'key' },
  { to: '/admin/resources',          labelKey: 'admin.nav.catalogue',      icon: 'folders' },
  { to: '/admin/contributions',      labelKey: 'admin.nav.contributions',  icon: 'upload' },
  { to: '/admin/submissions',        labelKey: 'admin.nav.submissions',    icon: 'file-upload' },
  { to: '/admin/access-rules',       labelKey: 'admin.nav.access',         icon: 'shield' },
  { to: '/admin/audit',              labelKey: 'admin.nav.logs',           icon: 'history' },
  { to: '/admin/community',          labelKey: 'admin.nav.community',      icon: 'school' },
  { to: '/admin/support',            labelKey: 'admin.nav.support',        icon: 'headset' },
  { to: '/admin/settings',           labelKey: 'admin.nav.settings',       icon: 'settings' },
];

const BOTTOM_NAV = [
  { to: '/admin/dashboard',   labelKey: 'admin.nav.overview_short',      icon: 'home' },
  { to: '/admin/users',       labelKey: 'admin.nav.members',             icon: 'user-circle' },
  { to: '/admin/submissions', labelKey: 'admin.nav.submissions_short',   icon: 'file-upload' },
  { to: '/admin/resources',   labelKey: 'admin.nav.resources',           icon: 'folders' },
  { to: '/admin/settings',    labelKey: 'admin.nav.settings_short',      icon: 'settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const [theme, setTheme]           = useState(() => localStorage.getItem('laura-theme') || 'dark');

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('laura-theme', theme);
  }, [theme]);

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
            <i className={`ti ti-${collapsed ? 'chevron-right' : 'chevron-left'}`} />
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label={t('common.actions.close')}>
            <i className="ti ti-x" />
          </button>
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
              <i className="ti ti-shield" /> {t('admin.role_badge')}
            </span>
          </div>
        )}

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ to, labelKey, icon }) => (
            <NavLink key={to} to={to} onClick={closeDrawer}
              className={({ isActive }) => `l-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? t(labelKey) : undefined}
            >
              <span className="l-nav-item__icon" aria-hidden="true"><i className={`ti ti-${icon}`} /></span>
              <span className="l-nav-item__label">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="l-sidebar__footer">
          {/* Mobile-only theme & language switcher */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)', width: '100%', marginBottom: 'var(--sp-2)', borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-3)' }}>
            <button
              onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{
                background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)',
                cursor: 'pointer', color: 'var(--txt-secondary)', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%',
                transition: 'all var(--dur-fast)', minHeight: 'auto', padding: 0
              }}
            >
              <i className={`ti ti-${theme === 'dark' ? 'sun' : 'moon'}`} />
            </button>
            <LanguageSwitcher />
          </div>

          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed
              ? <i className="ti ti-logout" />
              : <><i className="ti ti-logout" /> {t('admin.logout')}</>
            }
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="l-main">
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label={t('common.actions.open_menu')}>
              <i className="ti ti-menu-2" />
            </button>
            <NavLink to="/admin/dashboard" className="mobile-only"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/icon.png" alt="LAURA" style={{ height: '28px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                ADMIN
              </span>
            </NavLink>
            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              {t('admin.header.title')}
            </p>
          </div>
          <div className="l-topbar__right" style={{ gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              className="flex-desktop-only"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-secondary)', fontSize: '18px', alignItems: 'center', padding: 'var(--sp-1)', borderRadius: 'var(--rd-sm)', transition: 'color var(--dur-fast)', minHeight: 'auto' }}
            >
              <i className={`ti ti-${theme === 'dark' ? 'sun' : 'moon'}`} />
            </button>
            <div className="desktop-only">
              <LanguageSwitcher />
            </div>
            <span className="desktop-only"
              style={{ fontSize: 'var(--tx-xs)', background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '3px 10px', borderRadius: 'var(--rd-full)', fontWeight: 'var(--fw-bold)' }}>
              <i className="ti ti-shield" /> {t('admin.role_label')}
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
            <span className="l-bottom-nav__icon" aria-hidden="true"><i className={`ti ti-${icon}`} /></span>
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

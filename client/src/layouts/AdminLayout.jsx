import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard',          label: 'Vue Globale',    icon: '⊞' },
  { to: '/admin/users',              label: 'Utilisateurs',   icon: '◉' },
  { to: '/admin/tutor-applications', label: 'Candidatures',   icon: '▣' },
  { to: '/admin/resources',          label: 'Catalogue',      icon: '⊕' },
  { to: '/admin/contributions',      label: 'Contributions',  icon: '⬆' },
  { to: '/admin/submissions',        label: 'Soumissions',    icon: '📤' },
  { to: '/admin/access-rules',       label: 'Accès',          icon: '◈' },
  { to: '/admin/audit',              label: 'Logs',           icon: '↺' },
  { to: '/admin/settings',           label: 'Réglages',       icon: '⊛' },
];

const BOTTOM_NAV = [
  { to: '/admin/dashboard',   label: 'Vue',         icon: '⊞' },
  { to: '/admin/users',       label: 'Membres',     icon: '◉' },
  { to: '/admin/submissions', label: 'Soumissions', icon: '📤' },
  { to: '/admin/resources',   label: 'Ressources',  icon: '⊕' },
  { to: '/admin/settings',    label: 'Réglages',    icon: '⊛' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
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
          <button className="l-sidebar__toggle desktop-only" onClick={() => setCollapsed(c => !c)} aria-label="Toggle">
            {collapsed ? '›' : '‹'}
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label="Fermer">✕</button>
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
              ◈ ADMINISTRATION
            </span>
          </div>
        )}

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} onClick={closeDrawer}
              className={({ isActive }) => `l-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="l-nav-item__icon" aria-hidden="true">{icon}</span>
              <span className="l-nav-item__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="l-sidebar__footer">
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed ? '⏻' : '⏻ Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="l-main">
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label="Menu">☰</button>
            <NavLink to="/admin/dashboard" className="mobile-only"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '30px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                ADMIN
              </span>
            </NavLink>
            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              Console d'Administration LAURA
            </p>
          </div>
          <div className="l-topbar__right">
            <span className="desktop-only"
              style={{ fontSize: 'var(--tx-xs)', background: 'var(--clr-error-lt)', color: 'var(--clr-error)', padding: '3px 10px', borderRadius: 'var(--rd-full)', fontWeight: 'var(--fw-bold)' }}>
              ◈ Admin
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
        {BOTTOM_NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `l-bottom-nav__item${isActive ? ' active' : ''}`}>
            <span className="l-bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

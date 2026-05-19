import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/* ─── Navigation items ─────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/learn/dashboard', label: 'Tableau de bord', icon: '⊞' },
  { to: '/learn/chat',      label: 'Chat LAURA',       icon: '◎' },
  { to: '/learn/revision',  label: 'Révision',          icon: '✎' },
  { to: '/learn/exams',     label: 'Examens',           icon: '✦' },
  { to: '/learn/resources', label: 'Ressources',        icon: '⊕' },
  { to: '/learn/progress',  label: 'Progression',       icon: '▲' },
  { to: '/learn/history',   label: 'Historique',        icon: '↺' },
  { to: '/learn/profile',   label: 'Mon Profil',        icon: '◉' },
  { to: '/learn/settings',  label: 'Réglages',          icon: '⊛' },
];

const BOTTOM_NAV = [
  { to: '/learn/dashboard', label: 'Accueil', icon: '⊞' },
  { to: '/learn/chat',      label: 'Chat IA',  icon: '◎' },
  { to: '/learn/revision',  label: 'Cours',    icon: '✎' },
  { to: '/learn/progress',  label: 'Stats',    icon: '▲' },
  { to: '/learn/profile',   label: 'Profil',   icon: '◉' },
];

/* ─── Role label helper ────────────────────────────────── */
function getRoleLabel(profile) {
  const label = profile?.roleLabel || '';
  if (label) return label;
  const role = profile?.role || '';
  if (role === 'student') {
    return profile?.classe ? 'Élève' : 'Étudiant';
  }
  return 'Apprenant';
}

/* ─── Avatar initials ──────────────────────────────────── */
function getInitials(profile) {
  const prenom = profile?.prenom || '';
  const nom = profile?.nom || '';
  if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return 'A';
}

/* ─── Component ────────────────────────────────────────── */
export default function LearnLayout() {
  const navigate = useNavigate();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);

  // Redirect if not logged in
  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = useCallback(async () => {
    try   { await logout(); navigate('/login'); }
    catch { /* silent */ }
  }, [logout, navigate]);

  const closeDrawer = () => setDrawerOpen(false);
  const initials    = getInitials(userProfile);
  const roleLabel   = getRoleLabel(userProfile);
  const displayName = userProfile?.prenom || currentUser?.displayName || 'Apprenant';

  return (
    <div className="l-app">

      {/* ── Backdrop (mobile drawer overlay) ── */}
      <div
        className={`l-backdrop${drawerOpen ? ' is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside className={`l-sidebar${drawerOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>

        {/* Header */}
        <div className="l-sidebar__header">
          <NavLink to="/learn/dashboard" className="l-sidebar__brand" onClick={closeDrawer}>
            <img src="/logo.png" alt="LAURA" className="l-sidebar__logo" />
            <span className="l-sidebar__name">laura ai</span>
          </NavLink>

          {/* Desktop collapse toggle */}
          <button
            className="l-sidebar__toggle desktop-only"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Développer' : 'Réduire'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? '›' : '‹'}
          </button>

          {/* Mobile close */}
          <button
            className="l-sidebar__toggle mobile-only"
            onClick={closeDrawer}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation principale">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeDrawer}
              className={({ isActive }) => `l-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <span className="l-nav-item__icon" aria-hidden="true">{icon}</span>
              <span className="l-nav-item__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="l-sidebar__footer">
          {/* User mini-card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-2) 0', overflow: 'hidden' }}>
            <div className="avatar avatar--sm" style={{ flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', margin: 0 }}>{displayName}</p>
                <p className="truncate" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>{roleLabel}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => { closeDrawer(); navigate('/learn/chat?new=true'); }}
            className="laura-btn laura-btn-primary"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', justifyContent: 'center' }}
          >
            {collapsed ? '+' : '+ Nouveau Chat'}
          </button>

          <button
            onClick={handleLogout}
            className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', color: 'var(--clr-error)', justifyContent: 'center' }}
          >
            {collapsed ? '⏻' : '⏻ Déconnexion'}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="l-main">

        {/* Topbar */}
        <header className="l-topbar">
          <div className="l-topbar__left">
            {/* Mobile: menu burger */}
            <button
              className="l-topbar__menu-btn mobile-only"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>

            {/* Mobile: logo */}
            <NavLink to="/learn/dashboard" className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '30px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-brand-lt)', color: 'var(--clr-brand)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                {roleLabel.toUpperCase()}
              </span>
            </NavLink>

            {/* Desktop: breadcrumb / page context */}
            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              Espace d'Étude Intelligent
            </p>
          </div>

          <div className="l-topbar__right">
            {/* Desktop: user info */}
            <span className="desktop-only" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
              {roleLabel} · <strong style={{ color: 'var(--txt-primary)' }}>{displayName}</strong>
            </span>
            <div className="avatar avatar--sm">{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="l-content">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="l-bottom-nav" aria-label="Navigation mobile">
        {BOTTOM_NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `l-bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <span className="l-bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}

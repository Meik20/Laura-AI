import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

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

function getRoleLabel(profile) {
  const label = profile?.roleLabel || '';
  if (label) return label;
  const role = profile?.role || '';
  if (role === 'student') return profile?.classe ? 'Élève' : 'Étudiant';
  return 'Apprenant';
}

function getInitials(profile) {
  const prenom = profile?.prenom || '';
  const nom    = profile?.nom    || '';
  if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return 'A';
}

/* ─── Profile Popover ───────────────────────────────────────────────────── */
function ProfilePopover({ isOpen, onClose, userProfile, displayName, roleLabel, initials, navigate, handleLogout }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const profile = userProfile || {};

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + var(--sp-2))',
        right: 0,
        zIndex: 'var(--z-popover)',
        width: '280px',
        background: 'var(--srf-base)',
        border: '1px solid var(--brd-subtle)',
        borderRadius: 'var(--rd-xl)',
        boxShadow: 'var(--shd-xl)',
        animation: 'scaleIn var(--dur-fast) var(--ease-spring)',
        overflow: 'hidden',
      }}
      role="dialog"
      aria-label="Profil académique"
    >
      {/* Top gradient strip */}
      <div style={{ height: '6px', background: 'var(--grd-brand)' }} />

      {/* User identity */}
      <div style={{ padding: 'var(--sp-5)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)' }}>
        <div className="avatar" style={{ width: '48px', height: '48px', fontSize: 'var(--tx-md)', flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <p className="truncate" style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-primary)', margin: 0 }}>{displayName}</p>
          <p className="truncate" style={{ fontSize: 'var(--tx-xs)', color: 'var(--clr-brand)', margin: 0, fontWeight: 'var(--fw-semibold)' }}>{roleLabel}</p>
        </div>
      </div>

      {/* Academic profile rows */}
      <div style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
        <p style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--sp-3)', margin: '0 0 var(--sp-3)' }}>
          Profil Académique
        </p>
        {[
          { label: 'Niveau',   value: profile.niveau  || profile.classe       || profile.niveauEtude || '—' },
          { label: 'Examen',   value: profile.examen  || profile.examenEleve  || '—' },
          { label: 'Série',    value: profile.serie   || '—' },
          { label: 'Filière',  value: profile.filiere || profile.discipline   || null },
        ].filter(r => r.value && r.value !== '—' || r.label === 'Niveau' || r.label === 'Examen')
          .map(({ label, value }) => value && (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--brd-subtle)', fontSize: 'var(--tx-xs)' }}>
            <span style={{ color: 'var(--txt-tertiary)' }}>{label}</span>
            <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: 'var(--sp-3) var(--sp-5) var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <button
          onClick={() => { navigate('/learn/profile'); onClose(); }}
          className="laura-btn laura-btn-secondary"
          style={{ width: '100%', justifyContent: 'center', minHeight: '36px', fontSize: 'var(--tx-xs)' }}
        >
          ✏️ Modifier mon profil
        </button>
        <button
          onClick={handleLogout}
          className="laura-btn laura-btn-ghost"
          style={{ width: '100%', justifyContent: 'center', minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
        >
          ⏻ Déconnexion
        </button>
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function LearnLayout() {
  const navigate = useNavigate();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [collapsed,     setCollapsed]     = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);

  if (!currentUser) {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogout = useCallback(async () => {
    try { await logout(); navigate('/login'); }
    catch { /* silent */ }
  }, [logout, navigate]);

  const closeDrawer = () => setDrawerOpen(false);
  const initials    = getInitials(userProfile);
  const roleLabel   = getRoleLabel(userProfile);
  const displayName = userProfile?.prenom || currentUser?.displayName || 'Apprenant';

  return (
    <div className="l-app">

      {/* Backdrop (mobile drawer) */}
      <div className={`l-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />

      {/* ── Sidebar ── */}
      <aside className={`l-sidebar${drawerOpen ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>

        <div className="l-sidebar__header">
          <NavLink to="/learn/dashboard" className="l-sidebar__brand" onClick={closeDrawer}>
            <img src="/icon.png" alt="LAURA" className="l-sidebar__logo" />
            <span className="l-sidebar__name">laura ai</span>
          </NavLink>
          <button className="l-sidebar__toggle desktop-only" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Développer' : 'Réduire'} aria-label="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label="Fermer">✕</button>
        </div>

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation principale">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', overflow: 'hidden' }}>
            <div className="avatar avatar--sm" style={{ flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', margin: 0 }}>{displayName}</p>
                <p className="truncate" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>{roleLabel}</p>
              </div>
            )}
          </div>
          <button onClick={() => { closeDrawer(); navigate('/learn/chat?new=true'); }}
            className="laura-btn laura-btn-primary"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', justifyContent: 'center' }}>
            {collapsed ? '+' : '+ Nouveau Chat'}
          </button>
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed ? '⏻' : '⏻ Déconnexion'}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="l-main">

        {/* Topbar */}
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label="Ouvrir le menu">☰</button>

            <NavLink to="/learn/dashboard" className="mobile-only"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/icon.png" alt="LAURA" style={{ height: '28px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-brand-lt)', color: 'var(--clr-brand)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                {roleLabel.toUpperCase()}
              </span>
            </NavLink>

            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              Bonjour <strong style={{ color: 'var(--txt-primary)' }}>{displayName}</strong> 👋
            </p>
          </div>

          <div className="l-topbar__right">
            <span className="desktop-only" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
              {roleLabel}
            </span>

            {/* Avatar with profile popover — the key feature */}
            <div style={{ position: 'relative' }}>
              <button
                className="avatar avatar--sm"
                onClick={() => setProfileOpen(o => !o)}
                aria-label="Mon profil académique"
                aria-expanded={profileOpen}
                style={{ cursor: 'pointer', border: profileOpen ? '2px solid var(--clr-brand)' : '2px solid transparent', transition: 'border-color var(--dur-fast)' }}
              >
                {initials}
              </button>

              <ProfilePopover
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                userProfile={userProfile}
                displayName={displayName}
                roleLabel={roleLabel}
                initials={initials}
                navigate={navigate}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="l-content">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="l-bottom-nav" aria-label="Navigation mobile">
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

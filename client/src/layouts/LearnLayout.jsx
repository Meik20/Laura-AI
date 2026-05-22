import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SupportWidget from '../components/SupportWidget';

const NAV_ITEMS = [
  { to: '/learn/dashboard', labelKey: 'learn.nav.dashboard', icon: 'layout-dashboard' },
  { to: '/learn/chat',      labelKey: 'learn.nav.chat',       icon: 'message' },
  { to: '/learn/revision',  labelKey: 'learn.nav.revision',   icon: 'book' },
  { to: '/learn/exams',     labelKey: 'learn.nav.exams',      icon: 'file-certificate' },
  { to: '/learn/resources', labelKey: 'learn.nav.resources',  icon: 'folders' },
  { to: '/learn/community', labelKey: 'learn.nav.community',  icon: 'school' },
  { to: '/learn/progress',  labelKey: 'learn.nav.progress',   icon: 'chart-bar' },
  { to: '/learn/history',   labelKey: 'learn.nav.history',    icon: 'history' },
  { to: '/learn/profile',   labelKey: 'learn.nav.profile',    icon: 'user-circle' },
  { to: '/learn/settings',  labelKey: 'learn.nav.settings',   icon: 'settings' },
];

const BOTTOM_NAV = [
  { to: '/learn/dashboard', labelKey: 'learn.nav.home',          icon: 'home' },
  { to: '/learn/chat',      labelKey: 'learn.nav.chat_ia',       icon: 'message' },
  { to: '/learn/revision',  labelKey: 'learn.nav.courses',       icon: 'book' },
  { to: '/learn/progress',  labelKey: 'learn.nav.stats',         icon: 'chart-bar' },
  { to: '/learn/profile',   labelKey: 'learn.nav.profile_short', icon: 'user-circle' },
];

function getRoleLabel(profile, t) {
  const label = profile?.roleLabel || '';
  if (label === 'Élève') return t('common.roles.student_seco');
  if (label === 'Étudiant') return t('common.roles.student_univ');
  if (label) return label;
  const role = profile?.role || '';
  if (role === 'student') return profile?.classe ? t('common.roles.student_seco') : t('common.roles.student_univ');
  return t('common.roles.learner');
}

function getInitials(profile) {
  const prenom = profile?.prenom || '';
  const nom    = profile?.nom    || '';
  if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return 'A';
}

/* ─── Profile Popover ───────────────────────────────────────────────────── */
function ProfilePopover({ isOpen, onClose, userProfile, displayName, roleLabel, initials, navigate, handleLogout, t }) {
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
          {t('learn.popover.academic_profile')}
        </p>
        {[
          { label: t('learn.popover.level'),   value: profile.niveau  || profile.classe       || profile.niveauEtude || '—' },
          { label: t('learn.popover.exam'),   value: profile.examen  || profile.examenEleve  || '—' },
          { label: t('learn.popover.stream'),    value: profile.serie   || '—' },
          { label: t('learn.popover.major'),  value: profile.filiere || profile.discipline   || null },
        ].filter(r => r.value && r.value !== '—' || r.label === t('learn.popover.level') || r.label === t('learn.popover.exam'))
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
          {t('learn.popover.edit_profile')}
        </button>
        <button
          onClick={handleLogout}
          className="laura-btn laura-btn-ghost"
          style={{ width: '100%', justifyContent: 'center', minHeight: '36px', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
        >
          {t('learn.popover.logout')}
        </button>
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function LearnLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme,       setTheme]       = useState(() => localStorage.getItem('laura-theme') || 'dark');

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('laura-theme', theme);
  }, [theme]);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = useCallback(async () => {
    try { await logout(); navigate('/login'); }
    catch { /* silent */ }
  }, [logout, navigate]);

  const closeDrawer = () => setDrawerOpen(false);
  const initials    = getInitials(userProfile);
  const roleLabel   = getRoleLabel(userProfile, t);
  const displayName = userProfile?.prenom || currentUser?.displayName || t('common.roles.learner');

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
          <button className="l-sidebar__toggle desktop-only" onClick={() => setCollapsed(c => !c)} title={collapsed ? t('common.actions.expand') : t('common.actions.collapse')} aria-label="Toggle sidebar">
            <i className={`ti ti-${collapsed ? 'chevron-right' : 'chevron-left'}`} />
          </button>
          <button className="l-sidebar__toggle mobile-only" onClick={closeDrawer} aria-label={t('common.actions.close')}><i className="ti ti-x" /></button>
        </div>

        <nav className="l-sidebar__nav no-scrollbar" aria-label="Navigation principale">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', overflow: 'hidden' }}>
            <div className="avatar avatar--sm" style={{ flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', margin: 0 }}>{displayName}</p>
                <p className="truncate" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>{roleLabel}</p>
              </div>
            )}
          </div>

          {/* Mobile-only theme & language switcher */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)', width: '100%', marginTop: 'var(--sp-2)', borderTop: '1px solid var(--brd-subtle)', paddingTop: 'var(--sp-3)' }}>
            <button
              onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{
                background: 'var(--srf-raised)',
                border: '1px solid var(--brd-subtle)',
                cursor: 'pointer',
                color: 'var(--txt-secondary)',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                transition: 'all var(--dur-fast)',
                minHeight: 'auto',
                padding: 0
              }}
            >
              <i className={`ti ti-${theme === 'dark' ? 'sun' : 'moon'}`} />
            </button>
            <LanguageSwitcher />
          </div>

          <button onClick={() => { closeDrawer(); navigate('/learn/chat?new=true'); }}
            className="laura-btn laura-btn-primary"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', justifyContent: 'center' }}>
            {collapsed ? '+' : `+ ${t('learn.nav.new_chat')}`}
          </button>
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost"
            style={{ minHeight: '36px', fontSize: 'var(--tx-xs)', padding: '0 var(--sp-3)', color: 'var(--clr-error)', justifyContent: 'center' }}>
            {collapsed ? '⏻' : `⏻ ${t('learn.popover.logout')}`}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="l-main">

        {/* Topbar */}
        <header className="l-topbar">
          <div className="l-topbar__left">
            <button className="l-topbar__menu-btn mobile-only" onClick={() => setDrawerOpen(true)} aria-label={t('common.actions.open_menu')}><i className="ti ti-menu-2" /></button>

            <NavLink to="/learn/dashboard" className="mobile-only"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
              <img src="/logo.png" alt="LAURA" style={{ height: '30px' }} />
              <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 800, background: 'var(--clr-brand-lt)', color: 'var(--clr-brand)', padding: '2px var(--sp-2)', borderRadius: 'var(--rd-full)' }}>
                {roleLabel.toUpperCase()}
              </span>
            </NavLink>

            <p className="desktop-only" style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
              {t('learn.header.hello')} <strong style={{ color: 'var(--txt-primary)' }}>{displayName}</strong> 👋
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
            <span className="desktop-only" style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
              {roleLabel}
            </span>

            {/* Avatar with profile popover — the key feature */}
            <div style={{ position: 'relative' }}>
              <button
                className="avatar avatar--sm"
                onClick={() => setProfileOpen(o => !o)}
                aria-label={t('learn.popover.academic_profile')}
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
                t={t}
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
        {BOTTOM_NAV.map(({ to, labelKey, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `l-bottom-nav__item${isActive ? ' active' : ''}`}>
            <span className="l-bottom-nav__icon" aria-hidden="true"><i className={`ti ti-${icon}`} /></span>
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Support widget */}
      <SupportWidget />

    </div>
  );
}

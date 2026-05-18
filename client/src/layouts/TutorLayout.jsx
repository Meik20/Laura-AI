import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function TutorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
    }
  };

  const links = [
    { path: '/tutor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tutor/chat', label: 'Chat IA', icon: '💬' },
    { path: '/tutor/resources', label: 'Ressources', icon: '📚' },
    { path: '/tutor/submissions', label: 'Soumissions', icon: '📤' },
    { path: '/tutor/history', label: 'Historique', icon: '🕒' },
    { path: '/tutor/profile', label: 'Profil & Droits', icon: '👤' },
    { path: '/tutor/settings', label: 'Réglages', icon: '⚙️' },
  ];

  // Mobile nav shows 5 main shortcuts
  const mobileShortcuts = [
    { path: '/tutor/dashboard', label: 'Tableau', icon: '📊' },
    { path: '/tutor/chat', label: 'Chat IA', icon: '💬' },
    { path: '/tutor/resources', label: 'Catalogue', icon: '📚' },
    { path: '/tutor/submissions', label: 'Activité', icon: '📤' },
    { path: '/tutor/profile', label: 'Mon Profil', icon: '👤' },
  ];

  return (
    <div className={`laura-app tutor-layout ${isCollapsed ? 'is-collapsed' : ''}`}>
      
      {/* MOBILE HEADER BAR */}
      <header className="laura-topbar mobile-header-bar">
        <button className="hamburger-btn" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="LAURA" style={{ height: '36px' }} />
          <span style={{ fontSize: '0.7rem', background: 'var(--laura-success-bg)', color: 'var(--laura-success)', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', fontWeight: 800 }}>TUTEUR</span>
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* BACKDROP OVERLAY */}
      <div className={`laura-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR TUTEUR (laura-rail) */}
      <aside className={`laura-rail responsive-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO & TOGGLE */}
        <div style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--laura-border-soft)', position: 'relative' }}>
          <Link to="/tutor/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <img src="/logo.png" alt="LAURA" style={{ height: '42px', transition: 'height 0.2s' }} />
            {!isCollapsed && <span style={{ fontSize: '0.65rem', background: 'var(--laura-success-bg)', color: 'var(--laura-success)', padding: '1px 6px', borderRadius: 'var(--r-full)', fontWeight: 800 }}>TUTEUR</span>}
          </Link>

          <button 
            className="desktop-only-header"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ 
              position: 'absolute', right: '-12px', top: '12px', 
              background: 'white', border: '1px solid var(--laura-border-soft)', 
              borderRadius: '50%', width: '24px', height: '24px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-xs)' 
            }}
          >
            {isCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="laura-rail-nav no-scrollbar" style={{ flex: 1, marginTop: 'var(--sp-6)', overflowY: 'auto' }}>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={`laura-rail-item ${isActive ? 'is-active' : ''}`}
                title={isCollapsed ? link.label : ''}
              >
                <span style={{ fontSize: '1.4rem' }}>{link.icon}</span>
                <span className="rail-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACTION */}
        <div style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--laura-border-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isCollapsed && (
            <div className="laura-badge laura-badge-success" style={{ justifyContent: 'center', minHeight: '32px', fontSize: '11px', borderRadius: 'var(--r-md)' }}>
              Statut: {userProfile?.roleLabel || 'Contributeur'}
            </div>
          )}
          <button onClick={() => { setIsSidebarOpen(false); navigate('/tutor/chat?new=true'); }} className="laura-btn laura-btn-primary" style={{ minHeight: '34px', padding: '0 8px', fontSize: '11px', justifyContent: 'center' }} title="Nouveau Chat">
            {isCollapsed ? '➕' : '➕ Nouveau Chat'}
          </button>
          <button onClick={handleLogout} className="laura-btn laura-btn-ghost" style={{ minHeight: '34px', padding: '0 8px', fontSize: '11px', color: 'var(--laura-danger)', justifyContent: 'center' }} title="Quitter">
            {isCollapsed ? '🚪' : '🚪 Quitter'}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="laura-bottom-nav">
        {mobileShortcuts.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`laura-bottom-nav-item ${isActive ? 'is-active' : ''}`}
            >
              <span style={{ fontSize: '1.3rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* SHELL FOR HEADER & MAIN */}
      <div className="laura-shell">
        
        {/* DESKTOP TOPBAR */}
        <header className="laura-topbar desktop-only-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0, color: 'var(--laura-text-2)' }}>
            Espace Pédagogique (Tuteurs)
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>
              Compagnon : <strong>{currentUser.name || currentUser.email}</strong>
            </span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="laura-main">
          <div className="laura-page">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}

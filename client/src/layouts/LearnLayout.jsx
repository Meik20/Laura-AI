import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function LearnLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext);
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
    { path: '/learn/dashboard', label: 'Tableau', icon: '📊' },
    { path: '/learn/chat', label: 'Chat Laura', icon: '💬' },
    { path: '/learn/revision', label: 'Révision', icon: '📝' },
    { path: '/learn/exams', label: 'Examens', icon: '🎓' },
    { path: '/learn/resources', label: 'Ressources', icon: '📚' },
    { path: '/learn/history', label: 'Historique', icon: '🕒' },
    { path: '/learn/progress', label: 'Progression', icon: '📈' },
    { path: '/learn/profile', label: 'Mon Profil', icon: '👤' },
    { path: '/learn/settings', label: 'Réglages', icon: '⚙️' },
  ];

  const mobileShortcuts = [
    { path: '/learn/dashboard', label: 'Accueil', icon: '📊' },
    { path: '/learn/chat', label: 'Chat IA', icon: '💬' },
    { path: '/learn/revision', label: 'Cours', icon: '📝' },
    { path: '/learn/progress', label: 'Stats', icon: '📈' },
    { path: '/learn/profile', label: 'Profil', icon: '👤' },
  ];

  return (
    <div className={`laura-app learn-layout ${isCollapsed ? 'is-collapsed' : ''}`}>
      
      {/* MOBILE HEADER BAR */}
      <header className="laura-topbar mobile-header-bar">
        <button className="hamburger-btn" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="LAURA" style={{ height: '36px' }} />
          <span style={{ fontSize: '0.7rem', background: 'var(--laura-info-bg)', color: 'var(--laura-primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', fontWeight: 800 }}>ÉLÈVE</span>
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* BACKDROP OVERLAY */}
      <div className={`laura-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR STUDENT (laura-rail) */}
      <aside className={`laura-rail responsive-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO & TOGGLE */}
        <div style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--laura-border-soft)', position: 'relative' }}>
          <Link to="/learn/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <img src="/logo.png" alt="LAURA" style={{ height: '42px', transition: 'height 0.2s' }} />
            {!isCollapsed && <span style={{ fontWeight: 800, color: 'var(--laura-primary)', fontSize: '14px', letterSpacing: '-0.5px' }}>laura ai</span>}
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
          <button onClick={() => { setIsSidebarOpen(false); navigate('/learn/chat?new=true'); }} className="laura-btn laura-btn-primary" style={{ minHeight: '34px', padding: '0 8px', fontSize: '11px', justifyContent: 'center' }} title="Nouveau Chat">
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
            Espace d'Étude Intelligent
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>
              Étudiant : <strong>{currentUser.name || currentUser.email}</strong>
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

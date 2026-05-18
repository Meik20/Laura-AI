import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    { path: '/admin/dashboard', label: 'Vue Globale', icon: '🌍' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/tutor-applications', label: 'Candidatures', icon: '🎓' },
    { path: '/admin/resources', label: 'Catalogue', icon: '📚' },
    { path: '/admin/access-rules', label: 'Accès', icon: '🔐' },
    { path: '/admin/audit', label: 'Logs', icon: '📋' },
    { path: '/admin/settings', label: 'Réglages', icon: '⚙️' },
  ];

  // Mobile nav shows 5 main shortcuts
  const mobileShortcuts = [
    { path: '/admin/dashboard', label: 'Vue', icon: '🌍' },
    { path: '/admin/users', label: 'Membres', icon: '👥' },
    { path: '/admin/tutor-applications', label: 'Postulants', icon: '🎓' },
    { path: '/admin/resources', label: 'Ressources', icon: '📚' },
    { path: '/admin/settings', label: 'Réglages', icon: '⚙️' },
  ];

  return (
    <div className="laura-app admin-layout">
      
      {/* MOBILE HEADER BAR */}
      <header className="laura-topbar mobile-header-bar">
        <button className="hamburger-btn" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="LAURA" style={{ height: '36px' }} />
          <span style={{ fontSize: '0.7rem', background: 'var(--laura-danger)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: 'var(--r-full)', fontWeight: 800 }}>ADMIN</span>
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* BACKDROP OVERLAY */}
      <div className={`laura-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR ADMIN (laura-rail) */}
      <aside className={`laura-rail responsive-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO */}
        <div style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--laura-border-soft)' }}>
          <Link to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <img src="/logo.png" alt="LAURA" style={{ height: '42px' }} />
            <span style={{ fontSize: '0.65rem', background: 'var(--laura-danger)', color: 'white', padding: '1px 6px', borderRadius: 'var(--r-full)', fontWeight: 800 }}>ADMIN</span>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="laura-rail-nav" style={{ flex: 1, marginTop: 'var(--sp-6)' }}>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={`laura-rail-item ${isActive ? 'is-active' : ''}`}
              >
                <span style={{ fontSize: '1.4rem' }}>{link.icon}</span>
                <span className="rail-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACTION */}
        <div style={{ paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--laura-border-soft)' }}>
          <button onClick={handleLogout} className="laura-btn laura-btn-secondary" style={{ width: '100%', minHeight: '38px', padding: '0 8px', fontSize: '12px' }}>
            <span>🚪</span> Quitter
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
            Espace d'Administration
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>
              Connecté : <strong>{currentUser.name || currentUser.email}</strong>
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

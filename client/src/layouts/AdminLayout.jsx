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
    { path: '/admin/tutor-applications', label: 'Candidatures Tuteur', icon: '🎓' },
    { path: '/admin/resources', label: 'Catalogue Ressources', icon: '📚' },
    { path: '/admin/access-rules', label: 'Règles d\'accès', icon: '🔐' },
    { path: '/admin/audit', label: 'Logs & Audit', icon: '📋' },
    { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout responsive-layout-container" style={{ minHeight: '100vh', fontFamily: "var(--font-family)", color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
      
      {/* MOBILE HEADER BAR */}
      <div className="mobile-header-bar" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
        <button className="hamburger-btn" style={{ color: 'var(--text-primary)' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="mobile-header-bar__brand">
          <img src="/logo.png" alt="LAURA" style={{ height: '36px' }} />
          <span style={{ fontSize: '0.75rem', background: '#DC2626', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>ADMIN</span>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* BACKDROP OVERLAY */}
      <div className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR ADMIN */}
      <aside className={`responsive-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border-light)' }}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" style={{ color: 'var(--text-primary)' }} onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO */}
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h1 style={{ margin: 0 }}>
            <Link to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/logo.png" alt="LAURA" style={{ height: '42px' }} />
              <span style={{ fontSize: '0.75rem', background: '#DC2626', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>ADMIN</span>
            </Link>
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsSidebarOpen(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', 
                  borderRadius: '0.75rem', textDecoration: 'none', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACTION */}
        <div style={{ padding: '1.5rem' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto', maxHeight: '100vh' }}>
        <Outlet />
      </main>

    </div>
  );
}

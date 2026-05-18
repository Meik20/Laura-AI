import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function TutorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, userProfile } = useContext(AuthContext);
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
    { path: '/tutor/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/tutor/chat', label: 'Chat Pédagogique', icon: '💬' },
    { path: '/tutor/resources', label: 'Ressources', icon: '📚' },
    { path: '/tutor/submissions', label: 'Mes Soumissions', icon: '📤' },
    { path: '/tutor/history', label: 'Historique', icon: '🕒' },
    { path: '/tutor/profile', label: 'Profil & Droits', icon: '👤' },
    { path: '/tutor/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <div className="tutor-layout responsive-layout-container" style={{ minHeight: '100vh', fontFamily: "var(--font-family)", color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
      
      {/* MOBILE HEADER BAR */}
      <div className="mobile-header-bar" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
        <button className="hamburger-btn" style={{ color: 'var(--text-primary)' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="mobile-header-bar__brand">
          <img src="/logo.png" alt="LAURA" style={{ height: '36px' }} />
          <span style={{ fontSize: '0.8rem', background: 'var(--success-light)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>TUTEUR</span>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* BACKDROP OVERLAY */}
      <div className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR TUTEUR */}
      <aside className={`responsive-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border-light)' }}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" style={{ color: 'var(--text-primary)' }} onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO */}
        <div style={{ padding: '1.5rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h1 style={{ margin: 0 }}>
            <Link to="/tutor/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/logo.png" alt="LAURA" style={{ height: '46px' }} />
              <span style={{ fontSize: '0.8rem', background: 'var(--success-light)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>TUTEUR</span>
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
                  color: isActive ? 'var(--success)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--success-light)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM ACTION */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--success)', marginBottom: '1rem' }}>
            <strong>Statut:</strong> {userProfile?.roleLabel || 'Contributeur'} ✅
          </div>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/tutor/chat?new=true'); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-light)', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span>➕</span> Nouvelle conv.
          </button>
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

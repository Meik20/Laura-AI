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
    <div className="tutor-layout responsive-layout-container" style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#1A1A1A', background: '#F9F9F8' }}>
      
      {/* MOBILE HEADER BAR */}
      <div className="mobile-header-bar">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
        <div className="mobile-header-bar__brand">
          <img src="/logo.png" alt="LAURA" />
          <span style={{ fontSize: '0.8rem', background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>TUTEUR</span>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* BACKDROP OVERLAY */}
      <div className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR TUTEUR */}
      <aside className={`responsive-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ background: '#F5F4EF', borderRight: '1px solid #E5E5E2' }}>
        
        {/* MOBILE CLOSE BUTTON */}
        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>

        {/* LOGO */}
        <div style={{ padding: '1.5rem 1.5rem' }}>
          <h1 style={{ margin: 0 }}>
            <Link to="/tutor/dashboard" onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/logo.png" alt="LAURA" style={{ height: '46px' }} />
              <span style={{ fontSize: '0.8rem', background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 800 }}>TUTEUR</span>
            </Link>
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                  color: isActive ? 'white' : '#444',
                  background: isActive ? '#00A37A' : 'transparent', // Vert pour les tuteurs
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
        <div style={{ padding: '1.5rem' }}>
          <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#0369A1', marginBottom: '1rem' }}>
            <strong>Statut:</strong> {userProfile?.roleLabel || 'Contributeur'} ✅
          </div>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/tutor/chat?new=true'); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <span>➕</span> Nouvelle conv.
          </button>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '3rem 4rem', background: '#F9F9F8', overflowY: 'auto', maxHeight: '100vh' }}>
        <Outlet />
      </main>

    </div>
  );
}

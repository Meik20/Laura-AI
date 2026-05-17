import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function LearnLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useContext(AuthContext);

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
    { path: '/learn/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/learn/chat', label: 'Chat LAURA', icon: '💬' },
    { path: '/learn/revision', label: 'Révision', icon: '📝' },
    { path: '/learn/exams', label: 'Examens', icon: '🎓' },
    { path: '/learn/resources', label: 'Ressources', icon: '📚' },
    { path: '/learn/history', label: 'Historique', icon: '🕒' },
    { path: '/learn/progress', label: 'Progression', icon: '📈' },
    { path: '/learn/profile', label: 'Profil', icon: '👤' },
    { path: '/learn/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#1A1A1A', background: '#F9F9F8' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', background: '#F5F4EF', borderRight: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column' }}>
        
        {/* LOGO */}
        <div style={{ padding: '1.5rem 1.5rem' }}>
          <Link to="/learn/dashboard" style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/logo.png" alt="LAURA" style={{ height: '46px' }} />
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', 
                  borderRadius: '0.75rem', textDecoration: 'none', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : '#444',
                  background: isActive ? '#1A1A1A' : 'transparent',
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
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button onClick={() => navigate('/learn/chat?new=true')} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>➕</span> Nouvelle conv.
          </button>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.8rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
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

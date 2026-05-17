import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: 'white', background: '#080C14' }}>
      
      {/* SIDEBAR ADMIN */}
      <aside style={{ width: '280px', background: '#0F1520', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        
        {/* LOGO */}
        <div style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            LAURA AI <span style={{ fontSize: '0.75rem', background: '#DC2626', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>ADMIN</span>
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
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', 
                  borderRadius: '0.75rem', textDecoration: 'none', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : '#94A3B8',
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderLeft: isActive ? '3px solid #DC2626' : '3px solid transparent',
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
          <button style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
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

import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", background: '#F9F9F8', color: '#1A1A1A' }}>
      
      <header style={{ padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img src="/logo.png" alt="LAURA" style={{ height: '48px' }} />
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/how-it-works" style={{ color: '#4A4A47', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Comment ça marche</Link>
          <Link to="/become-tutor" style={{ color: '#4A4A47', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Devenez tuteur</Link>
          <Link to="/login" style={{ color: '#1A1A1A', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Connexion</Link>
          <Link to="/signup" style={{ background: '#1A1A1A', color: 'white', padding: '0.6rem 1.3rem', borderRadius: '0.6rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>S'inscrire</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: '#1A1A1A', color: '#A3A3A3', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/logo.png" alt="LAURA" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
          </Link>
        </div>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Learning AI & Unified Resource Assistant</p>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>© 2026 LAURA — Tous droits réservés</p>
      </footer>
    </div>
  );
}

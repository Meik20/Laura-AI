import { Link, Outlet, useLocation } from 'react-router-dom';

export default function PublicLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';

  if (isLoginPage || isSignupPage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--laura-bg-page)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        <Link to="/" style={{ marginBottom: '1.5rem', display: 'inline-block', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img src="/logo.png" alt="LAURA" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-family-primary)', background: 'var(--color-bg-page)', color: 'var(--color-text-primary)' }}>
      
      <header style={{ padding: '1rem 2rem', background: 'var(--color-bg-card)', borderBottom: 'var(--border-width-thin) solid var(--color-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'transform 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img src="/logo.png" alt="LAURA" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        <nav className="public-header-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/how-it-works" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Comment ça marche</Link>
          <Link to="/become-tutor" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Devenez tuteur</Link>
          <Link to="/login" style={{ color: 'var(--color-text-primary)', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>Connexion</Link>
          <Link to="/signup" style={{ background: 'var(--color-primary)', color: 'var(--color-white)', padding: '0.6rem 1.3rem', borderRadius: '0.6rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', transition: 'background-color var(--transition-fast)', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>S'inscrire</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: 'var(--color-neutral-900)', color: 'var(--color-neutral-400)', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/logo.png" alt="LAURA" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
          </Link>
        </div>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-white)' }}>Learning AI & Unified Resource Assistant</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)' }}>© 2026 LAURA — Tous droits réservés</p>
      </footer>
    </div>
  );
}

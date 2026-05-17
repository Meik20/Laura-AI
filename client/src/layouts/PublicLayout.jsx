import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", background: '#F9F9F8' }}>
      <header style={{ padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>LAURA AI</div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="/login" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Connexion</a>
          <a href="/signup" style={{ background: '#1A1A1A', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>S'inscrire</a>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
      <footer style={{ background: '#1A1A1A', color: 'white', padding: '2rem', textAlign: 'center' }}>
        LAURA AI © 2026
      </footer>
    </div>
  );
}

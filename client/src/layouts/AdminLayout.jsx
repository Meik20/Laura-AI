import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: 'white', background: '#080C14' }}>
      <aside style={{ width: '250px', background: '#0F1520', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
        <h3>Espace Admin</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <a href="/admin/dashboard" style={{ textDecoration: 'none', color: '#ccc' }}>Tableau de bord</a>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

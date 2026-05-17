import { Outlet } from 'react-router-dom';

export default function TutorLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <aside style={{ width: '250px', background: '#F0F0EE', borderRight: '1px solid #E5E5E2', padding: '2rem' }}>
        <h3>Espace Tuteur</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <a href="/tutor/dashboard" style={{ textDecoration: 'none', color: '#1A1A1A' }}>Tableau de bord</a>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem', background: '#F9F9F8' }}>
        <Outlet />
      </main>
    </div>
  );
}

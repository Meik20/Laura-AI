import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Élèves', value: '4 205', icon: '🎒', color: '#3B82F6' },
    { label: 'Étudiants', value: '1 832', icon: '🎓', color: '#8B5CF6' },
    { label: 'Tuteurs (Total)', value: '145', icon: '👨‍🏫', color: '#10B981' },
    { label: 'Contributeurs', value: '38', icon: '⭐', color: '#F59E0B' }
  ];

  const alerts = [
    { type: 'warning', msg: '12 candidatures tuteurs en attente de révision.', link: '/admin/tutor-applications' },
    { type: 'info', msg: '5 nouvelles soumissions de ressources à valider.', link: '/admin/submissions' },
    { type: 'error', msg: 'Pic de requêtes détecté sur le Chat Apprenant.', link: '/admin/audit' }
  ];

  const cardStyle = { background: '#0F1520', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Tableau de bord</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>
            Vue globale de l'activité sur LAURA.
          </p>
        </div>
      </div>

      {/* KPI CARDS (Point 17.2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <span style={{ background: `${s.color}20`, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>Actifs</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{s.value}</h3>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        
        {/* GRAPHIQUE ACTIVITÉ (Simulé) */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700 }}>Activité Chat (7 derniers jours)</h2>
          <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem' }}>
            {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(to top, #3B82F6, #60A5FA)', borderRadius: '0.5rem 0.5rem 0 0', opacity: 0.8 }}></div>
            ))}
          </div>
        </div>

        {/* ALERTES ET ACTIONS À PRENDRE (Point 17.3) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700 }}>Centre d'action</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${a.type === 'warning' ? '#F59E0B' : a.type === 'error' ? '#DC2626' : '#3B82F6'}`, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <span style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.5 }}>{a.msg}</span>
                  <Link to={a.link} style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start' }}>Traiter →</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

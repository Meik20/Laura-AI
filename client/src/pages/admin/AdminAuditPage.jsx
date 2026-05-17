export default function AdminAuditPage() {
  const logs = [
    { id: 1, action: 'Validation Tuteur', detail: 'Approbation de APP-01 (Jean Dupont)', admin: 'SuperAdmin', date: '16/05/2026 14:30' },
    { id: 2, action: 'Publication Ressource', detail: 'Publication de RES-01', admin: 'Modérateur1', date: '16/05/2026 10:15' },
    { id: 3, action: 'Suspension Compte', detail: 'Suspension de USR-03', admin: 'SuperAdmin', date: '15/05/2026 09:00' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Logs & Audit</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Traçabilité des actions critiques d'administration.</p>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Date et Heure</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Action</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Détail</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Auteur</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.5rem', color: '#94A3B8' }}>{log.date}</td>
                <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{log.action}</td>
                <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{log.detail}</td>
                <td style={{ padding: '1.5rem', color: '#3B82F6', fontWeight: 600 }}>{log.admin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

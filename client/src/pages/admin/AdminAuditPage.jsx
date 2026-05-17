import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, 'auditLogs'));
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
            {isLoading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucun log d'audit.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', color: '#94A3B8' }}>{log.date || 'N/A'}</td>
                  <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{log.action || 'Action inconnue'}</td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{log.detail || 'N/A'}</td>
                  <td style={{ padding: '1.5rem', color: '#3B82F6', fontWeight: 600 }}>{log.admin || 'Système'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

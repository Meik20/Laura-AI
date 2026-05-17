import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminAccessRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, 'accessRules'));
        setRules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Règles d'accès</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Configurez la logique d'accès aux ressources.</p>
        </div>
        <button style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
          + Nouvelle Règle
        </button>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Nom de la règle</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Critères Logiques</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des règles...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucune règle définie.</td></tr>
            ) : (
              rules.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{r.nom || 'Sans nom'}</td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1', fontFamily: 'monospace' }}>{r.critere || 'N/A'}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ background: '#10B98120', color: '#10B981', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {(r.statut || 'actif').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                    <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Éditer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

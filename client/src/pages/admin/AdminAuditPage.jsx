import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function AdminAuditPage() {
  const { t } = useTranslation();
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
    <div className="stack stack--lg animate-in">
      
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('admin.audit.title')}</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>{t('admin.audit.subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.audit.table.date')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.audit.table.action')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.audit.table.detail')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.audit.table.author')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.audit.loading')}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.audit.empty')}</td></tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{log.date || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>{log.action || 'Action inconnue'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{log.detail || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--clr-brand)', fontWeight: 'var(--fw-medium)' }}>{log.admin || 'Système'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

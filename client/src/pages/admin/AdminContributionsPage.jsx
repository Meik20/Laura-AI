import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  orderBy, query, serverTimestamp, addDoc
} from 'firebase/firestore';

const STATUS_MAP = {
  en_attente: { label: 'En attente',  cls: 'badge--pending' },
  valide:     { label: 'Validé',      cls: 'badge--green'   },
  rejete:     { label: 'Rejeté',      cls: 'badge--error'   },
};

const TYPE_ICONS = {
  Quiz: '🎲', Annale: '📝', Épreuve: '📜', Fiche: '📋', Livre: '📖'
};
const getIcon = (type) => TYPE_ICONS[type] || '📚';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} Ko`
    : `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

/* ─── Detail Drawer ─────────────────────────────────────────────────────── */
function ContribDrawer({ contrib, onClose, onValidate, onReject }) {
  if (!contrib) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        display: 'flex', alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn var(--dur-fast) var(--ease-std)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--srf-base)',
          borderRadius: 'var(--rd-2xl) var(--rd-2xl) 0 0',
          padding: 'var(--sp-8)',
          width: '100%',
          maxWidth: '640px',
          margin: '0 auto',
          maxHeight: '90dvh',
          overflowY: 'auto',
          animation: 'slideUp var(--dur-base) var(--ease-out)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="row row--between" style={{ marginBottom: 'var(--sp-6)' }}>
          <h2 style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', margin: 0 }}>
            {getIcon(contrib.type)} {contrib.titre || 'Sans titre'}
          </h2>
          <button onClick={onClose} className="modal-close" aria-label="Fermer">✕</button>
        </div>

        {/* Meta */}
        <div className="stack stack--sm" style={{ marginBottom: 'var(--sp-6)' }}>
          {[
            { label: 'Statut',       value: <span className={`badge ${STATUS_MAP[contrib.statut]?.cls || ''}`}>{STATUS_MAP[contrib.statut]?.label || contrib.statut}</span> },
            { label: 'Type',         value: contrib.type || '—' },
            { label: 'Matière',      value: contrib.matiere || '—' },
            { label: 'Examen',       value: contrib.examen || '—' },
            { label: 'Niveau',       value: contrib.niveau || '—' },
            { label: 'Contributeur', value: contrib.contributorName || contrib.contributorEmail || '—' },
            { label: 'Date',         value: formatDate(contrib.createdAt) },
            { label: 'Fichier',      value: contrib.fileName || '—' },
            { label: 'Taille',       value: formatBytes(contrib.fileSize) },
          ].map(({ label, value }) => (
            <div key={label} className="row row--between" style={{ padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--brd-subtle)', fontSize: 'var(--tx-sm)' }}>
              <span style={{ color: 'var(--txt-tertiary)', fontWeight: 'var(--fw-semibold)' }}>{label}</span>
              <span style={{ color: 'var(--txt-primary)', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {contrib.description && (
          <div className="card" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-6)', background: 'var(--srf-raised)' }}>
            <p style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)' }}>
              Description
            </p>
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0, lineHeight: 'var(--lh-relaxed)' }}>
              {contrib.description}
            </p>
          </div>
        )}

        {/* File preview link */}
        {contrib.url && (
          <a
            href={contrib.url}
            target="_blank"
            rel="noopener noreferrer"
            className="laura-btn laura-btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}
          >
            📎 Prévisualiser le fichier
          </a>
        )}

        {/* Actions */}
        {contrib.statut === 'en_attente' && (
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <button
              onClick={() => onReject(contrib.id)}
              className="laura-btn laura-btn-ghost"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--clr-error)', minHeight: '44px' }}
            >
              ✕ Rejeter
            </button>
            <button
              onClick={() => onValidate(contrib.id, contrib)}
              className="laura-btn laura-btn-primary"
              style={{ flex: 2, justifyContent: 'center', minHeight: '44px' }}
            >
              ✓ Valider et publier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [filter,        setFilter]        = useState('en_attente');
  const [feedback,      setFeedback]      = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setIsLoading(true);
    try {
      const q    = query(collection(db, 'contributions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setContributions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }

  const handleValidate = async (id, contrib) => {
    try {
      // 1. Move to public resources collection
      await addDoc(collection(db, 'resources'), {
        titre:     contrib.titre,
        type:      contrib.type,
        matiere:   contrib.matiere,
        cible:     `${contrib.examen} ${contrib.niveau}`.trim(),
        url:       contrib.url,
        statut:    'publie',
        source:    'contribution',
        contributorId: contrib.contributorId,
        createdAt: serverTimestamp(),
      });

      // 2. Update contribution status
      await updateDoc(doc(db, 'contributions', id), {
        statut:     'valide',
        validatedAt: serverTimestamp(),
      });

      setContributions(prev => prev.map(c => c.id === id ? { ...c, statut: 'valide' } : c));
      setSelected(null);
      setFeedback('✅ Document validé et publié dans le catalogue.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setFeedback('❌ Erreur lors de la validation.');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, 'contributions', id), {
        statut:     'rejete',
        rejectedAt: serverTimestamp(),
      });
      setContributions(prev => prev.map(c => c.id === id ? { ...c, statut: 'rejete' } : c));
      setSelected(null);
      setFeedback('🗑️ Document rejeté.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setFeedback('❌ Erreur lors du rejet.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cette contribution ?')) return;
    try {
      await deleteDoc(doc(db, 'contributions', id));
      setContributions(prev => prev.filter(c => c.id !== id));
      setSelected(null);
    } catch { /* silent */ }
  };

  const filtered = filter === 'all'
    ? contributions
    : contributions.filter(c => c.statut === filter);

  const counts = {
    en_attente: contributions.filter(c => c.statut === 'en_attente').length,
    valide:     contributions.filter(c => c.statut === 'valide').length,
    rejete:     contributions.filter(c => c.statut === 'rejete').length,
  };

  return (
    <div className="stack stack--lg animate-in">

      {/* Header */}
      <div className="row row--between">
        <div>
          <h1 className="laura-h1">Contributions</h1>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 'var(--sp-2) 0 0' }}>
            Validez ou rejetez les ressources soumises par les apprenants
          </p>
        </div>
        <button onClick={fetchAll} className="laura-btn laura-btn-ghost" style={{ minHeight: '38px' }}>
          ↺ Actualiser
        </button>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className="auth-info-alert">
          <span>ℹ️</span>
          <p style={{ margin: 0, fontSize: 'var(--tx-sm)' }}>{feedback}</p>
        </div>
      )}

      {/* Stats strip */}
      <div className="stats-grid">
        {[
          { label: 'En attente',  value: counts.en_attente, cls: 'badge--pending', icon: '⏳' },
          { label: 'Validés',     value: counts.valide,     cls: 'badge--green',   icon: '✅' },
          { label: 'Rejetés',     value: counts.rejete,     cls: 'badge--error',   icon: '✕'  },
          { label: 'Total',       value: contributions.length, cls: '',            icon: '📦' },
        ].map(({ label, value, cls, icon }) => (
          <div key={label} className="card" style={{ padding: 'var(--sp-5)', textAlign: 'center' }}>
            <p style={{ fontSize: '1.75rem', margin: '0 0 var(--sp-2)' }}>{icon}</p>
            <p style={{ fontSize: 'var(--tx-2xl)', fontWeight: 'var(--fw-bold)', margin: '0 0 var(--sp-1)' }}>{value}</p>
            <span className={`badge ${cls}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="chip-row">
        {[
          { key: 'en_attente', label: `En attente (${counts.en_attente})` },
          { key: 'valide',     label: `Validés (${counts.valide})`     },
          { key: 'rejete',     label: `Rejetés (${counts.rejete})`     },
          { key: 'all',        label: `Tout (${contributions.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="chip"
            style={{
              background: filter === key ? 'var(--clr-brand-lt)' : '',
              color:      filter === key ? 'var(--clr-brand)'    : '',
              borderColor:filter === key ? 'var(--clr-brand)'    : '',
              fontWeight: filter === key ? 'var(--fw-bold)'      : '',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="empty-state">
          <span className="empty-state__icon">⏳</span>
          <p className="empty-state__title">Chargement des contributions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📭</span>
          <p className="empty-state__title">Aucune contribution dans cette catégorie</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--tx-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                  {['Document', 'Type', 'Contributeur', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'left', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: i % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <div className="row" style={{ gap: 'var(--sp-3)' }}>
                        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{getIcon(c.type)}</span>
                        <div style={{ minWidth: 0 }}>
                          <p className="truncate" style={{ fontWeight: 'var(--fw-semibold)', margin: 0, maxWidth: '200px' }}>{c.titre || 'Sans titre'}</p>
                          {c.matiere && <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>{c.matiere}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', whiteSpace: 'nowrap' }}>
                      <span className="badge">{c.type || '—'}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', maxWidth: '160px' }}>
                      <p className="truncate" style={{ margin: 0 }}>{c.contributorName || c.contributorEmail || '—'}</p>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${STATUS_MAP[c.statut]?.cls || ''}`}>
                        {STATUS_MAP[c.statut]?.label || c.statut}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => setSelected(c)}
                          className="laura-btn laura-btn-secondary"
                          style={{ minHeight: '30px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)', whiteSpace: 'nowrap' }}
                        >
                          Examiner
                        </button>
                        {c.statut === 'en_attente' && (
                          <>
                            <button
                              onClick={() => handleValidate(c.id, c)}
                              className="laura-btn laura-btn-ghost"
                              style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--clr-green)' }}
                              title="Valider"
                            >✓</button>
                            <button
                              onClick={() => handleReject(c.id)}
                              className="laura-btn laura-btn-ghost"
                              style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }}
                              title="Rejeter"
                            >✕</button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="laura-btn laura-btn-ghost"
                          style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}
                          title="Supprimer"
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <ContribDrawer
        contrib={selected}
        onClose={() => setSelected(null)}
        onValidate={handleValidate}
        onReject={handleReject}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';

const STATUS_MAP = {
  soumis:     { label: 'Soumis',      cls: 'badge--pending' },
  en_attente: { label: 'En attente',  cls: 'badge--pending' },
  en_revue:   { label: 'En revue',    cls: 'badge--warning' },
  a_corriger: { label: 'À corriger',  cls: 'badge--error'   },
  brouillon:  { label: 'Brouillon',   cls: ''               },
  publie:     { label: 'Validé ✓',   cls: 'badge--green'   },
  valide:     { label: 'Validé ✓',   cls: 'badge--green'   },
  rejete:     { label: 'Rejeté',      cls: 'badge--error'   },
};

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Detail / Action Drawer ─────────────────────────────────────────────── */
function SubmissionDrawer({ sub, onClose, onAction }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!sub) return null;
  const st = STATUS_MAP[sub.statut] || { label: sub.statut, cls: '' };

  const act = async (newStatut) => {
    setBusy(true);
    await onAction(sub.id, newStatut, note);
    setBusy(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--srf-base)', borderRadius: 'var(--rd-2xl) var(--rd-2xl) 0 0', padding: 'var(--sp-8)', width: '100%', maxWidth: '640px', margin: '0 auto', maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="row row--between" style={{ marginBottom: 'var(--sp-5)', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 'var(--tx-xl)', fontWeight: 700 }}>{sub.titre || 'Sans titre'}</h2>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--txt-tertiary)' }}>✕</button>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)', fontSize: 'var(--tx-sm)' }}>
          {[
            ['Type', sub.type], ['Matière', sub.matiere],
            ['Niveau', sub.cible || sub.niveau], ['Auteur', sub.auteur],
            ['Soumis le', formatDate(sub.createdAt)], ['Fichier', sub.fileName || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--srf-raised)', borderRadius: 'var(--rd-md)', padding: 'var(--sp-3)' }}>
              <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', marginBottom: '2px' }}>{k}</div>
              <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{v || '—'}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {sub.description && (
          <div style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-4)', background: 'var(--srf-raised)', borderRadius: 'var(--rd-md)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 'var(--tx-xs)', fontWeight: 600, color: 'var(--txt-tertiary)', textTransform: 'uppercase' }}>Description</p>
            <p style={{ margin: 0, fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', lineHeight: 1.6 }}>{sub.description}</p>
          </div>
        )}

        {/* Content preview */}
        {sub.contenu && (
          <div style={{ marginBottom: 'var(--sp-5)', background: 'var(--srf-raised)', borderRadius: 'var(--rd-md)', padding: 'var(--sp-4)', maxHeight: '180px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--tx-xs)', fontWeight: 600, color: 'var(--txt-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contenu</p>
            <pre style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>
              {sub.contenu.slice(0, 1000)}{sub.contenu.length > 1000 ? '\n[...]' : ''}
            </pre>
          </div>
        )}

        {/* Admin note */}
        {(sub.statut === 'soumis' || sub.statut === 'en_attente' || sub.statut === 'en_revue') && (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--tx-xs)', fontWeight: 600, color: 'var(--txt-secondary)', marginBottom: 'var(--sp-1)' }}>
              Note pour le tuteur (optionnel)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Merci d'ajouter les corrigés, le barème est manquant..."
              style={{ width: '100%', minHeight: '70px', padding: 'var(--sp-3)', borderRadius: 'var(--rd-md)', border: '1px solid var(--brd-input)', background: 'var(--srf-base)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
        )}

        {/* Action buttons */}
        {['soumis', 'en_attente', 'en_revue'].includes(sub.statut) && (
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <button
              onClick={() => act('rejete')}
              disabled={busy}
              className="laura-btn laura-btn-ghost"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--clr-error)', minHeight: '42px', borderColor: 'var(--clr-error)' }}
            >
              ✕ Rejeter
            </button>
            <button
              onClick={() => act('a_corriger')}
              disabled={busy}
              className="laura-btn laura-btn-secondary"
              style={{ flex: 1, justifyContent: 'center', minHeight: '42px' }}
            >
              ✏️ À corriger
            </button>
            <button
              onClick={() => act('publie')}
              disabled={busy}
              className="laura-btn laura-btn-primary"
              style={{ flex: 2, justifyContent: 'center', minHeight: '42px' }}
            >
              {busy ? 'Traitement...' : '✅ Valider et publier'}
            </button>
          </div>
        )}

        {sub.statut === 'a_corriger' && sub.adminNote && (
          <div style={{ padding: 'var(--sp-4)', background: 'color-mix(in srgb, var(--clr-warning) 8%, var(--srf-base))', borderRadius: 'var(--rd-md)', border: '1px solid rgba(234,179,8,0.25)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
            <strong>Note admin :</strong> {sub.adminNote}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'resources'), orderBy('createdAt', 'desc')));
      // Only show tutor direct submissions (have auteurId + statut != brouillon for admin view)
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.auteurId && d.statut !== 'brouillon');
      setSubmissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleAction = async (id, newStatut, adminNote) => {
    try {
      const updates = {
        statut: newStatut,
        updatedAt: new Date().toISOString(),
        ...(adminNote ? { adminNote } : {}),
        ...(newStatut === 'publie' ? { publishedAt: new Date().toISOString() } : {}),
      };
      await updateDoc(doc(db, 'resources', id), updates);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      setSelected(null);
      const msgs = { publie: '✅ Soumission validée et publiée.', rejete: '🗑️ Soumission rejetée.', a_corriger: '✏️ Correction demandée au tuteur.' };
      showToast(msgs[newStatut] || 'Statut mis à jour.');
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur lors de la mise à jour.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement cette soumission ?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setSelected(null);
    } catch (err) { console.error(err); }
  };

  const pending = submissions.filter(s => ['soumis', 'en_attente', 'en_revue'].includes(s.statut));
  const counts = {
    pending: pending.length,
    publie: submissions.filter(s => ['publie', 'valide'].includes(s.statut)).length,
    a_corriger: submissions.filter(s => s.statut === 'a_corriger').length,
    rejete: submissions.filter(s => s.statut === 'rejete').length,
  };

  const filtered = {
    pending,
    publie: submissions.filter(s => ['publie', 'valide'].includes(s.statut)),
    a_corriger: submissions.filter(s => s.statut === 'a_corriger'),
    rejete: submissions.filter(s => s.statut === 'rejete'),
    all: submissions,
  }[filter] || [];

  const stats = [
    { label: 'En attente', val: counts.pending, color: '#f59e0b' },
    { label: 'Validées', val: counts.publie, color: 'var(--clr-green)' },
    { label: 'À corriger', val: counts.a_corriger, color: 'var(--clr-warning)' },
    { label: 'Rejetées', val: counts.rejete, color: 'var(--clr-error)' },
  ];

  return (
    <div className="stack stack--lg animate-in">

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--clr-green)', color: 'white', padding: '12px 28px', borderRadius: 'var(--rd-full)', fontWeight: 600, fontSize: 'var(--tx-sm)', zIndex: 2000, boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="row row--between" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="laura-h1">Soumissions Tuteurs</h1>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 'var(--sp-2) 0 0' }}>
            Validez, demandez des corrections ou rejetez les documents soumis par les tuteurs.
          </p>
        </div>
        <button onClick={fetchAll} className="laura-btn laura-btn-secondary" style={{ minHeight: '38px', gap: 'var(--sp-2)' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* STATS — same KPI card pattern as AdminDashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-5)' }}>
        {[
          { label: 'En attente',  val: counts.pending,     iconClass: 'hourglass-low', color: 'var(--clr-warning)', badgeClass: 'warning', badge: 'Urgents' },
          { label: 'Validées',    val: counts.publie,      iconClass: 'circle-check',  color: 'var(--clr-green)',   badgeClass: 'green',   badge: 'Publiés' },
          { label: 'À corriger',  val: counts.a_corriger,  iconClass: 'pencil',        color: 'var(--clr-brand)',   badgeClass: 'brand',   badge: 'Retour' },
          { label: 'Rejetées',   val: counts.rejete,      iconClass: 'circle-x',     color: 'var(--clr-error)',   badgeClass: 'error',   badge: 'Rejetés' },
        ].map(({ label, val, iconClass, color, badgeClass, badge }) => (
          <div key={label} className="card card--hoverable card__body"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', background: 'var(--srf-base)', boxShadow: 'var(--shd-sm)', position: 'relative', overflow: 'hidden' }}>
            <div className="row row--between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '12px', background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}>
                <i className={`ti ti-${iconClass}`} style={{ fontSize: '1.4rem' }} />
              </div>
              <span className={`badge badge--${badgeClass}`}>{badge}</span>
            </div>
            <div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 var(--sp-1) 0', color: 'var(--txt-primary)', letterSpacing: '-0.02em' }}>{val}</h3>
              <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: color, opacity: 0.8 }} />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="chip-row">
        {[
          { key: 'pending', label: `En attente (${counts.pending})` },
          { key: 'a_corriger', label: `À corriger (${counts.a_corriger})` },
          { key: 'publie', label: `Validées (${counts.publie})` },
          { key: 'rejete', label: `Rejetées (${counts.rejete})` },
          { key: 'all', label: `Toutes (${submissions.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className="chip"
            style={{ background: filter === key ? 'var(--clr-brand-lt)' : '', color: filter === key ? 'var(--clr-brand)' : '', borderColor: filter === key ? 'var(--clr-brand)' : '', fontWeight: filter === key ? 'var(--fw-bold)' : '' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="empty-state"><span className="empty-state__icon">⏳</span><p className="empty-state__title">Chargement...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📭</span>
          <p className="empty-state__title">Aucune soumission dans cette catégorie</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--tx-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                  {['Document', 'Type', 'Matière', 'Niveau', 'Tuteur', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: 'var(--sp-4) var(--sp-4)', textAlign: 'left', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => {
                  const st = STATUS_MAP[sub.statut] || { label: sub.statut, cls: '' };
                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: i % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                      <td style={{ padding: 'var(--sp-4)', maxWidth: '200px' }}>
                        <p className="truncate" style={{ margin: 0, fontWeight: 600, color: 'var(--txt-primary)' }}>{sub.titre || 'Sans titre'}</p>
                      </td>
                      <td style={{ padding: 'var(--sp-4)', whiteSpace: 'nowrap' }}><span className="badge badge--brand">{sub.type || '—'}</span></td>
                      <td style={{ padding: 'var(--sp-4)', color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>{sub.matiere || '—'}</td>
                      <td style={{ padding: 'var(--sp-4)', color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>{sub.cible || sub.niveau || '—'}</td>
                      <td style={{ padding: 'var(--sp-4)', color: 'var(--txt-secondary)', maxWidth: '130px' }}>
                        <p className="truncate" style={{ margin: 0 }}>{sub.auteur || '—'}</p>
                      </td>
                      <td style={{ padding: 'var(--sp-4)', color: 'var(--txt-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(sub.createdAt)}</td>
                      <td style={{ padding: 'var(--sp-4)', whiteSpace: 'nowrap' }}><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ padding: 'var(--sp-4)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                          <button onClick={() => setSelected(sub)} className="laura-btn laura-btn-secondary" style={{ minHeight: '30px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                            Examiner
                          </button>
                          {['soumis', 'en_attente', 'en_revue'].includes(sub.statut) && (
                            <>
                              <button onClick={() => handleAction(sub.id, 'publie', '')} className="laura-btn laura-btn-ghost" style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--clr-green)' }} title="Valider">✓</button>
                              <button onClick={() => handleAction(sub.id, 'rejete', '')} className="laura-btn laura-btn-ghost" style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--clr-error)' }} title="Rejeter">✕</button>
                            </>
                          )}
                          <button onClick={() => handleDelete(sub.id)} className="laura-btn laura-btn-ghost" style={{ minHeight: '30px', padding: '0 var(--sp-2)', fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }} title="Supprimer">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SubmissionDrawer sub={selected} onClose={() => setSelected(null)} onAction={handleAction} />
    </div>
  );
}

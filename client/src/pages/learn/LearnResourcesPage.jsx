import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import {
  collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove,
  getDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { uploadContribution } from '../../utils/storage';
import { useTranslation } from 'react-i18next';

/* ─── Matières filter logic (preserved) ─────────────────────────────────── */
const filterMatieres = (allMatieres, userProfile) => {
  const examen  = (userProfile?.examen  || userProfile?.examenEleve  || userProfile?.examenEtudiant  || '').toLowerCase();
  const niveau  = (userProfile?.niveau  || userProfile?.classe       || userProfile?.niveauEtude     || '').toLowerCase();
  const serie   = (userProfile?.serie   || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline   || '').toLowerCase();

  const isBtsOrSup = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur') ||
    niveau.includes('étudiant') || niveau.includes('licence') || niveau.includes('université');

  let filtered = [];
  if (allMatieres?.length > 0) {
    filtered = allMatieres.filter(m => {
      const mNiveau  = (m.niveau  || '').toLowerCase();
      const mSerie   = (m.serie   || '').toLowerCase();
      const mFiliere = (m.filiere || '').toLowerCase();
      if (isBtsOrSup) {
        return mNiveau.includes('bts') || mNiveau.includes('supérieur') || mNiveau.includes('étudiant') ||
          (filiere && mFiliere.includes(filiere)) || (serie && mSerie.includes(serie));
      } else if (examen.includes('bepc') || niveau.includes('collège')) {
        return mNiveau.includes('collège') || mNiveau.includes('bepc');
      } else {
        return mNiveau.includes('lycée') || mNiveau.includes('bac') || mSerie.includes('toutes') ||
          (serie && mSerie.includes(serie));
      }
    });
  }
  if (filtered.length > 0) return filtered;

  if (isBtsOrSup) {
    return [
      { id: 'bts_1', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_2', nom: 'Économie - Droit',               niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
    ];
  } else if (examen.includes('bepc') || niveau.includes('collège')) {
    return [
      { id: 'col_1', nom: 'Mathématiques', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_2', nom: 'Français',      niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
    ];
  } else {
    return [
      { id: 'lyc_1', nom: 'Mathématiques',   niveau: 'Lycée', serie: 'Toutes',   filiere: 'Général' },
      { id: 'lyc_2', nom: 'Français',        niveau: 'Lycée', serie: 'Toutes',   filiere: 'Général' },
      { id: 'lyc_3', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' },
    ];
  }
};

const TYPE_ICONS = { Quiz: '🎲', Annale: '📝', Épreuve: '📜', Fiche: '📋', Livre: '📖' };
const getIcon = (type) => TYPE_ICONS[type] || '📚';

/* ─── Contribution Modal ─────────────────────────────────────────────────── */
function ContributionModal({ isOpen, onClose, userProfile, matieresList }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const EMPTY_FORM = { titre: '', type: 'Fiche', matiere: '', examen: '', niveau: '', description: '' };

  const [form, setForm]           = useState(EMPTY_FORM);
  const [file, setFile]           = useState(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.size > 30 * 1024 * 1024) {
      setError(t('contribution_modal.errors.file_size'));
      return;
    }
    setFile(f);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.titre.trim()) { setError(t('contribution_modal.errors.title_required')); return; }
    if (!file) { setError(t('contribution_modal.errors.file_required')); return; }
    if (!userProfile?.uid) { setError(t('contribution_modal.errors.login_required')); return; }

    setUploading(true);
    setProgress(10); // start indicator
    try {
      // 1. Upload file to Supabase Storage
      const { url } = await uploadContribution(file, userProfile.uid);
      setProgress(80);

      // 2. Save submission to Firestore (statut = 'en_attente')
      await addDoc(collection(db, 'contributions'), {
        ...form,
        url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        statut: 'en_attente',
        contributorId:   userProfile.uid,
        contributorName: `${userProfile.prenom || ''} ${userProfile.nom || ''}`.trim(),
        contributorEmail: userProfile.email || '',
        createdAt: serverTimestamp(),
      });

      setProgress(100);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(t('contribution_modal.errors.general'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setProgress(0);
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Contribution d'une ressource">
      <div className="modal-panel" style={{ maxWidth: '560px', width: '100%' }}>

        {submitted ? (
          // ── Success state ──
          <div style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>✅</div>
            <h2 style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
              {t('contribution_modal.success_title')}
            </h2>
            <p style={{ color: 'var(--txt-secondary)', lineHeight: 'var(--lh-relaxed)', marginBottom: 'var(--sp-6)' }}>
              {t('contribution_modal.success_desc')}
            </p>
            <button onClick={handleClose} className="laura-btn laura-btn-primary" style={{ minHeight: '44px', padding: '0 var(--sp-8)' }}>
              {t('contribution_modal.success_btn')}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('contribution_modal.title')}</h2>
                <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', margin: 0 }}>
                  {t('contribution_modal.subtitle')}
                </p>
              </div>
              <button onClick={handleClose} className="modal-close" aria-label={t('common.actions.close')}>✕</button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', padding: 'var(--sp-6)' }}>

              {error && <div className="auth-error-alert">{error}</div>}

              {/* Title */}
              <div className="form-group">
                <label>{t('contribution_modal.form.title_label')} <span style={{ color: 'var(--clr-error)' }}>*</span></label>
                <input type="text" name="titre" placeholder={t('contribution_modal.form.title_placeholder')}
                  value={form.titre} onChange={handleChange} required />
              </div>

              {/* Type + Matière */}
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('contribution_modal.form.type_label')}</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Fiche">{t('contribution_modal.form.type_options.fiche')}</option>
                    <option value="Annale">{t('contribution_modal.form.type_options.annale')}</option>
                    <option value="Épreuve">{t('contribution_modal.form.type_options.epreuve')}</option>
                    <option value="Quiz">{t('contribution_modal.form.type_options.quiz')}</option>
                    <option value="Livre">{t('contribution_modal.form.type_options.livre')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('contribution_modal.form.subject_label')}</label>
                  <select name="matiere" value={form.matiere} onChange={handleChange}>
                    <option value="">{t('contribution_modal.form.subject_placeholder')}</option>
                    {matieresList.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
                    <option value="Autre">{t('contribution_modal.form.subject_other')}</option>
                  </select>
                </div>
              </div>

              {/* Examen + Niveau */}
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('contribution_modal.form.exam_label')}</label>
                  <select name="examen" value={form.examen} onChange={handleChange}>
                    <option value="">{t('contribution_modal.form.subject_placeholder')}</option>
                    <option value="BEPC">BEPC</option>
                    <option value="Probatoire">Probatoire</option>
                    <option value="BAC">BAC</option>
                    <option value="BTS">BTS</option>
                    <option value="Licence">Licence</option>
                    <option value="Tous">{t('contribution_modal.form.exam_options.all')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('contribution_modal.form.level_label')}</label>
                  <input type="text" name="niveau" placeholder={t('contribution_modal.form.level_placeholder')}
                    value={form.niveau} onChange={handleChange} />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>{t('contribution_modal.form.desc_label')}</label>
                <textarea name="description" rows="2" placeholder={t('contribution_modal.form.desc_placeholder')}
                  value={form.description} onChange={handleChange}
                  style={{ minHeight: '72px', height: '72px', resize: 'vertical' }} />
              </div>

              {/* File upload zone */}
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Zone de téléversement du fichier"
              >
                <input ref={fileInputRef} type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }} />

                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: '2rem' }}>📎</span>
                    <p style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-brand)', margin: 0 }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {t('contribution_modal.upload.click_to_change')}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: '2rem' }}>⬆️</span>
                    <p style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', margin: 0 }}>
                      {t('contribution_modal.upload.click_to_select')}
                    </p>
                    <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', margin: 0 }}>
                      {t('contribution_modal.upload.limits')}
                    </p>
                  </div>
                )}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div className="row row--between" style={{ fontSize: 'var(--tx-xs)', marginBottom: 'var(--sp-2)' }}>
                    <span style={{ color: 'var(--txt-secondary)' }}>Envoi en cours...</span>
                    <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--clr-brand)' }}>{progress}%</span>
                  </div>
                  <div className="progress">
                    <div className="progress__fill" style={{ width: `${progress}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="apply-actions" style={{ marginTop: 'var(--sp-2)' }}>
                <button type="button" onClick={handleClose}
                  className="laura-btn laura-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Annuler
                </button>
                <button type="submit" disabled={uploading}
                  className="laura-btn laura-btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {uploading ? `Envoi ${progress}%...` : '✓ Soumettre la ressource'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function LearnResourcesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [resources,    setResources]    = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [bookmarks,    setBookmarks]    = useState([]);
  const [matieresList, setMatieresList] = useState([]);
  const [showContrib,  setShowContrib]  = useState(false);

  const profileContext = {
    niveau:  userProfile?.niveau  || userProfile?.classe       || userProfile?.niveauEtude     || 'Terminale',
    serie:   userProfile?.serie   || '',
    examen:  userProfile?.examen  || userProfile?.examenEleve  || userProfile?.examenEtudiant  || 'BAC',
    filiere: userProfile?.filiere || userProfile?.discipline   || ''
  };

  const [filters, setFilters] = useState({ matiere: '', type: '', examen: '', search: '' });

  useEffect(() => {
    if (userProfile?.bookmarks) setBookmarks(userProfile.bookmarks);
    if (userProfile) setFilters(p => ({ ...p, examen: userProfile.examen || '' }));
  }, [userProfile]);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, 'adminSettings', 'global'));
        const fetched = snap.exists() && snap.data().matieres ? snap.data().matieres : [];
        setMatieresList(filterMatieres(fetched, userProfile));
      } catch { /* silent */ }

      try {
        const snap = await getDocs(collection(db, 'resources'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setResources(docs.filter(r => r.statut === 'publie'));
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    }
    fetchData();
  }, []);

  const handleFilterChange = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

  const toggleBookmark = async (resId) => {
    if (!userProfile?.uid) return;
    const was = bookmarks.includes(resId);
    setBookmarks(was ? bookmarks.filter(id => id !== resId) : [...bookmarks, resId]);
    try {
      const ref = doc(db, 'users', userProfile.uid);
      await updateDoc(ref, { bookmarks: was ? arrayRemove(resId) : arrayUnion(resId) });
    } catch { /* silent */ }
  };

  const filteredResources = resources.filter(r => {
    const m = !filters.matiere || r.cible?.toLowerCase().includes(filters.matiere.toLowerCase()) || r.matiere?.toLowerCase().includes(filters.matiere.toLowerCase());
    const t = !filters.type   || r.type === filters.type;
    const x = !filters.examen || r.cible?.toLowerCase().includes(filters.examen.toLowerCase()) || r.titre?.toLowerCase().includes(filters.examen.toLowerCase());
    const s = !filters.search || r.titre?.toLowerCase().includes(filters.search.toLowerCase()) || r.cible?.toLowerCase().includes(filters.search.toLowerCase());
    return m && t && x && s;
  });

  return (
    <div className="stack stack--lg">

      {/* ── Page Header ── */}
      <div className="page-header row row--between">
        <div>
          <h1 className="laura-h1">{t('learn.resources.title')}</h1>
          <p style={{ marginTop: 'var(--sp-1)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', margin: 'var(--sp-2) 0 0' }}>
            {t('learn.resources.subtitle')} ·{' '}
            <strong style={{ color: 'var(--txt-primary)' }}>
              {profileContext.niveau} {profileContext.serie} · {profileContext.examen}
            </strong>
          </p>
        </div>
        <button
          onClick={() => setShowContrib(true)}
          className="laura-btn laura-btn-primary"
          style={{ minHeight: '42px', padding: '0 var(--sp-6)', flexShrink: 0 }}
        >
          {t('learn.resources.add_btn')}
        </button>
      </div>

      {/* ── Contribution Info Banner ── */}
      <div className="auth-info-alert">
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
        <p style={{ margin: 0, fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
          <strong>{t('learn.resources.banner.strong')}</strong> {t('learn.resources.banner.text')}
        </p>
      </div>
 
      {/* ── Filters ── */}
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" name="search"
            placeholder={t('learn.resources.filters.search')}
            value={filters.search} onChange={handleFilterChange}
            style={{ flex: '2 1 220px' }}
          />
          <select name="matiere" value={filters.matiere} onChange={handleFilterChange} style={{ flex: '1 1 160px' }}>
            <option value="">{t('learn.resources.filters.all_subjects')}</option>
            {matieresList.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} style={{ flex: '1 1 140px' }}>
            <option value="">{t('learn.resources.filters.all_types')}</option>
            <option value="Épreuve">{t('contribution_modal.form.type_options.epreuve')}</option>
            <option value="Annale">{t('contribution_modal.form.type_options.annale')}</option>
            <option value="Fiche">{t('contribution_modal.form.type_options.fiche')}</option>
            <option value="Quiz">{t('contribution_modal.form.type_options.quiz')}</option>
            <option value="Livre">{t('contribution_modal.form.type_options.livre')}</option>
          </select>
          <select name="examen" value={filters.examen} onChange={handleFilterChange} style={{ flex: '1 1 140px' }}>
            <option value="">{t('learn.resources.filters.all_exams')}</option>
            <option value="BAC">BAC</option>
            <option value="Probatoire">Probatoire</option>
            <option value="BEPC">BEPC</option>
            <option value="BTS">BTS</option>
            <option value="Licence">Licence</option>
          </select>
        </div>
      </div>
 
      {/* ── Results count ── */}
      {!isLoading && (
        <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)', margin: 0 }}>
          {t('learn.resources.results.count', { count: filteredResources.length })}
        </p>
      )}
 
      {/* ── Resource Grid ── */}
      {isLoading ? (
        <div className="empty-state">
          <span className="empty-state__icon">⏳</span>
          <p className="empty-state__title">{t('learn.resources.results.loading')}</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <p className="empty-state__title">{t('learn.resources.results.empty_title')}</p>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>{t('learn.resources.results.empty_desc')}</p>
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filteredResources.map(res => {
            const isBookmarked = bookmarks.includes(res.id);
            const icon = getIcon(res.type);
            return (
              <div key={res.id} className="card card--hoverable" style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
 
                <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="truncate" style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-bold)', margin: '0 0 var(--sp-2)', lineHeight: 'var(--lh-snug)' }}>
                      {res.titre || t('learn.resources.card.untitled')}
                    </h3>
                    <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                      <span className="badge">{t('contribution_modal.form.type_options.' + (res.type?.toLowerCase() || 'fiche'), { defaultValue: res.type || t('learn.resources.card.general') })}</span>
                      {res.cible && <span className="badge badge--brand">{res.cible}</span>}
                    </div>
                  </div>
                </div>
 
                <div style={{ flex: 1 }} />
 
                <div className="row" style={{ borderTop: '1px solid var(--brd-subtle)', paddingTop: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
                  <button
                    onClick={() => res.url ? window.open(res.url, '_blank') : navigate('/learn/chat')}
                    className="laura-btn laura-btn-primary"
                    style={{ flex: 1, justifyContent: 'center', minHeight: '34px', fontSize: 'var(--tx-xs)' }}
                  >
                    {t('learn.resources.card.open')}
                  </button>
                  <button
                    onClick={() => navigate(`/learn/chat?resourceTitle=${encodeURIComponent(res.titre)}`)}
                    className="laura-btn laura-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', minHeight: '34px', fontSize: 'var(--tx-xs)' }}
                  >
                    {t('learn.resources.card.laura')}
                  </button>
                  <button
                    onClick={() => toggleBookmark(res.id)}
                    className="laura-btn laura-btn-ghost"
                    style={{ minHeight: '34px', width: '34px', padding: 0, color: isBookmarked ? 'var(--clr-warning)' : 'var(--txt-tertiary)', background: isBookmarked ? 'var(--clr-warning-lt)' : '' }}
                    aria-label={isBookmarked ? t('learn.resources.card.remove_bookmark') : t('learn.resources.card.add_bookmark')}
                  >
                    {isBookmarked ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Contribution Modal ── */}
      <ContributionModal
        isOpen={showContrib}
        onClose={() => setShowContrib(false)}
        userProfile={userProfile}
        matieresList={matieresList}
      />
    </div>
  );
}

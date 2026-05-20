import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { uploadContribution } from '../../utils/storage';

const TYPES = ['Épreuve', 'Annale', 'Fiche', 'Quiz', 'Livre', 'Correction'];

function SubmitModal({ onClose, onSuccess, uid, userProfile }) {
  const [form, setForm] = useState({
    titre: '', type: 'Épreuve', matiere: '',
    niveau: '', description: '', contenu: ''
  });
  const [file, setFile] = useState(null);
  const [fileStatus, setFileStatus] = useState(null); // null | 'ready' | 'error'
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState({ niveaux: [], matieres: [] });

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const docSnap = await getDoc(doc(db, 'adminSettings', 'global'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const uniqueMatNames = Array.from(new Set((data.matieres || []).map(m => m.nom))).filter(Boolean);
          setSuggestions({
            niveaux: data.niveaux || [],
            matieres: uniqueMatNames
          });
        }
      } catch (err) {
        console.error("Erreur de chargement des suggestions :", err);
      }
    }
    fetchSuggestions();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFileStatus('ready');
    setForm(prev => ({
      ...prev,
      titre: prev.titre || f.name.replace(/\.[^.]+$/, '')
    }));
  };

  const handleSubmit = async (statut) => {
    if (!form.titre.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.matiere.trim()) { setError('La matière est obligatoire.'); return; }
    if (!form.niveau.trim()) { setError('Le niveau cible est obligatoire.'); return; }
    setIsSaving(true);
    setError('');
    try {
      let fileUrl = '';
      if (file) {
        const uploadRes = await uploadContribution(file, uid);
        fileUrl = uploadRes.url;
      }

      const newRes = {
        titre: form.titre.trim(),
        type: form.type,
        matiere: form.matiere.trim(),
        niveau: form.niveau.trim(),
        cible: form.niveau.trim(),
        description: form.description.trim(),
        contenu: form.contenu.trim(),
        url: fileUrl,
        statut,
        auteurId: uid,
        auteur: userProfile?.prenom || userProfile?.nom || 'Tuteur',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(file ? {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        } : {})
      };
      await addDoc(collection(db, 'resources'), newRes);

      // Enregistrer automatiquement le niveau et la matière s'ils sont nouveaux
      const globalRef = doc(db, 'adminSettings', 'global');
      const updates = {};
      const cleanNiveau = form.niveau.trim();
      const cleanMatiere = form.matiere.trim();

      if (cleanNiveau && !suggestions.niveaux.includes(cleanNiveau)) {
        updates.niveaux = arrayUnion(cleanNiveau);
      }
      if (cleanMatiere && !suggestions.matieres.includes(cleanMatiere)) {
        updates.matieres = arrayUnion({
          id: 'mat_' + Date.now(),
          nom: cleanMatiere,
          niveau: cleanNiveau || 'Général',
          serie: 'Toutes',
          filiere: 'Général'
        });
      }
      if (Object.keys(updates).length > 0) {
        await setDoc(globalRef, updates, { merge: true });
      }

      onSuccess(statut === 'soumis' ? 'Soumission envoyée pour validation !' : 'Brouillon sauvegardé.');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--rd-md)', border: '1px solid var(--brd-input)', background: 'var(--srf-base)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: 'var(--tx-xs)', fontWeight: 600, color: 'var(--txt-secondary)', marginBottom: 'var(--sp-1)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--tx-lg)', fontWeight: 700 }}>📤 Nouvelle Soumission</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--txt-tertiary)', lineHeight: 1 }}>✕</button>
        </div>

        {/* File upload zone */}
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-5)', border: `2px dashed ${fileStatus === 'ready' ? 'var(--clr-green)' : fileStatus === 'error' ? 'var(--clr-error)' : 'var(--brd-input)'}`, borderRadius: 'var(--rd-lg)', background: fileStatus === 'ready' ? 'color-mix(in srgb, var(--clr-green) 6%, var(--srf-base))' : 'var(--srf-raised)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <span style={{ fontSize: '2rem' }}>{fileStatus === 'ready' ? '✅' : '📎'}</span>
          <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 600, color: 'var(--txt-primary)' }}>
            {fileStatus === 'ready' ? `Fichier joint : ${file?.name}` : 'Joindre un document (PDF, image, texte)'}
          </span>
          <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>
            Le document sera téléchargeable par les élèves après validation
          </span>
          <input type="file" onChange={handleFile} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.txt" />
        </label>

        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Titre de la ressource *</label>
            <input style={inputStyle} value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex: Épreuve de Mathématiques BAC A 2024" />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Matière *</label>
            <input 
              style={inputStyle} 
              value={form.matiere} 
              list="submissions-matiere-suggestions"
              onChange={e => set('matiere', e.target.value)} 
              placeholder="Ex: Mathématiques, Physique-Chimie..." 
            />
            <datalist id="submissions-matiere-suggestions">
              {suggestions.matieres.map((m, i) => (
                <option key={i} value={m} />
              ))}
            </datalist>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Niveau cible *</label>
            <input 
              style={inputStyle} 
              value={form.niveau} 
              list="submissions-niveau-suggestions"
              onChange={e => set('niveau', e.target.value)} 
              placeholder="Ex: Terminale C, 3ème, BTS..." 
            />
            <datalist id="submissions-niveau-suggestions">
              {suggestions.niveaux.map((n, i) => (
                <option key={i} value={n} />
              ))}
            </datalist>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description courte</label>
            <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Contexte, objectifs pédagogiques..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description ou contenu textuel (optionnel)</label>
            <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={form.contenu} onChange={e => set('contenu', e.target.value)} placeholder="Vous pouvez ajouter des notes pédagogiques, consignes ou texte additionnel ici..." />
          </div>
        </div>

        {error && <p style={{ color: 'var(--clr-error)', fontSize: 'var(--tx-xs)', margin: 0 }}>⚠️ {error}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', borderTop: '1px solid var(--brd-subtle)', paddingTop: 'var(--sp-4)' }}>
          <button onClick={onClose} className="laura-btn laura-btn-ghost" style={{ minHeight: '40px', padding: '0 var(--sp-5)' }}>Annuler</button>
          <button onClick={() => handleSubmit('brouillon')} disabled={isSaving} className="laura-btn laura-btn-secondary" style={{ minHeight: '40px', padding: '0 var(--sp-5)' }}>
            💾 Sauvegarder brouillon
          </button>
          <button onClick={() => handleSubmit('soumis')} disabled={isSaving || fileStatus === 'analyzing'} className="laura-btn laura-btn-primary" style={{ minHeight: '40px', padding: '0 var(--sp-5)' }}>
            {isSaving ? 'Envoi...' : '📤 Soumettre pour validation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ sub, onClose }) {
  const statusMap = { brouillon: { label: 'Brouillon', color: 'var(--txt-tertiary)' }, soumis: { label: 'Soumis', color: 'var(--clr-brand)' }, en_revue: { label: 'En revue', color: '#f59e0b' }, a_corriger: { label: 'À corriger', color: 'var(--clr-error)' }, publie: { label: 'Validé ✓', color: 'var(--clr-green)' }, valide: { label: 'Validé ✓', color: 'var(--clr-green)' }, rejete: { label: 'Rejeté', color: 'var(--clr-error)' } };
  const st = statusMap[sub.statut] || { label: sub.statut, color: 'var(--txt-secondary)' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto', padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 'var(--tx-lg)', fontWeight: 700 }}>{sub.titre || 'Sans titre'}</h2>
            <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 700, color: st.color }}>● {st.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--txt-tertiary)' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', fontSize: 'var(--tx-sm)' }}>
          {[['Type', sub.type], ['Matière', sub.matiere], ['Niveau', sub.cible || sub.niveau], ['Soumis le', sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : 'N/A']].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--srf-raised)', borderRadius: 'var(--rd-md)', padding: 'var(--sp-3)' }}>
              <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', marginBottom: '2px' }}>{k}</div>
              <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
        {sub.description && <p style={{ margin: 0, fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', fontStyle: 'italic' }}>{sub.description}</p>}
        {sub.contenu && (
          <div style={{ background: 'var(--srf-raised)', borderRadius: 'var(--rd-md)', padding: 'var(--sp-4)', maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--tx-xs)', fontWeight: 600, color: 'var(--txt-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contenu</p>
            <pre style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{sub.contenu.slice(0, 800)}{sub.contenu.length > 800 ? '...' : ''}</pre>
          </div>
        )}
        {sub.statut === 'a_corriger' && (
          <div style={{ padding: 'var(--sp-4)', background: 'color-mix(in srgb, var(--clr-error) 8%, var(--srf-base))', borderRadius: 'var(--rd-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ margin: 0, fontSize: 'var(--tx-sm)', color: 'var(--clr-error)', fontWeight: 600 }}>✏️ Des corrections sont demandées. Modifiez et resoumettez.</p>
          </div>
        )}
        <button onClick={onClose} className="laura-btn laura-btn-secondary" style={{ minHeight: '40px', alignSelf: 'flex-end', padding: '0 var(--sp-5)' }}>Fermer</button>
      </div>
    </div>
  );
}

export default function TutorSubmissionsPage() {
  const { currentUser, userProfile } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Toutes');
  const [showModal, setShowModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [toast, setToast] = useState('');

  const uid = currentUser?.uid || userProfile?.uid;
  const isContributor = userProfile?.statut === 'Contributeur' || userProfile?.roleLabel === 'Tuteur' || userProfile?.isTutor;

  const fetchSubmissions = async () => {
    if (!uid) { setIsLoading(false); return; }
    try {
      const snap = await getDocs(collection(db, 'resources'));
      const list = [];
      snap.forEach(d => { const data = d.data(); if (data.auteurId === uid) list.push({ id: d.id, ...data }); });
      setSubmissions(list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, [uid]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'brouillon': return { label: 'Brouillon', cls: '' };
      case 'soumis': case 'en_attente': return { label: 'Soumis', cls: 'badge--pending' };
      case 'en_revue': return { label: 'En revue', cls: 'badge--warning' };
      case 'a_corriger': return { label: 'À corriger', cls: 'badge--error' };
      case 'publie': case 'valide': return { label: 'Validé ✓', cls: 'badge--green' };
      case 'rejete': return { label: 'Rejeté', cls: 'badge--error' };
      default: return { label: statut || 'Brouillon', cls: '' };
    }
  };

  if (!isContributor) return (
    <div className="empty-state animate-in" style={{ maxWidth: '600px', margin: '4rem auto' }}>
      <span className="empty-state__icon">🔒</span>
      <h2 className="empty-state__title">Espace Soumission Restreint</h2>
      <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>
        Vous devez avoir le statut <strong>Tuteur Contributeur</strong> pour proposer du contenu sur la plateforme.
      </p>
      <button onClick={() => alert("Demande transmise à l'administration.")} className="laura-btn laura-btn-primary" style={{ minHeight: '44px', padding: '0 var(--sp-6)' }}>Faire la demande d'accès</button>
    </div>
  );

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'Toutes') return true;
    if (filter === 'Brouillons') return sub.statut === 'brouillon';
    if (filter === 'En attente') return ['en_attente', 'soumis', 'en_revue'].includes(sub.statut);
    if (filter === 'À corriger') return sub.statut === 'a_corriger';
    if (filter === 'Validées') return ['publie', 'valide'].includes(sub.statut);
    return true;
  });

  const stats = [
    { label: 'Total', val: submissions.length, color: 'var(--clr-brand)' },
    { label: 'En attente', val: submissions.filter(s => ['soumis', 'en_attente', 'en_revue'].includes(s.statut)).length, color: '#f59e0b' },
    { label: 'Validés', val: submissions.filter(s => ['publie', 'valide'].includes(s.statut)).length, color: 'var(--clr-green)' },
    { label: 'Brouillons', val: submissions.filter(s => s.statut === 'brouillon').length, color: 'var(--txt-tertiary)' },
  ];

  return (
    <div className="stack stack--lg animate-in">

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--clr-green)', color: 'white', padding: '12px 24px', borderRadius: 'var(--rd-full)', fontWeight: 600, fontSize: 'var(--tx-sm)', zIndex: 2000, boxShadow: 'var(--shadow-lg)' }}>
          ✅ {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="laura-h1">Vos Soumissions</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Soumettez et gérez vos contenus pédagogiques.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="laura-btn laura-btn-primary" style={{ minHeight: '42px', padding: '0 var(--sp-6)' }}>
          + Nouvelle soumission
        </button>
      </div>

      {/* STATS — same KPI card style as AdminDashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-5)' }}>
        {[
          { label: 'Total',      val: submissions.length,                                                                     iconClass: 'files',         color: 'var(--clr-brand)',   badgeClass: 'brand',   badge: 'Soumissions' },
          { label: 'En attente', val: submissions.filter(s => ['soumis','en_attente','en_revue'].includes(s.statut)).length,  iconClass: 'hourglass-low', color: 'var(--clr-warning)', badgeClass: 'warning', badge: 'En cours' },
          { label: 'Validés',    val: submissions.filter(s => ['publie','valide'].includes(s.statut)).length,                iconClass: 'circle-check',  color: 'var(--clr-green)',   badgeClass: 'green',   badge: 'Publiés' },
          { label: 'Brouillons', val: submissions.filter(s => s.statut === 'brouillon').length,                               iconClass: 'file-pencil',   color: 'var(--txt-tertiary)',badgeClass: '',        badge: 'Draft' },
        ].map(({ label, val, iconClass, color, badgeClass, badge }) => (
          <div key={label} className="card card--hoverable card__body"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', background: 'var(--srf-base)', boxShadow: 'var(--shd-sm)', position: 'relative', overflow: 'hidden' }}>
            <div className="row row--between" style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '12px', background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}>
                <i className={`ti ti-${iconClass}`} style={{ fontSize: '1.4rem' }} />
              </div>
              {badgeClass ? <span className={`badge badge--${badgeClass}`}>{badge}</span> : <span className="badge">{badge}</span>}
            </div>
            <div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 var(--sp-1) 0', color: 'var(--txt-primary)', letterSpacing: '-0.02em' }}>{val}</h3>
              <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: color, opacity: 0.8 }} />
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="chip-row">
        {['Toutes', 'Brouillons', 'En attente', 'À corriger', 'Validées'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="chip" style={{ background: filter === f ? 'var(--clr-brand-lt)' : '', color: filter === f ? 'var(--clr-brand)' : '', borderColor: filter === f ? 'var(--clr-brand)' : '', fontWeight: filter === f ? 'var(--fw-bold)' : '' }}>
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                {['Titre', 'Type', 'Matière', 'Niveau', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement...</td></tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-sm)' }}>
                      Aucune soumission.{' '}
                      <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--clr-brand)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}>
                        Créer votre première soumission →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.map((sub, idx) => {
                const { label, cls } = getStatusStyle(sub.statut);
                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', maxWidth: '220px' }}>
                      <span className="truncate" style={{ display: 'block' }}>{sub.titre || 'Sans titre'}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>{sub.type || '—'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>{sub.matiere || '—'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', whiteSpace: 'nowrap' }}>{sub.cible || sub.niveau || '—'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-tertiary)', whiteSpace: 'nowrap' }}>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${cls}`}>{label}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setSelectedSub(sub)} className="laura-btn laura-btn-secondary" style={{ minHeight: '30px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <SubmitModal
          uid={uid}
          userProfile={userProfile}
          onClose={() => setShowModal(false)}
          onSuccess={(msg) => { setShowModal(false); fetchSubmissions(); showToast(msg); }}
        />
      )}
      {selectedSub && <DetailModal sub={selectedSub} onClose={() => setSelectedSub(null)} />}
    </div>
  );
}

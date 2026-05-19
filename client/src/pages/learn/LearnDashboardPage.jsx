import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';

/* ─── Subject filter logic (preserved exactly) ─────────────────────────── */
const filterMatieres = (allMatieres, userProfile) => {
  const examen  = (userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || '').toLowerCase();
  const niveau  = (userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || '').toLowerCase();
  const serie   = (userProfile?.serie || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline || '').toLowerCase();

  const isBtsOrSup = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur')
    || niveau.includes('étudiant') || niveau.includes('licence') || niveau.includes('université');

  let filtered = [];
  if (allMatieres?.length > 0) {
    filtered = allMatieres.filter(m => {
      const mNiveau  = (m.niveau  || '').toLowerCase();
      const mSerie   = (m.serie   || '').toLowerCase();
      const mFiliere = (m.filiere || '').toLowerCase();
      if (isBtsOrSup) {
        return mNiveau.includes('bts') || mNiveau.includes('supérieur') || mNiveau.includes('étudiant')
          || (filiere && mFiliere.includes(filiere)) || (serie && mSerie.includes(serie));
      } else if (examen.includes('bepc') || niveau.includes('collège') || ['3eme','4eme','5eme','6eme'].some(n => niveau.includes(n))) {
        return mNiveau.includes('collège') || mNiveau.includes('bepc');
      } else {
        return mNiveau.includes('lycée') || mNiveau.includes('bac') || mSerie.includes('toutes')
          || (serie && mSerie.includes(serie));
      }
    });
  }

  if (filtered.length > 0) return filtered;

  if (isBtsOrSup) {
    if (filiere.includes('mcv') || serie.includes('mcv') || filiere.includes('commer') || filiere.includes('vent')) {
      return [
        { id: 'bts_mcv_1', nom: 'Relation Client et Vente (RCNV)',             niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_2', nom: 'Relation Client à Distance (RCDD)',            niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_3', nom: 'Animation et Dynamisation Commerciale (RCAR)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_4', nom: 'Culture Générale et Expression',               niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_5', nom: 'Économie - Droit',                             niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      ];
    }
    return [
      { id: 'bts_gen_1', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_2', nom: 'Économie - Droit',               niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
    ];
  } else if (examen.includes('bepc') || niveau.includes('collège')) {
    return [
      { id: 'col_1', nom: 'Mathématiques', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_2', nom: 'Français',      niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
    ];
  } else {
    return [
      { id: 'lyc_1', nom: 'Mathématiques',  niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_2', nom: 'Physique-Chimie',niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' },
    ];
  }
};

const SUBJECT_COLORS = [
  'var(--clr-brand)', 'var(--clr-green)', 'var(--clr-warning)',
  'var(--clr-brand-mid)', 'var(--clr-green-dk)',
];

const QUICK_ACTIONS = [
  { labelKey: 'learn.dashboard.quick_actions.chat',     icon: '◎', to: '/learn/chat' },
  { labelKey: 'learn.dashboard.quick_actions.revision', icon: '✎', to: '/learn/revision' },
  { labelKey: 'learn.dashboard.quick_actions.quiz',     icon: '▣', to: '/learn/revision' },
  { labelKey: 'learn.dashboard.quick_actions.exams',    icon: '✦', to: '/learn/exams' },
  { labelKey: 'learn.dashboard.quick_actions.resources',icon: '⊕', to: '/learn/resources' },
];

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function LearnDashboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoal,  setCurrentGoal]  = useState({ title: 'Aucun objectif défini', period: 'Non définie', progress: 0 });
  const [recommandations, setRecommandations] = useState([]);
  const [adminMatieres,   setAdminMatieres]   = useState([]);

  const user = {
    prenom:    userProfile?.prenom || userProfile?.nom || t('common.roles.learner'),
    roleLabel: userProfile?.roleLabel || (userProfile?.role === 'student' ? t('common.roles.student_seco') : userProfile?.role) || t('common.roles.student_seco'),
    niveau:    userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || t('common.roles.learner'),
    examen:    userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || t('common.roles.learner'),
    serie:     userProfile?.serie || null,
    filiere:   userProfile?.filiere || userProfile?.discipline || null,
  };

  /* ── Load user goal ── */
  useEffect(() => {
    if (userProfile?.currentGoal) setCurrentGoal(userProfile.currentGoal);
  }, [userProfile]);

  /* ── Load subjects + recommendations ── */
  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDoc(doc(db, 'adminSettings', 'global'));
        if (snap.exists() && snap.data().matieres) setAdminMatieres(snap.data().matieres);
      } catch { /* silent */ }

      try {
        const resSnap = await getDocs(collection(db, 'resources'));
        const published = resSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.statut === 'publie');
        let filtered = published.filter(r =>
          (user.examen  && r.cible?.toLowerCase().includes(user.examen.toLowerCase())) ||
          (user.niveau  && r.niveau?.toLowerCase().includes(user.niveau.toLowerCase())) ||
          (user.filiere && r.filiere?.toLowerCase().includes(user.filiere.toLowerCase()))
        );
        if (!filtered.length) filtered = published;
        setRecommandations(filtered.slice(0, 4).map(r => ({
          id: r.id, url: r.url, text: r.titre || 'Sans titre',
          icon: r.type === 'Quiz' ? '🎲' : r.type === 'Annale' ? '📝' : r.type === 'Épreuve' ? '📜' : '📚',
        })));
      } catch { setRecommandations([]); }
    }
    fetchData();
  }, [user.examen]);

  const filteredMatieres = filterMatieres(adminMatieres, userProfile);
  const matieres = filteredMatieres.map((m, i) => ({
    mat: m.nom, val: userProfile?.matieresProgress?.[m.nom] || 0,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const handleSaveGoal = async (newGoal) => {
    const goalObj = { title: newGoal.title, period: `du ${newGoal.dateDebut} au ${newGoal.dateFin}`, progress: 0 };
    setCurrentGoal(goalObj);
    if (userProfile?.uid) {
      try { await updateDoc(doc(db, 'users', userProfile.uid), { currentGoal: goalObj }); } catch { /* silent */ }
    }
  };

  return (
    <div className="stack stack--lg animate-in">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('learn.header.hello')} {user.prenom} 👋</h1>
          <p style={{ marginTop: 'var(--sp-2)', color: 'var(--txt-secondary)', margin: 'var(--sp-2) 0 0' }}>
            {t('learn.dashboard.level_info', { level: user.niveau })}
            {' · '}{t('learn.dashboard.exam_info', { exam: user.examen })}
          </p>
        </div>
        <Link to="/learn/chat?new=true" className="laura-btn laura-btn-primary">
          {t('learn.dashboard.new_conversation')}
        </Link>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <div className="chip-row">
        {QUICK_ACTIONS.map(({ labelKey, icon, to }) => (
          <button key={labelKey} onClick={() => navigate(to)} className="chip">
            <span aria-hidden="true">{icon}</span> {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── TWO-COLUMN GRID ──────────────────────────────────────────────── */}
      <div className="l-page-grid">

        {/* MAIN COL */}
        <div className="stack stack--lg">

          {/* ── GOAL CARD (hero gradient) ── */}
          <div className="hero-panel">
            <div className="hero-panel__body">
              <div className="row row--between" style={{ marginBottom: 'var(--sp-5)' }}>
                <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75 }}>
                  {t('learn.dashboard.goal_card.title')}
                </span>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="laura-btn"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', minHeight: '32px', padding: '0 var(--sp-4)', fontSize: 'var(--tx-xs)', borderRadius: 'var(--rd-full)' }}
                >
                  {t('learn.dashboard.goal_card.edit_btn')}
                </button>
              </div>

              <h2 style={{ fontSize: 'var(--tx-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', color: 'white' }}>
                {currentGoal.title || t('learn.dashboard.no_goal_title')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>
                {t('learn.dashboard.goal_card.period', { period: currentGoal.period || t('learn.dashboard.no_goal_period') })}
              </p>

              <div>
                <div className="row row--between" style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)', color: 'white' }}>
                  <span>{t('learn.dashboard.goal_card.progress')}</span>
                  <span>{currentGoal.progress}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: 'var(--rd-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${currentGoal.progress}%`, height: '100%', background: 'white', borderRadius: 'var(--rd-full)', transition: 'width var(--dur-slow) var(--ease-std)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SUBJECTS PROGRESS ── */}
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div className="section-header">
              <h3>{t('learn.dashboard.subjects.title')}</h3>
              <Link to="/learn/progress" className="laura-btn laura-btn-ghost" style={{ minHeight: '32px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                {t('learn.dashboard.subjects.see_all')} →
              </Link>
            </div>

            {matieres.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
                <span className="empty-state__icon">📚</span>
                <p className="empty-state__title">{t('learn.dashboard.subjects.empty')}</p>
              </div>
            ) : (
              <div className="stack stack--md">
                {matieres.map((m, i) => (
                  <div key={i}>
                    <div className="row row--between" style={{ marginBottom: 'var(--sp-2)', fontSize: 'var(--tx-sm)', fontWeight: 'var(--fw-semibold)' }}>
                      <span style={{ color: 'var(--txt-primary)' }}>{m.mat}</span>
                      <span style={{ color: m.color, fontWeight: 'var(--fw-bold)' }}>{m.val}%</span>
                    </div>
                    <div className="progress">
                      <div className="progress__fill" style={{ width: `${m.val}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ASIDE COL */}
        <div className="stack stack--lg l-page-aside">

          {/* ── RECOMMENDATIONS ── */}
          <div className="card" style={{ padding: 'var(--sp-5)' }}>
            <div className="section-header" style={{ marginBottom: 'var(--sp-4)' }}>
              <h3 style={{ fontSize: 'var(--tx-md)' }}>{t('learn.dashboard.recommendations.title')}</h3>
            </div>

            {recommandations.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-6)', border: 'none', background: 'var(--srf-raised)' }}>
                <span className="empty-state__icon">🔍</span>
                <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>{t('learn.dashboard.recommendations.empty')}</p>
              </div>
            ) : (
              <div className="stack stack--sm">
                {recommandations.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => r.url ? window.open(r.url, '_blank') : navigate('/learn/chat')}
                    className="list-item"
                    style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'none' }}
                  >
                    <span className="list-item__icon">{r.icon}</span>
                    <div className="list-item__body">
                      <p className="list-item__title truncate">{r.text}</p>
                    </div>
                    <span style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── CHAT CTA ── */}
          <div className="card" style={{ padding: 'var(--sp-5)', background: 'var(--grd-ai)', border: '1px solid var(--brd-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: 'var(--sp-2)' }}>✨</p>
            <h3 style={{ fontSize: 'var(--tx-md)', marginBottom: 'var(--sp-2)' }}>{t('learn.dashboard.chat_cta.title')}</h3>
            <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', marginBottom: 'var(--sp-4)' }}>
              {t('learn.dashboard.chat_cta.desc')}
            </p>
            <Link to="/learn/chat" className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--tx-sm)' }}>
              {t('learn.dashboard.chat_cta.button')}
            </Link>
          </div>

        </div>
      </div>

      {/* ── GOAL MODAL ── */}
      <LearningGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

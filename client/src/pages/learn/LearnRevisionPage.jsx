import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

/* ── Filter resources relevant to the current learner profile ── */
const filterResourcesByProfile = (allResources, userProfile) => {
  if (!userProfile) return allResources;
  const examen  = (userProfile?.examen  || userProfile?.examenEleve  || userProfile?.examenEtudiant  || '').toLowerCase();
  const niveau  = (userProfile?.niveau  || userProfile?.classe       || userProfile?.niveauEtude     || '').toLowerCase();
  const serie   = (userProfile?.serie   || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline   || '').toLowerCase();

  return allResources.filter(r => {
    const cible  = (r.cible  || '').toLowerCase();
    const titre  = (r.titre  || '').toLowerCase();
    const rExamen= (r.examen || '').toLowerCase();
    const rNiveau= (r.niveau || '').toLowerCase();
    const isBts  = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur');
    const isCol  = examen.includes('bepc') || niveau.includes('collège');
    if (isBts)  return cible.includes('bts') || rExamen.includes('bts') || (filiere && rExamen.includes(filiere));
    if (isCol)  return cible.includes('collège') || cible.includes('bepc') || rExamen.includes('bepc');
    const matchCible  = niveau && cible.includes(niveau);
    const matchExamen = examen && (cible.includes(examen) || rExamen.includes(examen) || titre.includes(examen));
    const matchSerie  = serie  && (cible.includes(serie)  || r.serie?.toLowerCase().includes(serie));
    const matchAll    = cible === '' || cible.includes('tous');
    return matchCible || matchExamen || matchSerie || matchAll;
  });
};

const TYPE_ICONS = { Quiz: '🎲', Annale: '📝', Épreuve: '📜', Fiche: '📋', Livre: '📖' };
const getIcon = (type) => TYPE_ICONS[type] || '📚';

export default function LearnRevisionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [sessionType, setSessionType]       = useState('Resume');
  const [duration, setDuration]             = useState('30');
  const [isLoading, setIsLoading]           = useState(false);
  const [resources, setResources]           = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isFetching, setIsFetching]         = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [search, setSearch]                 = useState('');
  const [typeFilter, setTypeFilter]         = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsFetching(true);
      try {
        // Load published resources
        const snap = await getDocs(collection(db, 'resources'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const published = docs.filter(r => r.statut === 'publie');
        setResources(filterResourcesByProfile(published, userProfile));
      } catch (err) {
        console.error('Error fetching resources:', err);
      }

      // Load recent sessions
      if (userProfile?.uid) {
        try {
          const sessionsSnap = await getDocs(collection(db, 'users', userProfile.uid, 'sessions'));
          const ses = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRecentSessions(ses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4));
        } catch (err) {
          console.error('Error fetching sessions:', err);
        }
      }
      setIsFetching(false);
    }
    fetchData();
  }, [userProfile]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedResource) return;

    setIsLoading(true);

    const sessionObj = {
      resourceId:   selectedResource.id,
      resourceTitle: selectedResource.titre,
      resourceType:  selectedResource.type,
      resourceUrl:   selectedResource.url || null,
      matiere:       selectedResource.matiere || selectedResource.cible || '',
      chapitre:      selectedResource.titre,
      type:          sessionType,
      duree:         duration,
      status:        'En cours',
      createdAt:     new Date().toISOString()
    };

    if (userProfile?.uid) {
      try {
        const docRef = await addDoc(collection(db, 'users', userProfile.uid, 'sessions'), sessionObj);
        const params = new URLSearchParams({
          sessionId:    docRef.id,
          resourceId:   selectedResource.id,
          resourceTitle: selectedResource.titre,
          matiere:      selectedResource.matiere || selectedResource.cible || '',
          chapitre:     selectedResource.titre,
          type:         sessionType
        });
        navigate(`/learn/chat?${params.toString()}`);
      } catch (err) {
        console.error('Session creation error:', err);
        alert(t('learn.revision.new_session.alert_error', 'Erreur de création de la session.'));
      } finally {
        setIsLoading(false);
      }
    } else {
      const params = new URLSearchParams({
        resourceId:   selectedResource.id,
        resourceTitle: selectedResource.titre,
        matiere:      selectedResource.matiere || selectedResource.cible || '',
        chapitre:     selectedResource.titre,
        type:         sessionType
      });
      navigate(`/learn/chat?${params.toString()}`);
    }
  };

  // Filter displayed resources
  const displayedResources = resources.filter(r => {
    const matchSearch = !search || r.titre?.toLowerCase().includes(search.toLowerCase()) || r.matiere?.toLowerCase().includes(search.toLowerCase());
    const matchType   = !typeFilter || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const SESSION_TYPES = [
    { value: 'Resume',   label: 'Résumé de cours',         icon: '📖' },
    { value: 'Quiz',     label: 'Quiz interactif',          icon: '🎲' },
    { value: 'Exercice', label: "Exercices corrigés",       icon: '✍️' },
    { value: 'Examen',   label: "Simulation d'examen",     icon: '🎯' },
  ];

  return (
    <div className="stack stack--lg animate-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="laura-h1">{t('learn.revision.title', 'Révision Guidée')}</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
            {t('learn.revision.subtitle', 'Sélectionnez un cours ou une épreuve réelle pour lancer votre session avec LAURA.')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--sp-6)', alignItems: 'start' }}>

        {/* ── Left: Resource Picker ── */}
        <div className="card" style={{ padding: 'var(--sp-6)' }}>
          <h2 className="laura-h3" style={{ margin: '0 0 var(--sp-1)' }}>
            📚 {t('learn.revision.pick_resource', 'Choisissez un document de base')}
          </h2>
          <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', margin: '0 0 var(--sp-4)' }}>
            La session sera contextualisée sur ce document. LAURA basera toutes ses réponses sur son contenu réel.
          </p>

          {/* Search + type filter */}
          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Rechercher par titre ou matière..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: '2 1 180px' }}
            />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ flex: '1 1 130px' }}
            >
              <option value="">Tous les types</option>
              <option value="Épreuve">📜 Épreuve</option>
              <option value="Annale">📝 Annale</option>
              <option value="Fiche">📋 Fiche de cours</option>
              <option value="Quiz">🎲 Quiz</option>
              <option value="Livre">📖 Livre</option>
            </select>
          </div>

          {/* Resource list */}
          {isFetching ? (
            <div className="empty-state">
              <span className="empty-state__icon">⏳</span>
              <p className="empty-state__title">Chargement des ressources...</p>
            </div>
          ) : displayedResources.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔍</span>
              <p className="empty-state__title">Aucune ressource trouvée</p>
              <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-tertiary)' }}>
                Essayez de changer les filtres ou explorez la{' '}
                <button
                  onClick={() => navigate('/learn/resources')}
                  style={{ background: 'none', border: 'none', color: 'var(--clr-brand)', cursor: 'pointer', padding: 0, fontWeight: 'bold', fontSize: 'inherit' }}
                >
                  bibliothèque de ressources
                </button>
                .
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', maxHeight: '420px', overflowY: 'auto' }} className="no-scrollbar">
              {displayedResources.map(res => {
                const isSelected = selectedResource?.id === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResource(isSelected ? null : res)}
                    style={{
                      padding: 'var(--sp-4)',
                      borderRadius: 'var(--rd-lg)',
                      border: `2px solid ${isSelected ? 'var(--clr-brand)' : 'var(--brd-subtle)'}`,
                      background: isSelected ? 'var(--clr-brand-lt, rgba(79,110,247,0.08))' : 'var(--srf-raised)',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 'var(--sp-4)',
                      alignItems: 'center',
                      transition: 'all var(--dur-fast)'
                    }}
                  >
                    <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{getIcon(res.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-primary)', marginBottom: 'var(--sp-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.titre || 'Sans titre'}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                        {res.type   && <span className="badge">{res.type}</span>}
                        {res.cible  && <span className="badge badge--brand">{res.cible}</span>}
                        {res.matiere && <span className="badge badge--green">{res.matiere}</span>}
                      </div>
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? 'var(--clr-brand)' : 'var(--brd-default)'}`,
                      background: isSelected ? 'var(--clr-brand)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all var(--dur-fast)'
                    }}>
                      {isSelected && <span style={{ color: 'white', fontSize: '12px', lineHeight: 1 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Session Config + Recent Sessions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

          {/* Session config form */}
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <h2 className="laura-h3" style={{ margin: '0 0 var(--sp-4)' }}>⚙️ Configurer la session</h2>

            {/* Selected resource badge */}
            {selectedResource ? (
              <div style={{
                padding: 'var(--sp-3) var(--sp-4)',
                borderRadius: 'var(--rd-md)',
                background: 'var(--clr-brand-lt, rgba(79,110,247,0.08))',
                border: '1px solid var(--clr-brand)',
                marginBottom: 'var(--sp-4)',
                display: 'flex',
                gap: 'var(--sp-3)',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.3rem' }}>{getIcon(selectedResource.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-brand)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedResource.titre}
                  </p>
                  <p style={{ margin: 0, fontSize: '10px', color: 'var(--txt-tertiary)' }}>
                    {selectedResource.type} · {selectedResource.cible || 'Tous niveaux'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', fontSize: '16px', flexShrink: 0, padding: 0 }}
                  aria-label="Désélectionner"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{
                padding: 'var(--sp-3)',
                borderRadius: 'var(--rd-md)',
                background: 'var(--srf-raised)',
                border: '1px dashed var(--brd-default)',
                marginBottom: 'var(--sp-4)',
                textAlign: 'center',
                fontSize: 'var(--tx-xs)',
                color: 'var(--txt-tertiary)'
              }}>
                ← Sélectionnez un document à gauche
              </div>
            )}

            <form onSubmit={handleStartSession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {/* Session type */}
              <div className="form-group">
                <label style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-2)', display: 'block' }}>
                  Type de session
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                  {SESSION_TYPES.map(st => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setSessionType(st.value)}
                      style={{
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: `1.5px solid ${sessionType === st.value ? 'var(--clr-brand)' : 'var(--brd-subtle)'}`,
                        background: sessionType === st.value ? 'var(--clr-brand-lt, rgba(79,110,247,0.1))' : 'var(--srf-raised)',
                        color: sessionType === st.value ? 'var(--clr-brand)' : 'var(--txt-secondary)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: sessionType === st.value ? 'var(--fw-bold)' : 'normal',
                        textAlign: 'center',
                        transition: 'all var(--dur-fast)'
                      }}
                    >
                      {st.icon} {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="form-group">
                <label style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-2)', display: 'block' }}>
                  Durée souhaitée
                </label>
                <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%' }}>
                  <option value="15">⚡ 15 min (Rapide)</option>
                  <option value="30">📖 30 min (Standard)</option>
                  <option value="60">🎓 1h (Approfondi)</option>
                  <option value="90">🏆 1h30</option>
                  <option value="120">🏅 2h (Examen complet)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedResource}
                className="laura-btn laura-btn-primary"
                style={{ width: '100%', justifyContent: 'center', minHeight: '44px', fontSize: 'var(--tx-sm)', marginTop: 'var(--sp-2)', opacity: !selectedResource ? 0.5 : 1 }}
              >
                {isLoading
                  ? '⏳ Démarrage...'
                  : selectedResource
                    ? `🚀 Démarrer la session`
                    : '← Sélectionnez d\'abord un document'
                }
              </button>

              {!selectedResource && (
                <p style={{ fontSize: '10px', textAlign: 'center', color: 'var(--txt-tertiary)', margin: 0 }}>
                  Une session ne peut être lancée que sur la base d'un cours ou d'une épreuve réelle.
                </p>
              )}
            </form>
          </div>

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)' }}>
                <h3 className="laura-h3" style={{ margin: 0, fontSize: 'var(--tx-sm)' }}>🕘 Sessions récentes</h3>
              </div>
              {recentSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => {
                    const params = new URLSearchParams({ sessionId: session.id, matiere: session.matiere || '', chapitre: session.chapitre || '' });
                    if (session.resourceId) params.set('resourceId', session.resourceId);
                    navigate(`/learn/chat?${params.toString()}`);
                  }}
                  style={{
                    padding: 'var(--sp-3) var(--sp-4)',
                    borderBottom: '1px solid var(--brd-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-3)',
                    transition: 'background var(--dur-fast)'
                  }}
                  className="hoverable-row"
                >
                  <span style={{ fontSize: '1.2rem' }}>{getIcon(session.resourceType || session.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.resourceTitle || session.chapitre}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--txt-tertiary)' }}>
                      {session.type} · {session.duree} min
                    </p>
                  </div>
                  <span style={{ color: 'var(--txt-tertiary)', fontSize: '14px' }}>→</span>
                </div>
              ))}
            </div>
          )}

          {/* Tip card */}
          <div style={{ padding: 'var(--sp-4)', borderRadius: 'var(--rd-lg)', background: 'var(--srf-sidebar)', border: '1px solid var(--brd-subtle)' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--txt-secondary)', lineHeight: '1.5' }}>
              💡 <strong>Astuce :</strong> Pour de meilleures révisions, LAURA analyse le contenu réel de l'épreuve ou du cours sélectionné et adapte ses explications en conséquence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

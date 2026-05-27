import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const filterMatieres = (allMatieres, userProfile) => {
  const examen = (userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || '').toLowerCase();
  const niveau = (userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || '').toLowerCase();
  const serie = (userProfile?.serie || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline || '').toLowerCase();

  // If user is BTS or Superior Level
  const isBtsOrSup = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur') || niveau.includes('étudiant') || niveau.includes('licence') || niveau.includes('université');

  if (!allMatieres || allMatieres.length === 0) return [];

  return allMatieres.filter(m => {
    const mNiveau = (m.niveau || '').toLowerCase();
    const mSerie = (m.serie || '').toLowerCase();
    const mFiliere = (m.filiere || '').toLowerCase();

    if (isBtsOrSup) {
      return mNiveau.includes('bts') || mNiveau.includes('supérieur') || mNiveau.includes('étudiant') || 
             (filiere && mFiliere.includes(filiere)) || (serie && mSerie.includes(serie));
    } else if (examen.includes('bepc') || niveau.includes('collège') || niveau.includes('3eme') || niveau.includes('4eme') || niveau.includes('5eme') || niveau.includes('6eme')) {
      return mNiveau.includes('collège') || mNiveau.includes('bepc');
    } else {
      return mNiveau.includes('lycée') || mNiveau.includes('bac') || mSerie.includes('toutes') || 
             (serie && mSerie.includes(serie));
    }
  });
};

export default function LearnProgressPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoals, setCurrentGoals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminMatieres, setAdminMatieres] = useState([]);

  useEffect(() => {
    if (userProfile?.goals) {
      setCurrentGoals(userProfile.goals);
    } else if (userProfile?.currentGoal) {
      setCurrentGoals([userProfile.currentGoal]);
    } else {
      setCurrentGoals([]);
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchInitialData() {
      // Fetch Admin Matieres
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().matieres) {
          setAdminMatieres(docSnap.data().matieres);
        }
      } catch (err) {
        console.error("Erreur admin matieres:", err);
      }

      // Fetch Activities
      if (!userProfile?.uid) {
        setIsLoading(false);
        return;
      }
      try {
        const actSnap = await getDocs(collection(db, 'users', userProfile.uid, 'activities'));
        const docs = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (docs.length > 0) {
          setRecentActivities(docs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        } else {
          setRecentActivities([]);
        }
      } catch (err) {
        console.error("Erreur de récupération des activités :", err);
        setRecentActivities([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, [userProfile?.uid]);

  const userMatieres = userProfile?.matieres || [];

  const subjectProgress = userMatieres.map((mName, i) => ({
    matiere: mName,
    val: userProfile?.matieresProgress?.[mName] || 0,
    color: i % 4 === 0 ? '#7C6FFF' : i % 4 === 1 ? '#00D4AA' : i % 4 === 2 ? '#F59E0B' : '#3B82F6'
  }));

  const globalProgress = Math.round(subjectProgress.reduce((acc, curr) => acc + curr.val, 0) / subjectProgress.length) || 0;

  const handleSaveGoal = async (newGoal) => {
    const goalObj = {
      id: Date.now().toString(),
      title: newGoal.title,
      matiere: newGoal.matiere,
      type: newGoal.type,
      cible: newGoal.cible,
      targetValue: parseInt(newGoal.targetValue) || 10,
      currentValue: 0,
      progress: 0,
      date: `${newGoal.dateDebut} au ${newGoal.dateFin}`,
      dateDebut: newGoal.dateDebut,
      dateFin: newGoal.dateFin
    };
    const updatedGoals = [goalObj, ...currentGoals];
    setCurrentGoals(updatedGoals);

    if (userProfile?.uid) {
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), { goals: arrayUnion(goalObj) });
      } catch (err) {
        console.error("Erreur lors de l'enregistrement de l'objectif :", err);
      }
    }
  };

  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER & GLOBAL PROGRESS */}
      <div className="learn-card progress-header" style={{ background: '#1A1A1A', color: 'white' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'white' }}>{t('learn.progress.title', 'Votre Progression')}</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>{t('learn.progress.subtitle', 'Examen préparé :')} {userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || t('learn.progress.not_defined', 'Non défini')} {userProfile?.serie ? `(${userProfile.serie})` : ''}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#00D4AA', lineHeight: 1 }}>{globalProgress}%</div>
          <div style={{ color: '#94A3B8', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>{t('learn.progress.global_prep', 'Préparation globale')}</div>
        </div>
      </div>

      <div className="l-page-grid">
        
        {/* PAR MATIÈRE */}
        <div className="learn-card">
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800 }}>{t('learn.progress.by_subject.title', 'Progression par matière (Programme Officiel)')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {subjectProgress.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#444' }}>
                  <span>{m.matiere}</span><span>{m.val}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#F0F0EE', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: '5px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* OBJECTIFS EN COURS */}
        <div className="learn-card l-page-aside">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{t('learn.progress.goals.title', 'Objectifs en cours')}</h2>
            <button onClick={() => setIsGoalModalOpen(true)} style={{ background: '#F5F4EF', border: 'none', padding: '0.4rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>{t('learn.progress.goals.new_btn', '+ Nouveau')}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentGoals.length === 0 ? (
              <div style={{ color: '#6E6E6B', fontSize: '0.95rem', padding: '1rem 0' }}>{t('learn.progress.goals.empty', 'Aucun objectif en cours. Cliquez sur "+ Nouveau" pour en créer un.')}</div>
            ) : (
              currentGoals.map((goal, i) => (
                <div key={i} style={{ background: '#F9F9F8', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E5E2', position: 'relative' }}>
                  
                  {/* Status badge */}
                  {goal.progress >= 100 && (
                    <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '2rem' }}>✅ Terminé</span>
                  )}

                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, paddingRight: goal.progress >= 100 ? '5rem' : '0' }}>{goal.title}</h3>
                  
                  {/* Meta: matiere + type */}
                  {(goal.matiere || goal.cible) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {goal.matiere && <span style={{ background: '#EEF2FF', color: '#4338CA', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '2rem' }}>{goal.matiere}</span>}
                      {goal.cible && <span style={{ background: '#FFF7ED', color: '#C2410C', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '2rem' }}>{goal.cible}</span>}
                    </div>
                  )}

                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#6E6E6B' }}>{goal.date || goal.period}</p>
                  
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1, height: '8px', background: '#E5E5E2', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${goal.progress || 0}%`, height: '100%', background: goal.progress >= 100 ? '#10B981' : '#1A1A1A', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '3rem', textAlign: 'right' }}>
                      {goal.targetValue ? `${goal.currentValue || 0} / ${goal.targetValue}` : `${goal.progress || 0}%`}
                    </span>
                  </div>

                  {/* Launch button */}
                  {goal.progress < 100 && (
                    <button
                      onClick={() => {
                        // Navigate to LearnChat with goal context as query params
                        const params = new URLSearchParams({
                          goalId: goal.id || i.toString(),
                          goalTitle: goal.title || '',
                          matiere: goal.matiere || '',
                          type: goal.type || 'Exercices',
                          prompt: goal.matiere
                            ? `Génère-moi des ${goal.cible || 'exercices'} en ${goal.matiere} pour atteindre mon objectif : "${goal.title}"`
                            : `Aide-moi à atteindre mon objectif : "${goal.title}"`
                        });
                        navigate(`/learn/chat?${params.toString()}`);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        background: '#1A1A1A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.6rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#333'}
                      onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
                    >
                      ▶ Lancer la session
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* HISTORIQUE D'ACTIVITÉS */}
      <div className="learn-card">
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800 }}>{t('learn.progress.activities.title', 'Activités récentes')}</h2>
        {isLoading ? (
          <div style={{ color: '#6E6E6B', padding: '1rem 0' }}>{t('learn.progress.activities.loading', 'Chargement des activités...')}</div>
        ) : recentActivities.length === 0 ? (
          <div style={{ color: '#6E6E6B', padding: '1rem 0', fontSize: '0.95rem' }}>{t('learn.progress.activities.empty', 'Aucune activité récente. Lancez un quiz ou une révision !')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivities.map((act, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#FAFAFA', borderRadius: '0.75rem', border: '1px solid #F0F0EE' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '0.3rem' }}>{act.action || act.title || act.type}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>{act.time || new Date(act.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', border: '1px solid #E5E5E2', fontWeight: 700, fontSize: '0.9rem', color: '#00A37A' }}>
                  {act.result || t('learn.progress.activities.completed', 'Terminé')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LearningGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onSave={handleSaveGoal}
      />
    </div>
  );
}

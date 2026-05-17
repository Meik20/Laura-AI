import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';

export default function LearnProgressPage() {
  const { userProfile } = useAuth();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoals, setCurrentGoals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.goals) {
      setCurrentGoals(userProfile.goals);
    } else if (userProfile?.currentGoal) {
      setCurrentGoals([userProfile.currentGoal]);
    } else {
      setCurrentGoals([
        { title: 'Réviser 8 chapitres de Maths', progress: 45, date: '1 Juin - 30 Juin' },
        { title: 'Passer 3 annales de SVT', progress: 33, date: '15 Mai - 15 Juin' }
      ]);
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchActivities() {
      if (!userProfile?.uid) return;
      try {
        const actSnap = await getDocs(collection(db, 'users', userProfile.uid, 'activities'));
        const docs = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (docs.length > 0) {
          setRecentActivities(docs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        } else {
          setRecentActivities([
            { action: 'Quiz Probabilités', result: '14/20', time: 'Il y a 2 heures', type: 'quiz' },
            { action: 'Révision : Suites arithmétiques', result: 'Terminé', time: 'Hier', type: 'revision' },
            { action: 'Exercice : Génétique', result: 'En cours', time: 'Il y a 2 jours', type: 'exercice' },
            { action: 'Annale Maths 2022', result: '12/20', time: 'Semaine dernière', type: 'exam' }
          ]);
        }
      } catch (err) {
        console.error("Erreur de récupération des activités :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, [userProfile?.uid]);

  const subjectProgress = [
    { matiere: 'Mathématiques', val: userProfile?.matieresProgress?.Mathématiques || 68, color: '#7C6FFF' },
    { matiere: 'SVT', val: userProfile?.matieresProgress?.SVT || 55, color: '#00D4AA' },
    { matiere: 'Physique-Chimie', val: userProfile?.matieresProgress?.Physique || 40, color: '#F59E0B' },
    { matiere: 'Philosophie / Français', val: userProfile?.matieresProgress?.Philosophie || 80, color: '#3B82F6' }
  ];

  const globalProgress = Math.round(subjectProgress.reduce((acc, curr) => acc + curr.val, 0) / subjectProgress.length);

  const handleSaveGoal = async (newGoal) => {
    const goalObj = {
      title: newGoal.title,
      progress: 0,
      date: `${newGoal.dateDebut} au ${newGoal.dateFin}`
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
      <div style={{ ...cardStyle, background: '#1A1A1A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Votre Progression</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Examen préparé : {userProfile?.examen || 'BAC'} {userProfile?.serie ? `(${userProfile.serie})` : ''}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#00D4AA', lineHeight: 1 }}>{globalProgress}%</div>
          <div style={{ color: '#94A3B8', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Préparation globale</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* PAR MATIÈRE */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800 }}>Progression par matière</h2>
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
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Objectifs en cours</h2>
            <button onClick={() => setIsGoalModalOpen(true)} style={{ background: '#F5F4EF', border: 'none', padding: '0.4rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>+ Nouveau</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentGoals.map((goal, i) => (
              <div key={i} style={{ background: '#F9F9F8', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E5E2' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{goal.title || goal.title}</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#6E6E6B' }}>{goal.date || goal.period}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, height: '8px', background: '#E5E5E2', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${goal.progress || 0}%`, height: '100%', background: '#1A1A1A', borderRadius: '4px' }}></div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{goal.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* HISTORIQUE D'ACTIVITÉS */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 800 }}>Activités récentes</h2>
        {isLoading ? (
          <div style={{ color: '#6E6E6B', padding: '1rem 0' }}>Chargement des activités...</div>
        ) : recentActivities.length === 0 ? (
          <div style={{ color: '#6E6E6B', padding: '1rem 0', fontSize: '0.95rem' }}>Aucune activité récente. Lancez un quiz ou une révision !</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivities.map((act, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#FAFAFA', borderRadius: '0.75rem', border: '1px solid #F0F0EE' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1A1A1A', marginBottom: '0.3rem' }}>{act.action || act.title || act.type}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>{act.time || new Date(act.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ background: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', border: '1px solid #E5E5E2', fontWeight: 700, fontSize: '0.9rem', color: '#00A37A' }}>
                  {act.result || 'Terminé'}
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

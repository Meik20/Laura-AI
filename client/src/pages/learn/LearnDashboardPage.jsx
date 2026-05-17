import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';

export default function LearnDashboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState({
    title: 'Aucun objectif défini',
    period: 'Non définie',
    progress: 0
  });
  const [recommandations, setRecommandations] = useState([]);
  const [adminMatieres, setAdminMatieres] = useState([]);

  const user = {
    prenom: userProfile?.prenom || userProfile?.nom || userProfile?.displayName || 'Apprenant',
    roleLabel: userProfile?.roleLabel || (userProfile?.role === 'student' ? 'Élève' : userProfile?.role) || 'Élève',
    niveau: userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || 'Non défini',
    examen: userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || 'Non défini',
    serie: userProfile?.serie || null,
    filiere: userProfile?.filiere || userProfile?.discipline || null
  };

  useEffect(() => {
    if (userProfile?.currentGoal) {
      setCurrentGoal(userProfile.currentGoal);
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

      // Fetch Recos
      try {
        const resSnap = await getDocs(collection(db, 'resources'));
        const allRes = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = allRes.filter(r => r.statut === 'publie').slice(0, 3);
        if (filtered.length > 0) {
          setRecommandations(filtered.map(r => ({
            id: r.id,
            icon: r.type === 'Quiz' ? '🎲' : r.type === 'Annale' ? '📝' : r.type === 'Épreuve' ? '📜' : '📚',
            text: r.titre || 'Sans titre',
            url: r.url
          })));
        } else {
          setRecommandations([]);
        }
      } catch (e) {
        console.error(e);
        setRecommandations([]);
      }
    }
    fetchInitialData();
  }, [user.examen]);

  let matieres = adminMatieres.length > 0 
    ? adminMatieres.map((m, i) => ({
        mat: m.nom,
        val: userProfile?.matieresProgress?.[m.nom] || 0,
        color: i % 3 === 0 ? '#7C6FFF' : i % 3 === 1 ? '#F59E0B' : '#00D4AA'
      }))
    : [
        { mat: 'Mathématiques', val: userProfile?.matieresProgress?.Mathématiques || 0, color: '#7C6FFF' },
        { mat: 'Physique-Chimie', val: userProfile?.matieresProgress?.Physique || 0, color: '#F59E0B' },
        { mat: 'SVT', val: userProfile?.matieresProgress?.SVT || 0, color: '#00D4AA' }
      ];

  const handleSaveGoal = async (newGoal) => {
    const goalObj = {
      title: newGoal.title,
      period: `du ${newGoal.dateDebut} au ${newGoal.dateFin}`,
      progress: 0
    };
    setCurrentGoal(goalObj);
    if (userProfile?.uid) {
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), { currentGoal: goalObj });
      } catch (err) {
        console.error("Erreur lors de l'enregistrement de l'objectif :", err);
      }
    }
  };

  const handleEditProfile = async () => {
    navigate('/learn/profile');
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'Parler à LAURA': navigate('/learn/chat'); break;
      case 'Réviser un chapitre': navigate('/learn/revision'); break;
      case 'Lancer un quiz': navigate('/learn/revision'); break;
      case 'Préparer mon examen': navigate('/learn/exams'); break;
      case 'Voir mes ressources': navigate('/learn/resources'); break;
      default: navigate('/learn/chat');
    }
  };

  const cardStyle = { background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', color: '#1A1A1A' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER / WELCOME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Bonjour {user.prenom} 👋</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Vous êtes en <strong style={{ color: '#1A1A1A' }}>{user.niveau}</strong> · Examen préparé : <strong style={{ color: '#1A1A1A' }}>{user.examen}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/learn/chat')} style={{ padding: '0.8rem 1.5rem', background: '#00D4AA', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#00B894'} onMouseLeave={e => e.currentTarget.style.background = '#00D4AA'}>
          <span>+</span> Nouvelle conversation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE (Principale) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* CARTE OBJECTIF */}
          <div style={{ ...cardStyle, background: '#1A1A1A', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Objectif d'apprentissage</h3>
              <button onClick={() => setIsGoalModalOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', cursor: 'pointer' }}>Modifier</button>
            </div>
            
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{currentGoal.title}</h2>
            <p style={{ margin: '0 0 2rem 0', color: '#94A3B8' }}>Période : {currentGoal.period}</p>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <span>Progression</span>
                <span>{currentGoal.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${currentGoal.progress}%`, height: '100%', background: '#00D4AA', borderRadius: '6px' }}></div>
              </div>
            </div>
          </div>

          {/* ACTIONS RAPIDES */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Actions rapides</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {['Parler à LAURA', 'Réviser un chapitre', 'Lancer un quiz', 'Préparer mon examen', 'Voir mes ressources'].map((action, i) => (
                <button key={i} onClick={() => handleQuickAction(action)} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.8rem 1.2rem', borderRadius: '0.75rem', fontWeight: 600, color: '#1A1A1A', cursor: 'pointer', flex: '1 1 calc(33% - 1rem)', textAlign: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* PROGRESSION DÉTAILLÉE */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Ma progression par matière (Programme Officiel)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {matieres.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.95rem', fontWeight: 600, color: '#444' }}>
                    <span>{m.mat}</span><span>{m.val}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#F0F0EE', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLONNE DROITE (Latérale) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* RECOMMANDATIONS */}
          <div style={{ ...cardStyle, background: '#F5F4EF', border: 'none' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Recommandations pour vous</h3>
            {recommandations.length === 0 ? (
              <div style={{ color: '#6E6E6B', fontSize: '0.95rem', padding: '1rem 0' }}>Aucune ressource recommandée pour le moment. Explorez le catalogue complet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommandations.map((r, i) => (
                  <li key={i} onClick={() => r.url ? window.open(r.url, '_blank') : navigate('/learn/chat')} style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <span style={{ fontSize: '1.5rem' }}>{r.icon}</span> <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* PROFIL ACADÉMIQUE */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Profil Académique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Profil</span><span style={{ fontWeight: 600 }}>{user.roleLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Classe / Niveau</span><span style={{ fontWeight: 600 }}>{user.niveau} {user.serie ? `(${user.serie})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Examen préparé</span><span style={{ fontWeight: 600 }}>{user.examen}</span>
              </div>
            </div>
            <button onClick={handleEditProfile} style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', background: 'transparent', border: '1px solid #E5E5E2', borderRadius: '0.6rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F5F4EF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Modifier mon profil
            </button>
          </div>

        </div>
      </div>

      <LearningGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onSave={handleSaveGoal}
      />
    </div>
  );
}

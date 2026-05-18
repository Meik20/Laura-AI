import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';

const filterMatieres = (allMatieres, userProfile) => {
  const examen = (userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || '').toLowerCase();
  const niveau = (userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || '').toLowerCase();
  const serie = (userProfile?.serie || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline || '').toLowerCase();

  // If user is BTS or Superior Level
  const isBtsOrSup = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur') || niveau.includes('étudiant') || niveau.includes('licence') || niveau.includes('université');

  let filtered = [];

  if (allMatieres && allMatieres.length > 0) {
    filtered = allMatieres.filter(m => {
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
  }

  if (filtered.length > 0) {
    return filtered;
  }

  // Fallbacks
  if (isBtsOrSup) {
    if (filiere.includes('mcv') || serie.includes('mcv') || examen.includes('mcv') || filiere.includes('commer') || filiere.includes('vent')) {
      return [
        { id: 'bts_mcv_1', nom: 'Relation Client et Vente (RCNV)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_2', nom: 'Relation Client à Distance (RCDD)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_3', nom: 'Animation et Dynamisation Commerciale (RCAR)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_4', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_5', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_6', nom: 'Management des Entreprises', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_7', nom: 'Anglais Commercial', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Langues' }
      ];
    }
    return [
      { id: 'bts_gen_1', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_2', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_3', nom: 'Management des Entreprises', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_4', nom: 'Anglais Commercial', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Langues' },
      { id: 'bts_gen_5', nom: 'Relation Client et Vente', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Commerce' }
    ];
  } else if (examen.includes('bepc') || niveau.includes('collège')) {
    return [
      { id: 'col_1', nom: 'Mathématiques', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_2', nom: 'Français', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_3', nom: 'Sciences de la Vie et de la Terre', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_4', nom: 'Physique-Chimie', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_5', nom: 'Histoire-Géographie', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_6', nom: 'Anglais', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' }
    ];
  } else {
    return [
      { id: 'lyc_1', nom: 'Mathématiques', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_2', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' },
      { id: 'lyc_3', nom: 'SVT', niveau: 'Lycée', serie: 'C, D', filiere: 'Général' },
      { id: 'lyc_4', nom: 'Philosophie', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_5', nom: 'Français', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_6', nom: 'Histoire-Géo', niveau: 'Lycée', serie: 'A, C, D', filiere: 'Général' },
      { id: 'lyc_7', nom: 'Économie', niveau: 'Lycée', serie: 'SES, B', filiere: 'Général' },
      { id: 'lyc_8', nom: 'Informatique', niveau: 'Lycée', serie: 'TI', filiere: 'Général' }
    ];
  }
};

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
        const published = allRes.filter(r => r.statut === 'publie');
        let filtered = published.filter(r => 
          (user.examen && r.cible?.toLowerCase().includes(user.examen.toLowerCase())) ||
          (user.niveau && r.niveau?.toLowerCase().includes(user.niveau.toLowerCase())) ||
          (user.filiere && r.filiere?.toLowerCase().includes(user.filiere.toLowerCase()))
        );
        if (filtered.length === 0) {
          filtered = published;
        }
        filtered = filtered.slice(0, 3);
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

  const filteredMatieres = filterMatieres(adminMatieres, userProfile);

  let matieres = filteredMatieres.map((m, i) => ({
    mat: m.nom,
    val: userProfile?.matieresProgress?.[m.nom] || 0,
    color: i % 3 === 0 ? '#7C6FFF' : i % 3 === 1 ? '#F59E0B' : '#00D4AA'
  }));

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
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER / WELCOME */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Bonjour {user.prenom} 👋</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Vous êtes en <strong style={{ color: '#1A1A1A' }}>{user.niveau}</strong> · Examen préparé : <strong style={{ color: '#1A1A1A' }}>{user.examen}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/learn/chat?new=true')} style={{ padding: '0.8rem 1.5rem', background: '#00D4AA', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = '#00B894'} onMouseLeave={e => e.currentTarget.style.background = '#00D4AA'}>
          <span>+</span> Nouvelle conversation
        </button>
      </div>

      <div className="dashboard-grid">
        
        {/* COLONNE GAUCHE (Principale) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>
          
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
            <div className="quick-actions-container">
              {['Parler à LAURA', 'Réviser un chapitre', 'Lancer un quiz', 'Préparer mon examen', 'Voir mes ressources'].map((action, i) => (
                <button key={i} onClick={() => handleQuickAction(action)} className="quick-action-btn">
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

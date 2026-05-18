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

  if (isBtsOrSup) {
    if (filiere.includes('mcv') || serie.includes('mcv') || examen.includes('mcv') || filiere.includes('commer') || filiere.includes('vent')) {
      return [
        { id: 'bts_mcv_1', nom: 'Relation Client et Vente (RCNV)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_2', nom: 'Relation Client à Distance (RCDD)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_3', nom: 'Animation et Dynamisation Commerciale (RCAR)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_4', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_5', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' }
      ];
    }
    return [
      { id: 'bts_gen_1', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_2', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' }
    ];
  } else if (examen.includes('bepc') || niveau.includes('collège')) {
    return [
      { id: 'col_1', nom: 'Mathématiques', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_2', nom: 'Français', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' }
    ];
  } else {
    return [
      { id: 'lyc_1', nom: 'Mathématiques', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_2', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' }
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
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().matieres) {
          setAdminMatieres(docSnap.data().matieres);
        }
      } catch (err) {
        console.error("Erreur admin matieres:", err);
      }

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
    color: i % 3 === 0 ? 'var(--laura-primary)' : i % 3 === 1 ? 'var(--laura-accent)' : 'var(--laura-success)'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      
      {/* HEADER / WELCOME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="laura-h1">Bonjour {user.prenom} 👋</h1>
          <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>
            Vous êtes en <strong>{user.niveau}</strong> · Examen préparé : <strong>{user.examen}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/learn/chat?new=true')} className="laura-btn laura-btn-primary">
          <span>+</span> Nouvelle conversation
        </button>
      </div>

      <div className="laura-page-grid">
        
        {/* COLONNE GAUCHE (Principale) */}
        <div className="laura-page-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          
          {/* CARTE OBJECTIF */}
          <div className="laura-card" style={{ background: 'var(--laura-ai-bg)', border: '1px solid var(--laura-primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
              <h3 className="laura-small" style={{ textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--laura-primary)' }}>Objectif d'apprentissage</h3>
              <button onClick={() => setIsGoalModalOpen(true)} className="laura-btn" style={{ background: 'white', color: 'var(--laura-primary)', padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}>Modifier</button>
            </div>
            
            <h2 className="laura-h2">{currentGoal.title}</h2>
            <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: 'var(--sp-6)' }}>Période : {currentGoal.period}</p>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                <span>Progression</span>
                <span style={{ color: 'var(--laura-primary)' }}>{currentGoal.progress}%</span>
              </div>
              <div className="laura-progress" style={{ height: '8px' }}>
                <div className="laura-progress-fill" style={{ width: `${currentGoal.progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* ACTIONS RAPIDES */}
          <div className="laura-card">
            <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-5)' }}>Actions rapides</h3>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', overflowX: 'auto', paddingBottom: 'var(--sp-2)' }}>
              {['Parler à LAURA', 'Réviser un chapitre', 'Lancer un quiz', 'Préparer mon examen', 'Voir mes ressources'].map((action, i) => (
                <button key={i} onClick={() => handleQuickAction(action)} className="laura-btn laura-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* PROGRESSION DÉTAILLÉE */}
          <div className="laura-card">
            <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-5)' }}>Ma progression par matière</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {matieres.map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--laura-text-1)' }}>
                    <span>{m.mat}</span><span>{m.val}%</span>
                  </div>
                  <div className="laura-progress" style={{ height: '6px' }}>
                    <div className="laura-progress-fill" style={{ width: `${m.val}%`, background: m.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLONNE DROITE (Latérale) */}
        <div className="laura-page-aside" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          
          {/* RECOMMANDATIONS */}
          <div className="laura-card-soft">
            <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-5)' }}>Recommandations pour vous</h3>
            {recommandations.length === 0 ? (
              <div className="laura-empty">Aucune ressource recommandée pour le moment.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {recommandations.map((r, i) => (
                  <li key={i} onClick={() => r.url ? window.open(r.url, '_blank') : navigate('/learn/chat')} className="laura-card" style={{ padding: 'var(--sp-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', transition: 'transform 0.2s', boxShadow: 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <span style={{ fontSize: '1.5rem' }}>{r.icon}</span> <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--laura-text-1)' }}>{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* PROFIL ACADÉMIQUE */}
          <div className="laura-card">
            <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-5)' }}>Profil Académique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--laura-border-soft)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--laura-text-2)' }}>Profil</span><span style={{ fontWeight: 600 }}>{user.roleLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--laura-border-soft)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--laura-text-2)' }}>Niveau</span><span style={{ fontWeight: 600 }}>{user.niveau} {user.serie ? `(${user.serie})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--laura-border-soft)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--laura-text-2)' }}>Examen</span><span style={{ fontWeight: 600 }}>{user.examen}</span>
              </div>
            </div>
            <button onClick={() => navigate('/learn/profile')} className="laura-btn laura-btn-ghost" style={{ width: '100%', marginTop: 'var(--sp-5)' }}>
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

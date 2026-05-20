import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

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

export default function LearnRevisionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [sessionConfig, setSessionConfig] = useState({
    matiere: '', chapitre: '', type: 'Resume', duree: '30'
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [matieresList, setMatieresList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      // Fetch matieres from adminSettings
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        const fetchedMatieres = docSnap.exists() && docSnap.data().matieres ? docSnap.data().matieres : [];
        const filtered = filterMatieres(fetchedMatieres, userProfile);
        setMatieresList(filtered);
      } catch (err) {
        console.error("Erreur chargement matières:", err);
      }

      // Fetch recent sessions
      if (!userProfile?.uid) return;
      try {
        const sessionsSnap = await getDocs(collection(db, 'users', userProfile.uid, 'sessions'));
        const docs = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecentSessions(docs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3));
      } catch (err) {
        console.error("Erreur de récupération des sessions de révision :", err);
      }
    }
    fetchInitialData();
  }, [userProfile?.uid]);

  const handleChange = (e) => setSessionConfig({ ...sessionConfig, [e.target.name]: e.target.value });

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!sessionConfig.matiere || !sessionConfig.chapitre) {
      alert(t('learn.revision.new_session.alert_missing', "Veuillez renseigner la matière et le chapitre à réviser."));
      return;
    }

    setIsLoading(true);
    const sessionObj = {
      ...sessionConfig,
      status: 'En cours',
      createdAt: new Date().toISOString()
    };

    if (userProfile?.uid) {
      try {
        const docRef = await addDoc(collection(db, 'users', userProfile.uid, 'sessions'), sessionObj);
        navigate(`/learn/chat?sessionId=${docRef.id}&matiere=${encodeURIComponent(sessionConfig.matiere)}&chapitre=${encodeURIComponent(sessionConfig.chapitre)}&type=${encodeURIComponent(sessionConfig.type)}`);
      } catch (err) {
        console.error("Erreur lors de la création de la session :", err);
        alert(t('learn.revision.new_session.alert_error', "Erreur de création de la session."));
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate(`/learn/chat?matiere=${encodeURIComponent(sessionConfig.matiere)}&chapitre=${encodeURIComponent(sessionConfig.chapitre)}`);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>{t('learn.revision.title', 'Révision Guidée')}</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          {t('learn.revision.subtitle', 'Configurez votre session de révision avec LAURA selon le programme officiel.')}
        </p>
      </div>

      <div className="asymmetrical-grid">
        
        {/* CONFIGURATION DE LA SESSION */}
        <div className="learn-card">
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 2rem 0', fontWeight: 800 }}>{t('learn.revision.new_session.title', 'Nouvelle session')}</h2>
          
          <form onSubmit={handleStartSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-grid">
              <div>
                <label>{t('learn.revision.new_session.subject', 'Matière (Programme Officiel) *')}</label>
                <select name="matiere" required value={sessionConfig.matiere} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="">{t('learn.revision.new_session.subject_placeholder', 'Sélectionner')}</option>
                  {matieresList.map(m => (
                    <option key={m.id} value={m.nom}>
                      {m.nom} ({m.niveau || 'Lycée'} - Série {m.serie || 'Toutes'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>{t('learn.revision.new_session.chapter', 'Chapitre *')}</label>
                <input type="text" name="chapitre" required placeholder={t('learn.revision.new_session.chapter_placeholder', 'ex: Nombres complexes')} value={sessionConfig.chapitre} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label>{t('learn.revision.new_session.type', 'Type de session')}</label>
                <select name="type" value={sessionConfig.type} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="Resume">{t('learn.revision.new_session.type_summary', 'Résumé de cours')}</option>
                  <option value="Quiz">{t('learn.revision.new_session.type_quiz', 'Générer un Quiz')}</option>
                  <option value="Exercice">{t('learn.revision.new_session.type_exercise', "Résolution d'exercice")}</option>
                  <option value="Examen">{t('learn.revision.new_session.type_exam', 'Préparation Examen')}</option>
                </select>
              </div>
              <div>
                <label>{t('learn.revision.new_session.duration', 'Durée souhaitée (minutes)')}</label>
                <select name="duree" value={sessionConfig.duree} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="15">{t('learn.revision.new_session.duration_15', '15 min (Rapide)')}</option><option value="30">{t('learn.revision.new_session.duration_30', '30 min (Standard)')}</option><option value="60">{t('learn.revision.new_session.duration_60', '1h (Approfondi)')}</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="primary" style={{ width: '100%', height: '36px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isLoading ? t('learn.revision.new_session.start_loading', 'Démarrage en cours...') : t('learn.revision.new_session.start_btn', 'Démarrer la session')}
            </button>
          </form>
        </div>

        {/* SESSIONS RÉCENTES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="learn-card" style={{ background: '#1A1A1A', color: 'white' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', fontWeight: 500, color: 'white' }}>{t('learn.revision.help.title', "Besoin d'aide ?")}</h3>
            <p style={{ color: '#94A3B8', fontSize: '12px', lineHeight: 1.5, marginBottom: '1rem' }}>
              {t('learn.revision.help.desc', "Vous ne savez pas par quoi commencer ? Demandez à LAURA de créer un programme de révision sur mesure.")}
            </p>
            <button onClick={() => navigate('/learn/chat?prompt=programme_revision')} style={{ width: '100%', height: '32px', background: 'white', color: '#1A1A1A', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
              {t('learn.revision.help.btn', 'Demander à LAURA')}
            </button>
          </div>
 
          <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1rem 0.5rem 1rem' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{t('learn.revision.resume.title', 'Reprendre une session')}</h3>
            </div>
            <div className="divider" />
            {recentSessions.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6E6E6B', padding: '1rem' }}>{t('learn.revision.resume.empty', 'Aucune session récente inachevée.')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentSessions.map(session => (
                  <div 
                    key={session.id} 
                    className="minimal-list-item" 
                    onClick={() => navigate(`/learn/chat?sessionId=${session.id}&matiere=${encodeURIComponent(session.matiere)}&chapitre=${encodeURIComponent(session.chapitre)}`)}
                  >
                    <div className="minimal-list-item-content">
                      <div className="minimal-list-item-title">{session.type} : {session.chapitre}</div>
                      <div className="minimal-list-item-subtitle">{session.matiere} · {session.duree} min</div>
                    </div>
                    <span className="chevron-action">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

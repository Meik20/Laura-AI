import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';

export default function LearnRevisionPage() {
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
        if (docSnap.exists() && docSnap.data().matieres) {
          setMatieresList(docSnap.data().matieres);
        } else {
          setMatieresList([
            { id: 'm1', nom: 'Mathématiques', niveau: 'Lycée', serie: 'Toutes' },
            { id: 'm2', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI' },
            { id: 'm3', nom: 'SVT', niveau: 'Lycée', serie: 'C, D' },
            { id: 'm4', nom: 'Philosophie', niveau: 'Lycée', serie: 'Toutes' },
            { id: 'm5', nom: 'Français', niveau: 'Lycée', serie: 'Toutes' },
            { id: 'm6', nom: 'Histoire-Géo', niveau: 'Lycée', serie: 'A, C, D' },
            { id: 'm7', nom: 'Économie', niveau: 'Lycée', serie: 'SES' }
          ]);
        }
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
      alert("Veuillez renseigner la matière et le chapitre à réviser.");
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
        alert("Erreur de création de la session.");
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate(`/learn/chat?matiere=${encodeURIComponent(sessionConfig.matiere)}&chapitre=${encodeURIComponent(sessionConfig.chapitre)}`);
    }
  };

  const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Révision Guidée</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Configurez votre session de révision avec LAURA selon le programme officiel.
        </p>
      </div>

      <div className="asymmetrical-grid">
        
        {/* CONFIGURATION DE LA SESSION */}
        <div className="learn-card">
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 2rem 0', fontWeight: 800 }}>Nouvelle session</h2>
          
          <form onSubmit={handleStartSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-grid">
              <div>
                <label style={labelStyle}>Matière (Programme Officiel) *</label>
                <select name="matiere" required value={sessionConfig.matiere} onChange={handleChange} style={inputStyle}>
                  <option value="">Sélectionner</option>
                  {matieresList.map(m => (
                    <option key={m.id} value={m.nom}>
                      {m.nom} ({m.niveau || 'Lycée'} - Série {m.serie || 'Toutes'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chapitre *</label>
                <input type="text" name="chapitre" required placeholder="ex: Nombres complexes" value={sessionConfig.chapitre} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label style={labelStyle}>Type de session</label>
                <select name="type" value={sessionConfig.type} onChange={handleChange} style={inputStyle}>
                  <option value="Resume">Résumé de cours</option>
                  <option value="Quiz">Générer un Quiz</option>
                  <option value="Exercice">Résolution d'exercice</option>
                  <option value="Examen">Préparation Examen</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Durée souhaitée (minutes)</label>
                <select name="duree" value={sessionConfig.duree} onChange={handleChange} style={inputStyle}>
                  <option value="15">15 min (Rapide)</option><option value="30">30 min (Standard)</option><option value="60">1h (Approfondi)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: isLoading ? '#6E6E6B' : '#00D4AA', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => !isLoading && (e.currentTarget.style.background = '#00B894')} onMouseLeave={e => !isLoading && (e.currentTarget.style.background = '#00D4AA')}>
              {isLoading ? 'Démarrage en cours...' : 'Démarrer la session'}
            </button>
          </form>
        </div>

        {/* SESSIONS RÉCENTES & ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#1A1A1A', color: 'white', padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700 }}>Besoin d'aide ?</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Vous ne savez pas par quoi commencer ? Demandez à LAURA de créer un programme de révision sur mesure.
            </p>
            <button onClick={() => navigate('/learn/chat?prompt=programme_revision')} style={{ width: '100%', padding: '0.8rem', background: 'white', color: '#1A1A1A', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F5F4EF'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              Demander à LAURA
            </button>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#444' }}>Reprendre une session</h3>
            {recentSessions.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#6E6E6B', padding: '0.5rem 0' }}>Aucune session récente inachevée.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {recentSessions.map(session => (
                  <button key={session.id} onClick={() => navigate(`/learn/chat?sessionId=${session.id}&matiere=${encodeURIComponent(session.matiere)}&chapitre=${encodeURIComponent(session.chapitre)}`)} style={{ textAlign: 'left', padding: '1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.75rem', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#1A1A1A'} onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E2'}>
                    <div style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: '0.3rem' }}>{session.type} : {session.chapitre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6E6E6B' }}>{session.matiere} · {session.duree} min</div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

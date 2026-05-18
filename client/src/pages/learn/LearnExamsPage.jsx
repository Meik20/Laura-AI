import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function LearnExamsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [examResources, setExamResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const profileContext = {
    examen: userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || 'BAC',
    niveau: userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || 'Terminale',
    serie: userProfile?.serie || '',
    filiere: userProfile?.filiere || userProfile?.discipline || ''
  };

  useEffect(() => {
    async function fetchExamData() {
      try {
        const snap = await getDocs(collection(db, 'resources'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = docs.filter(r => r.statut === 'publie' && (r.type === 'Annale' || r.type === 'Épreuve' || r.type === 'Examen'));
        setExamResources(filtered);
      } catch (err) {
        console.error("Erreur de récupération des annales :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExamData();
  }, []);

  const actionStyle = {
    flex: 1, padding: '1.5rem', background: 'white', border: '1px solid #E5E5E2', 
    borderRadius: '1.2rem', textAlign: 'center', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  // Filtrer les annales recommandées pour l'examen actuel
  const recommendedAnnales = examResources.filter(r => !profileContext.examen || r.cible?.toLowerCase().includes(profileContext.examen.toLowerCase()) || r.titre?.toLowerCase().includes(profileContext.examen.toLowerCase())).slice(0, 5);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Préparation aux examens</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Objectif actuel : <strong style={{ color: '#1A1A1A' }}>{profileContext.examen} {profileContext.serie ? `(${profileContext.serie})` : ''}</strong>
          </p>
        </div>
      </div>

      {/* OUTILS PRINCIPAUX */}
      <div className="tools-grid">
        <button onClick={() => navigate('/learn/resources?type=Annale')} style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>📚</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Annales</span>
        </button>
        <button onClick={() => navigate('/learn/chat?prompt=sujets_frequents')} style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>🎯</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Sujets fréquents</span>
        </button>
        <button onClick={() => navigate('/learn/chat?prompt=corriges_types')} style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>✅</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Corrigés</span>
        </button>
        <button onClick={() => navigate('/learn/chat?prompt=simulation_examen')} style={actionStyle} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: '2.5rem' }}>⏱️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A1A' }}>Simulation</span>
        </button>
      </div>

      <div className="two-column-grid">
        
        {/* ANNALES RECOMMANDÉES */}
        <div className="learn-card">
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Annales recommandées</h2>
          {isLoading ? (
            <div style={{ color: '#6E6E6B', padding: '1rem 0' }}>Chargement des annales...</div>
          ) : recommendedAnnales.length === 0 ? (
            <div style={{ color: '#6E6E6B', padding: '1rem 0', fontSize: '0.95rem' }}>Aucune annale spécifique trouvée. Explorez le catalogue complet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendedAnnales.map((annale) => (
                <li key={annale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F5F4EF', borderRadius: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: '0.2rem' }}>{annale.titre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6E6E6B' }}>{annale.cible} · {annale.type}</div>
                  </div>
                  <button onClick={() => annale.url ? window.open(annale.url, '_blank') : navigate(`/learn/chat?resourceTitle=${encodeURIComponent(annale.titre)}`)} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                    Ouvrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PRÉPARATION GUIDÉE */}
        <div className="learn-card">
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Préparation Guidée</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => navigate('/learn/chat?prompt=plan_preparation')} style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#E0F2FE', color: '#0369A1', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span> Demander un plan de préparation à LAURA
            </button>
            <button onClick={() => navigate('/learn/chat?prompt=sujets_frequents')} style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>
              <span style={{ fontSize: '1.5rem' }}>🔍</span> Réviser les sujets qui tombent souvent
            </button>
            <button onClick={() => navigate('/learn/chat?prompt=simulation_examen')} style={{ width: '100%', padding: '1.2rem', textAlign: 'left', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>
              <span style={{ fontSize: '1.5rem' }}>📝</span> Lancer une simulation en condition réelle
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

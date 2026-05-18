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

  // Filtrer les annales recommandées pour l'examen actuel
  const recommendedAnnales = examResources.filter(r => !profileContext.examen || r.cible?.toLowerCase().includes(profileContext.examen.toLowerCase()) || r.titre?.toLowerCase().includes(profileContext.examen.toLowerCase())).slice(0, 5);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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
      <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="minimal-list-item" onClick={() => navigate('/learn/resources?type=Annale')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">📚 Bibliothèque d'Annales</div>
            <div className="minimal-list-item-subtitle">Accéder aux sujets officiels d'examens des années précédentes</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=sujets_frequents')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">🎯 Sujets fréquents</div>
            <div className="minimal-list-item-subtitle">Consulter les thématiques qui tombent le plus souvent à l'examen</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=corriges_types')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">✅ Corrigés types</div>
            <div className="minimal-list-item-subtitle">Analyser les corrigés et critères de correction officiels</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=simulation_examen')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">⏱️ Simulation chronométrée</div>
            <div className="minimal-list-item-subtitle">S'entraîner en temps réel avec des conditions d'examen réelles</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
      </div>

      <div className="two-column-grid">
        
        {/* ANNALES RECOMMANDÉES */}
        <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1rem 0.5rem 1rem' }}>
            <h2 style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>Annales recommandées</h2>
          </div>
          <div className="divider" />
          {isLoading ? (
            <div style={{ color: '#6E6E6B', padding: '1rem' }}>Chargement des annales...</div>
          ) : recommendedAnnales.length === 0 ? (
            <div style={{ color: '#6E6E6B', padding: '1rem', fontSize: '0.95rem' }}>Aucune annale spécifique trouvée. Explorez le catalogue complet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recommendedAnnales.map((annale) => (
                <div 
                  key={annale.id} 
                  className="minimal-list-item" 
                  onClick={() => annale.url ? window.open(annale.url, '_blank') : navigate(`/learn/chat?resourceTitle=${encodeURIComponent(annale.titre)}`)}
                >
                  <div className="minimal-list-item-content">
                    <div className="minimal-list-item-title">📝 {annale.titre}</div>
                    <div className="minimal-list-item-subtitle">{annale.cible} · {annale.type}</div>
                  </div>
                  <span className="chevron-action">→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRÉPARATION GUIDÉE */}
        <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1rem 0.5rem 1rem' }}>
            <h2 style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>Préparation Guidée</h2>
          </div>
          <div className="divider" />
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=plan_preparation')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">🤖 Plan personnalisé</div>
              <div className="minimal-list-item-subtitle">Demander un plan de préparation sur mesure à LAURA</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=sujets_frequents')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">🔍 Sujets fréquents</div>
              <div className="minimal-list-item-subtitle">Réviser les sujets récurrents dans votre série</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=simulation_examen')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">✍️ Simulation d'examen</div>
              <div className="minimal-list-item-subtitle">Lancer une simulation complète en situation réelle</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
        </div>

      </div>

    </div>
  );
}

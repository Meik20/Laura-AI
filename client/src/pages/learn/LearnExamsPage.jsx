import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LearnExamsPage() {
  const { t } = useTranslation();
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
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>{t('learn.exams.title')}</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            {t('learn.exams.subtitle')} <strong style={{ color: '#1A1A1A' }}>{profileContext.examen} {profileContext.serie ? `(${profileContext.serie})` : ''}</strong>
          </p>
        </div>
      </div>

      {/* OUTILS PRINCIPAUX */}
      <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="minimal-list-item" onClick={() => navigate('/learn/resources?type=Annale')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">{t('learn.exams.tools.library.title')}</div>
            <div className="minimal-list-item-subtitle">{t('learn.exams.tools.library.desc')}</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=sujets_frequents')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">{t('learn.exams.tools.frequent.title')}</div>
            <div className="minimal-list-item-subtitle">{t('learn.exams.tools.frequent.desc')}</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=corriges_types')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">{t('learn.exams.tools.answers.title')}</div>
            <div className="minimal-list-item-subtitle">{t('learn.exams.tools.answers.desc')}</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
        <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=simulation_examen')}>
          <div className="minimal-list-item-content">
            <div className="minimal-list-item-title">{t('learn.exams.tools.simulation.title')}</div>
            <div className="minimal-list-item-subtitle">{t('learn.exams.tools.simulation.desc')}</div>
          </div>
          <span className="chevron-action">→</span>
        </div>
      </div>

      <div className="two-column-grid">
        {/* ANNALES RECOMMANDÉES */}
        <div className="learn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1rem 0.5rem 1rem' }}>
            <h2 style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>{t('learn.exams.recommended.title')}</h2>
          </div>
          <div className="divider" />
          {isLoading ? (
            <div style={{ color: '#6E6E6B', padding: '1rem' }}>{t('learn.exams.recommended.loading')}</div>
          ) : recommendedAnnales.length === 0 ? (
            <div style={{ color: '#6E6E6B', padding: '1rem', fontSize: '0.95rem' }}>{t('learn.exams.recommended.empty')}</div>
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
            <h2 style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>{t('learn.exams.guided.title')}</h2>
          </div>
          <div className="divider" />
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=plan_preparation')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">{t('learn.exams.guided.plan.title')}</div>
              <div className="minimal-list-item-subtitle">{t('learn.exams.guided.plan.desc')}</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=sujets_frequents')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">{t('learn.exams.guided.frequent.title')}</div>
              <div className="minimal-list-item-subtitle">{t('learn.exams.guided.frequent.desc')}</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
          <div className="minimal-list-item" onClick={() => navigate('/learn/chat?prompt=simulation_examen')}>
            <div className="minimal-list-item-content">
              <div className="minimal-list-item-title">{t('learn.exams.guided.simulation.title')}</div>
              <div className="minimal-list-item-subtitle">{t('learn.exams.guided.simulation.desc')}</div>
            </div>
            <span className="chevron-action">→</span>
          </div>
        </div>
      </div>

    </div>
  );
}

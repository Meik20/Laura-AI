import { useState } from 'react';
import LearningGoalModal from '../../components/dashboard/LearningGoalModal';
import { useAuth } from '../../hooks/useAuth';

export default function LearnDashboardPage() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState({
    title: 'Aucun objectif défini',
    period: 'Non définie',
    progress: 0
  });

  const { userProfile } = useAuth();

  // Utilisation sécurisée au cas où le profil met du temps à charger
  const user = {
    prenom: userProfile?.prenom || 'Apprenant',
    roleLabel: userProfile?.roleLabel || 'Élève',
    niveau: userProfile?.niveau || 'Non défini',
    examen: userProfile?.examen || 'Non défini'
  };

  const handleSaveGoal = (newGoal) => {
    setCurrentGoal({
      title: newGoal.title,
      period: `du ${newGoal.dateDebut} au ${newGoal.dateFin}`,
      progress: 0
    });
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
        <button style={{ padding: '0.8rem 1.5rem', background: '#00D4AA', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              {['Parler à LAURA AI', 'Réviser un chapitre', 'Lancer un quiz', 'Préparer mon examen', 'Voir mes ressources'].map((action, i) => (
                <button key={i} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.8rem 1.2rem', borderRadius: '0.75rem', fontWeight: 600, color: '#1A1A1A', cursor: 'pointer', flex: '1 1 calc(33% - 1rem)', textAlign: 'center' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* PROGRESSION DÉTAILLÉE */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Ma progression par matière</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { mat: 'Mathématiques', val: 68, color: '#7C6FFF' },
                { mat: 'Physique-Chimie', val: 40, color: '#F59E0B' },
                { mat: 'SVT', val: 55, color: '#00D4AA' }
              ].map((m, i) => (
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📐</span> <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Réviser les Suites numériques</span>
              </li>
              <li style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎲</span> <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quiz Probabilités</span>
              </li>
              <li style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📝</span> <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Annale BAC Maths 2023</span>
              </li>
            </ul>
          </div>

          {/* PROFIL ACADÉMIQUE */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Profil Académique</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Profil</span><span style={{ fontWeight: 600 }}>{user.roleLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Classe / Niveau</span><span style={{ fontWeight: 600 }}>{user.niveau}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#6E6E6B' }}>Examen préparé</span><span style={{ fontWeight: 600 }}>{user.examen}</span>
              </div>
            </div>
            <button style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', background: 'transparent', border: '1px solid #E5E5E2', borderRadius: '0.6rem', fontWeight: 600, cursor: 'pointer' }}>
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

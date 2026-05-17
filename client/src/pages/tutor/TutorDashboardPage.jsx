import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function TutorDashboardPage() {
  const { userProfile } = useAuth();

  const tutorData = {
    nom: userProfile?.nom || 'Tuteur',
    statut: userProfile?.statut || 'En attente', // "Validé" ou "Contributeur"
    discipline: userProfile?.filiere || 'Général',
    messagesAdmin: 0
  };

  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Bonjour Pr. {tutorData.nom}</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Espace de préparation pédagogique · <strong style={{ color: '#1A1A1A' }}>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" style={{ padding: '0.8rem 1.5rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span>💬</span> Chat Pédagogique
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* COLONNE GAUCHE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* STATUT ET DROITS (Point 14.4) */}
          <div style={{ ...cardStyle, background: tutorData.statut === 'Contributeur' ? '#ECFDF5' : '#F5F4EF', border: tutorData.statut === 'Contributeur' ? '1px solid #A7F3D0' : '1px solid #E5E5E2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800, color: '#065F46' }}>Statut de votre compte</h2>
              <span style={{ background: tutorData.statut === 'Contributeur' ? '#10B981' : '#6B7280', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>
                {tutorData.statut}
              </span>
            </div>
            {tutorData.statut === 'Contributeur' ? (
              <p style={{ color: '#047857', margin: 0, lineHeight: 1.5 }}>
                Vous disposez des droits complets. Vous pouvez concevoir, soumettre et modifier des contenus pédagogiques sur la plateforme.
              </p>
            ) : (
              <p style={{ color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Votre compte est validé pour l'usage personnel. <strong style={{ color: '#1A1A1A' }}>Demandez le statut Contributeur</strong> pour soumettre vos propres exercices à la communauté.
              </p>
            )}
            {tutorData.statut !== 'Contributeur' && (
              <button style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Demander les droits contributeur
              </button>
            )}
          </div>

          {/* OUTILS PÉDAGOGIQUES (Point 14.2) */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Boîte à outils pédagogique</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Link to="/tutor/chat" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '1.5rem', borderRadius: '1rem', textDecoration: 'none', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Générer un plan de cours</strong>
                <span style={{ fontSize: '0.9rem', color: '#6E6E6B' }}>Utilisez l'IA pour structurer vos leçons.</span>
              </Link>
              <Link to="/tutor/submissions" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '1.5rem', borderRadius: '1rem', textDecoration: 'none', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📤</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Soumettre un contenu</strong>
                <span style={{ fontSize: '0.9rem', color: '#6E6E6B' }}>Partagez vos quiz et exercices.</span>
              </Link>
            </div>
          </div>

        </div>

        {/* COLONNE DROITE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* MESSAGES ADMIN */}
          <div style={{ ...cardStyle, background: '#1A1A1A', color: 'white' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', fontWeight: 800 }}>Messages Admin</h2>
            {tutorData.messagesAdmin > 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.75rem', borderLeft: '3px solid #00D4AA' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.3rem', color: '#00D4AA' }}>Soumission révisée</strong>
                <span style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.4 }}>L'admin a laissé un commentaire sur votre "Quiz sur les probabilités".</span>
              </div>
            ) : (
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>Aucun nouveau message.</p>
            )}
          </div>

          {/* RÉSUMÉ SOUMISSIONS */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Vos soumissions</h2>
              <Link to="/tutor/submissions" style={{ fontSize: '0.9rem', color: '#00A37A', fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>Brouillons</span>
                <span style={{ fontWeight: 700 }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>En revue</span>
                <span style={{ fontWeight: 700, color: '#F59E0B' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>Validés (Publiés)</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>0</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

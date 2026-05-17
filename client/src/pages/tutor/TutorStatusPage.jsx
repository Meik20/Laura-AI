import { Link } from 'react-router-dom';

export default function TutorStatusPage() {
  // Simuler les données depuis Firestore (Specs 6.0)
  const applicationData = {
    nom: 'Doe',
    discipline: 'Mathématiques',
    date: '17 Mai 2026',
    status: 'en_examen', // reçu, en_examen, test_requis, valide, refuse, active
    messageAdmin: 'Votre dossier est actuellement en cours d\'analyse par notre équipe pédagogique.'
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'recu': return { bg: '#E5E7EB', text: '#374151', label: 'Reçu' };
      case 'en_examen': return { bg: '#FEF3C7', text: '#92400E', label: 'En examen' };
      case 'test_requis': return { bg: '#E0E7FF', text: '#3730A3', label: 'Test requis' };
      case 'valide': return { bg: '#D1FAE5', text: '#065F46', label: 'Validé' };
      case 'active': return { bg: '#10B981', text: '#FFFFFF', label: 'Compte Activé' };
      case 'refuse': return { bg: '#FEE2E2', text: '#B91C1C', label: 'Refusé' };
      default: return { bg: '#E5E7EB', text: '#374151', label: 'Inconnu' };
    }
  };

  const statusStyle = getStatusColor(applicationData.status);

  return (
    <div style={{ padding: '4rem 2rem', background: '#F9F9F8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '3.5rem', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #E5E5E2', textAlign: 'center' }}>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Suivi de candidature</h1>

        <div style={{ background: '#F5F4EF', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '1rem' }}>
            <span style={{ color: '#6E6E6B', fontWeight: 600 }}>Candidat</span>
            <span style={{ fontWeight: 700 }}>M. {applicationData.nom}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '1rem' }}>
            <span style={{ color: '#6E6E6B', fontWeight: 600 }}>Discipline</span>
            <span style={{ fontWeight: 700 }}>{applicationData.discipline}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '1rem' }}>
            <span style={{ color: '#6E6E6B', fontWeight: 600 }}>Date de soumission</span>
            <span style={{ fontWeight: 700 }}>{applicationData.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#6E6E6B', fontWeight: 600 }}>Statut actuel</span>
            <span style={{ background: statusStyle.bg, color: statusStyle.text, padding: '0.4rem 1rem', borderRadius: '2rem', fontWeight: 700, fontSize: '0.9rem' }}>
              {statusStyle.label}
            </span>
          </div>
        </div>

        {applicationData.messageAdmin && (
          <div style={{ background: '#E0F2FE', color: '#0369A1', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'left', border: '1px solid #BAE6FD' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Message de l'administration :</strong>
            {applicationData.messageAdmin}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {applicationData.status === 'test_requis' && (
            <button style={{ padding: '1rem 2rem', background: '#3730A3', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              Commencer le test d'évaluation
            </button>
          )}
          {applicationData.status === 'active' && (
            <Link to="/tutor/dashboard" style={{ padding: '1rem 2rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
              Accéder à mon espace
            </Link>
          )}
          <Link to="/" style={{ padding: '1rem 2rem', background: '#F5F4EF', color: '#1A1A1A', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
            Retour à l'accueil
          </Link>
        </div>

      </div>
    </div>
  );
}

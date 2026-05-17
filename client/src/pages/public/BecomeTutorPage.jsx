import { Link } from 'react-router-dom';

export default function BecomeTutorPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Devenez tuteur sur LAURA</h1>
        <p style={{ fontSize: '1.2rem', color: '#6E6E6B', lineHeight: 1.6 }}>
          Rejoignez LAURA en tant que tuteur après étude de votre profil, validation de vos compétences et activation par l’administration.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/tutor/apply" style={{ background: '#1A1A1A', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
            Candidater comme tuteur
          </Link>
          <button style={{ background: 'white', color: '#1A1A1A', border: '1px solid #E5E5E2', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            J'ai déjà une invitation
          </button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Comment ça marche ?</h3>
        <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#444' }}>
          <li>Vous soumettez votre candidature avec vos justificatifs.</li>
          <li>Votre dossier est examiné minutieusement par notre équipe.</li>
          <li>Un test de validation de compétences peut être requis.</li>
          <li>Votre compte est activé pour l'accès Tuteur de base.</li>
          <li>Des droits de contribution avancés peuvent être accordés séparément.</li>
        </ol>
      </div>

      <div style={{ background: '#F5F4EF', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Différence entre Tuteur Validé et Contributeur</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>Tuteur Validé</h4>
            <ul style={{ paddingLeft: '1.5rem', color: '#6E6E6B', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              <li>Accès à l'espace tuteur</li>
              <li>Usage pédagogique avancé de LAURA</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#00A37A' }}>Tuteur Contributeur</h4>
            <ul style={{ paddingLeft: '1.5rem', color: '#6E6E6B', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              <li>Peut soumettre des contenus (exercices, quiz)</li>
              <li>Peut enrichir officiellement la plateforme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

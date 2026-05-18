import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function BecomeTutorPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleValidateCode = (e) => {
    e.preventDefault();
    setError('');
    const cleanCode = inviteCode.trim().toUpperCase();
    
    // Codes d'invitation valides
    const validCodes = ['LAURA2026', 'LAURA-TUTOR', 'CAMEROON-EDU', 'MEIK20'];
    
    if (validCodes.includes(cleanCode)) {
      setShowModal(false);
      navigate(`/tutor/apply?code=${cleanCode}`);
    } else {
      setError("Code d'invitation invalide ou expiré.");
    }
  };

  return (
    <div className="tutor-apply-container">
      
      {/* MODAL INVITATION */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Entrez votre code</h3>
              <p style={{ margin: 0, color: '#6E6E6B', fontSize: '0.9rem' }}>Saisissez le code d'invitation fourni par l'administration.</p>
            </div>
            
            {error && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.8rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleValidateCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Ex: LAURA2026" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)} 
                style={{ width: '100%', padding: '0.9rem', borderRadius: '0.6rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
              />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setError(''); setInviteCode(''); }} 
                  style={{ flex: 1, padding: '0.8rem', background: '#F5F4EF', color: '#1A1A1A', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '0.8rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Devenez tuteur sur LAURA</h1>
        <p style={{ fontSize: '1.2rem', color: '#6E6E6B', lineHeight: 1.6 }}>
          Rejoignez LAURA en tant que tuteur après étude de votre profil, validation de vos compétences et activation par l’administration.
        </p>
        <div className="tutor-buttons-row">
          <Link to="/tutor/apply" style={{ background: '#1A1A1A', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
            Candidater comme tuteur
          </Link>
          <button 
            onClick={() => setShowModal(true)}
            style={{ background: 'white', color: '#1A1A1A', border: '1px solid #E5E5E2', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
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
        <div className="tutor-grid">
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

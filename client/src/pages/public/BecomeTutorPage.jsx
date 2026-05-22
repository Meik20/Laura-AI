import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateInvitationCode } from '../../services/adminService';

export default function BecomeTutorPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);
    
    const cleanCode = inviteCode.trim().toUpperCase();
    
    try {
      const result = await validateInvitationCode(cleanCode);
      
      if (result.valid) {
        setShowModal(false);
        navigate(`/tutor/apply?code=${cleanCode}`);
      } else {
        setError(result.message || "Code d'invitation invalide ou expiré.");
      }
    } catch (err) {
      console.error('Error validating code:', err);
      setError("Une erreur est survenue lors de la validation du code. Veuillez réessayer.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="tutor-apply-container">
      
      {/* MODAL INVITATION */}
      {showModal && (
        <div className="laura-modal-backdrop">
          <div className="laura-modal-card">
            <div>
              <h3>Entrez votre code</h3>
              <p className="auth-subtitle" style={{ marginBottom: 0 }}>Saisissez le code d'invitation fourni par l'administration.</p>
            </div>
            
            {error && (
              <div className="auth-error-alert">
                {error}
              </div>
            )}
            
            <form onSubmit={handleValidateCode} className="auth-form">
              <input 
                type="text" 
                placeholder="Ex: LAURA2026" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value)} 
                style={{ textTransform: 'uppercase' }}
              />
              
              <div className="apply-actions">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setError(''); setInviteCode(''); }} 
                  className="laura-btn laura-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="laura-btn laura-btn-primary"
                  style={{ flex: 2 }}
                  disabled={isValidating}
                >
                  {isValidating ? 'Vérification...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tutor-landing-hero">
        <h1>Devenez tuteur sur LAURA</h1>
        <p>
          Rejoignez LAURA en tant que tuteur après étude de votre profil, validation de vos compétences et activation par l’administration.
        </p>
        <div className="tutor-buttons-row">
          <Link to="/tutor/apply" className="laura-btn laura-btn-primary" style={{ padding: '0 2rem' }}>
            Candidater comme tuteur
          </Link>
          <button 
            onClick={() => setShowModal(true)}
            className="laura-btn laura-btn-secondary"
            style={{ padding: '0 2rem' }}
          >
            J'ai déjà une invitation
          </button>
        </div>
      </div>

      <div className="tutor-info-panel">
        <h3>Comment ça marche ?</h3>
        <ol>
          <li>Vous soumettez votre candidature avec vos justificatifs.</li>
          <li>Votre dossier est examiné minutieusement par notre équipe.</li>
          <li>Un test de validation de compétences peut être requis.</li>
          <li>Votre compte est activé pour l'accès Tuteur de base.</li>
          <li>Des droits de contribution avancés peuvent être accordés séparément.</li>
        </ol>
      </div>

      <div className="tutor-compare-panel">
        <h3>Différence entre Tuteur Validé et Contributeur</h3>
        <div className="tutor-compare-grid">
          <div className="tutor-compare-col tutor-compare-col--valid">
            <h4>Tuteur Validé</h4>
            <ul>
              <li>Accès à l'espace tuteur</li>
              <li>Usage pédagogique avancé de LAURA</li>
            </ul>
          </div>
          <div className="tutor-compare-col tutor-compare-col--contrib">
            <h4>Tuteur Contributeur</h4>
            <ul>
              <li>Peut soumettre des contenus (exercices, quiz)</li>
              <li>Peut enrichir officiellement la plateforme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

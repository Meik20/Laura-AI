import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export default function TutorApplyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  const { userProfile, signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', password: '', confirmPassword: '',
    discipline: '', niveau: '', experience: '', etablissement: '', diplome: '', competences: '',
    motivation: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }
    if (!formData.nom || !formData.email || !formData.discipline || !formData.motivation) {
      return setError('Veuillez remplir les champs obligatoires.');
    }

    setIsLoading(true);
    try {
      const profileData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        discipline: formData.discipline,
        niveau: formData.niveau,
        experience: formData.experience,
        etablissement: formData.etablissement,
        diplome: formData.diplome,
        competences: formData.competences,
        motivation: formData.motivation,
        roleLabel: inviteCode ? 'Tuteur Contributeur' : 'Tuteur',
        isTutorPending: !inviteCode,
        isTutor: !!inviteCode,
        statut: inviteCode ? 'Contributeur' : 'en_examen',
        role: inviteCode ? 'teacher' : 'student'
      };

      if (userProfile?.uid) {
        await setDoc(doc(db, 'users', userProfile.uid), {
          ...profileData,
          createdAt: userProfile.createdAt || new Date().toISOString()
        }, { merge: true });
      } else {
        if (!formData.password) {
          setError('Veuillez définir un mot de passe pour créer votre compte tuteur.');
          setIsLoading(false);
          return;
        }
        await signup(formData.email, formData.password, profileData);
      }

      navigate('/tutor/status');
    } catch (err) {
      console.error("Erreur candidature:", err);
      setError(err.message || 'Erreur lors de la soumission de la candidature.');
    } finally {
      setIsLoading(false);
    }
  };  return (
    <div className="auth-container">
      <div className="auth-card auth-card--apply">
        <h1>Candidature Tuteur</h1>
        
        {inviteCode ? (
          <div className="auth-info-alert">
            <span>✨</span>
            <span>Invitation validée ({inviteCode}). Votre compte tuteur sera instantanément activé à la création.</span>
          </div>
        ) : (
          <p className="auth-subtitle">Votre dossier sera examiné avant toute activation.</p>
        )}

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          
          {/* IDENTITÉ */}
          <div className="apply-section">
            <h3 className="apply-section-title">1. Identité & Connexion</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nom *</label>
                <input type="text" name="nom" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Prénom *</label>
                <input type="text" name="prenom" onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>Adresse mail *</label>
                <input type="email" name="email" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input type="text" name="telephone" onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input type="password" name="password" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Confirmation *</label>
                <input type="password" name="confirmPassword" onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* PROFIL PROFESSIONNEL */}
          <div className="apply-section">
            <h3 className="apply-section-title">2. Profil Professionnel</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Discipline / matière *</label>
                <input type="text" name="discipline" placeholder="ex: Mathématiques" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Niveau accompagné *</label>
                <input type="text" name="niveau" placeholder="ex: Lycée / BTS" onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>Années d'expérience</label>
                <input type="number" name="experience" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Établissement / structure</label>
                <input type="text" name="etablissement" onChange={handleChange} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="form-group">
                <label>Diplôme principal *</label>
                <input type="text" name="diplome" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Compétences (séparées par virgule)</label>
                <input type="text" name="competences" onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* ÉVALUATION */}
          <div className="apply-section">
            <h3 className="apply-section-title">3. Motivation & Justificatif</h3>
            <div className="form-group">
              <label>Pourquoi souhaitez-vous devenir tuteur ? *</label>
              <textarea name="motivation" rows="4" onChange={handleChange}></textarea>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
              <label>Pièce justificative (CV, Diplôme, Carte Pro) *</label>
              <input type="file" className="laura-input" style={{ background: 'var(--laura-bg-card)', padding: '8px 12px', minHeight: 'auto' }} />
            </div>
          </div>

          <div className="apply-actions">
            <Link to="/become-tutor" className="laura-btn laura-btn-secondary" style={{ flex: 1, textDecoration: 'none' }}>
              Annuler
            </Link>
            <button type="submit" disabled={isLoading} className="laura-btn laura-btn-primary" style={{ flex: 2 }}>
              {isLoading ? 'Envoi en cours...' : 'Soumettre ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

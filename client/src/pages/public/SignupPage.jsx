import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [profileType, setProfileType] = useState('eleve'); // 'eleve' | 'etudiant'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Champs Communs
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', confirmPassword: '',
    // Champs Élève
    classe: '', serie: '', examenEleve: '', langueEleve: 'Français', etablissementEleve: '',
    // Champs Étudiant
    niveauEtude: '', filiere: '', etablissementEtudiant: '', examenEtudiant: '', langueEtudiant: 'Français'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation métier (Point 3.7)
    if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
      return setError('Veuillez remplir tous les champs obligatoires.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }
    if (profileType === 'eleve' && !formData.examenEleve) {
      return setError('Veuillez sélectionner un examen préparé.');
    }
    if (profileType === 'etudiant' && (!formData.niveauEtude || !formData.filiere)) {
      return setError('Le niveau d\'étude et la filière sont obligatoires.');
    }

    setIsLoading(true);
    try {
      const profileData = {
        prenom: formData.prenom,
        nom: formData.nom,
        role: 'student', // rôle technique
        roleLabel: profileType === 'eleve' ? 'Élève' : 'Étudiant',
        niveau: profileType === 'eleve' ? formData.classe : formData.niveauEtude,
        serie: profileType === 'eleve' ? formData.serie : null,
        examen: profileType === 'eleve' ? formData.examenEleve : formData.examenEtudiant,
        filiere: profileType === 'etudiant' ? formData.filiere : null,
        etablissement: profileType === 'eleve' ? formData.etablissementEleve : formData.etablissementEtudiant,
        langue: profileType === 'eleve' ? formData.langueEleve : formData.langueEtudiant,
      };

      await signup(formData.email, formData.password, profileData);
      
      // Redirection après succès
      navigate('/learn/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--signup">
        <h1>Créer un compte apprenant</h1>
        <p className="auth-subtitle">Prêt à booster vos résultats scolaires ?</p>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          
          {/* IDENTITÉ COMMUNE */}
          <div className="form-grid">
            <div className="form-group">
              <label>Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Adresse mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Confirmation du mot de passe</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          </div>

          {/* SÉLECTION DU PROFIL */}
          <div className="profile-select-box">
            <label className="profile-select-label">Quel est votre profil ?</label>
            <div className="profile-radio-group">
              <label className={`profile-radio-label ${profileType === 'eleve' ? 'is-active' : ''}`}>
                <input type="radio" name="profileType" value="eleve" checked={profileType === 'eleve'} onChange={() => setProfileType('eleve')} /> Élève (Secondaire)
              </label>
              <label className={`profile-radio-label ${profileType === 'etudiant' ? 'is-active' : ''}`}>
                <input type="radio" name="profileType" value="etudiant" checked={profileType === 'etudiant'} onChange={() => setProfileType('etudiant')} /> Étudiant (Supérieur)
              </label>
            </div>
          </div>

          {/* CHAMPS SPÉCIFIQUES ÉLÈVE */}
          {profileType === 'eleve' && (
            <div className="profile-conditional-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label>Classe / niveau</label>
                  <select name="classe" value={formData.classe} onChange={handleChange}>
                    <option value="">Sélectionner</option><option value="6eme">6ème</option><option value="5eme">5ème</option><option value="4eme">4ème</option><option value="3eme">3ème</option><option value="2nde">2nde</option><option value="1ere">1ère</option><option value="Tle">Terminale</option>
                  </select>
                </div>
                {['2nde', '1ere', 'Tle'].includes(formData.classe) && (
                  <div className="form-group">
                    <label>Série (Points 3.6)</label>
                    <select name="serie" value={formData.serie} onChange={handleChange}>
                      <option value="">Sélectionner</option><option value="A1">A1</option><option value="A2">A2</option><option value="A3">A3</option><option value="A4">A4</option><option value="C">C</option><option value="D">D</option><option value="SES">SES / ES</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Examen préparé *</label>
                <select name="examenEleve" value={formData.examenEleve} onChange={handleChange}>
                  <option value="">Sélectionner</option><option value="BEPC">BEPC</option><option value="Probatoire">Probatoire</option><option value="BAC">BAC</option><option value="GCE O-Level">GCE O-Level</option><option value="GCE A-Level">GCE A-Level</option>
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Langue préférée</label>
                  <select name="langueEleve" value={formData.langueEleve} onChange={handleChange}>
                    <option>Français</option>
                    <option>Anglais</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Établissement</label>
                  <input type="text" name="etablissementEleve" value={formData.etablissementEleve} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* CHAMPS SPÉCIFIQUES ÉTUDIANT */}
          {profileType === 'etudiant' && (
            <div className="profile-conditional-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label>Niveau d'étude *</label>
                  <select name="niveauEtude" value={formData.niveauEtude} onChange={handleChange}>
                    <option value="">Sélectionner</option><option value="BTS">BTS / HND</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option><option value="Doctorat">Doctorat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Filière / domaine *</label>
                  <input type="text" name="filiere" value={formData.filiere} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Établissement</label>
                <input type="text" name="etablissementEtudiant" value={formData.etablissementEtudiant} onChange={handleChange} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Examen préparé (Optionnel)</label>
                  <input type="text" name="examenEtudiant" value={formData.examenEtudiant} onChange={handleChange} placeholder="ex: Partiels S2" />
                </div>
                <div className="form-group">
                  <label>Langue préférée</label>
                  <select name="langueEtudiant" value={formData.langueEtudiant} onChange={handleChange}>
                    <option>Français</option>
                    <option>Anglais</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Déjà inscrit ? <Link to="/login" className="auth-accent-link">Se connecter</Link></p>
          <p>Vous souhaitez devenir tuteur ? <Link to="/become-tutor" className="auth-underline-link">Devenez tuteur</Link></p>
        </div>
      </div>
    </div>
  );
}

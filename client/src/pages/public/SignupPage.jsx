import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      return setError(t('signup.error_required'));
    }
    if (formData.password !== formData.confirmPassword) {
      return setError(t('signup.error_password_match'));
    }
    if (profileType === 'eleve' && !formData.examenEleve) {
      return setError(t('signup.error_exam_required'));
    }
    if (profileType === 'etudiant' && (!formData.niveauEtude || !formData.filiere)) {
      return setError(t('signup.error_college_required'));
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
      setError(err.message || t('signup.error_signup_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--signup">
        <h1>{t('signup.title')}</h1>
        <p className="auth-subtitle">{t('signup.subtitle')}</p>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          
          {/* IDENTITÉ COMMUNE */}
          <div className="form-grid">
            <div className="form-group">
              <label>{t('signup.name')}</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>{t('signup.firstname')}</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>{t('signup.email')}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('signup.password')}</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>{t('signup.confirm_password')}</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          </div>

          {/* SÉLECTION DU PROFIL */}
          <div className="profile-select-box">
            <label className="profile-select-label">{t('signup.profile_question')}</label>
            <div className="profile-radio-group">
              <label className={`profile-radio-label ${profileType === 'eleve' ? 'is-active' : ''}`}>
                <input type="radio" name="profileType" value="eleve" checked={profileType === 'eleve'} onChange={() => setProfileType('eleve')} /> {t('signup.profile_student')}
              </label>
              <label className={`profile-radio-label ${profileType === 'etudiant' ? 'is-active' : ''}`}>
                <input type="radio" name="profileType" value="etudiant" checked={profileType === 'etudiant'} onChange={() => setProfileType('etudiant')} /> {t('signup.profile_college')}
              </label>
            </div>
          </div>

          {/* CHAMPS SPÉCIFIQUES ÉLÈVE */}
          {profileType === 'eleve' && (
            <div className="profile-conditional-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('signup.class_label')}</label>
                  <select name="classe" value={formData.classe} onChange={handleChange}>
                    <option value="">{t('signup.class_placeholder')}</option><option value="6eme">6ème</option><option value="5eme">5ème</option><option value="4eme">4ème</option><option value="3eme">3ème</option><option value="2nde">2nde</option><option value="1ere">1ère</option><option value="Tle">Terminale</option>
                  </select>
                </div>
                {['2nde', '1ere', 'Tle'].includes(formData.classe) && (
                  <div className="form-group">
                    <label>{t('signup.stream_label')}</label>
                    <select name="serie" value={formData.serie} onChange={handleChange}>
                      <option value="">{t('signup.class_placeholder')}</option><option value="A1">A1</option><option value="A2">A2</option><option value="A3">A3</option><option value="A4">A4</option><option value="C">C</option><option value="D">D</option><option value="SES">SES / ES</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>{t('signup.exam_label')}</label>
                <select name="examenEleve" value={formData.examenEleve} onChange={handleChange}>
                  <option value="">{t('signup.class_placeholder')}</option><option value="BEPC">BEPC</option><option value="Probatoire">Probatoire</option><option value="BAC">BAC</option><option value="GCE O-Level">GCE O-Level</option><option value="GCE A-Level">GCE A-Level</option>
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('signup.lang_label')}</label>
                  <select name="langueEleve" value={formData.langueEleve} onChange={handleChange}>
                    <option value="Français">{t('signup.lang_fr')}</option>
                    <option value="Anglais">{t('signup.lang_en')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('signup.school_label')}</label>
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
                  <label>{t('signup.level_label')}</label>
                  <select name="niveauEtude" value={formData.niveauEtude} onChange={handleChange}>
                    <option value="">{t('signup.class_placeholder')}</option><option value="BTS">BTS / HND</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option><option value="Doctorat">Doctorat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('signup.major_label')}</label>
                  <input type="text" name="filiere" value={formData.filiere} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('signup.school_label')}</label>
                <input type="text" name="etablissementEtudiant" value={formData.etablissementEtudiant} onChange={handleChange} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('signup.exam_optional_label')}</label>
                  <input type="text" name="examenEtudiant" value={formData.examenEtudiant} onChange={handleChange} placeholder={t('signup.exam_optional_placeholder')} />
                </div>
                <div className="form-group">
                  <label>{t('signup.lang_label')}</label>
                  <select name="langueEtudiant" value={formData.langueEtudiant} onChange={handleChange}>
                    <option value="Français">{t('signup.lang_fr')}</option>
                    <option value="Anglais">{t('signup.lang_en')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? t('signup.button_loading') : t('signup.button')}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>{t('signup.already_registered')} <Link to="/login" className="auth-accent-link">{t('signup.login_link')}</Link></p>
          <p>{t('auth.become_tutor_text')} <Link to="/become-tutor" className="auth-underline-link">{t('auth.become_tutor_link')}</Link></p>
        </div>
      </div>
    </div>
  );
}

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

  const inputStyle = { width: '100%', padding: '0.9rem', borderRadius: '0.6rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#444' };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
      <div style={{ background: 'white', padding: '3.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #E5E5E2' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1A1A1A' }}>Créer un compte apprenant</h1>
        <p style={{ textAlign: 'center', color: '#6E6E6B', marginBottom: '2.5rem' }}>Prêt à booster vos résultats scolaires ?</p>

        {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* IDENTITÉ COMMUNE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Nom</label><input type="text" name="nom" value={formData.nom} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Prénom</label><input type="text" name="prenom" value={formData.prenom} onChange={handleChange} style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Adresse mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Mot de passe</label><input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Confirmation du mot de passe</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} /></div>

          {/* SÉLECTION DU PROFIL (Point 3.3) */}
          <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: '#F5F4EF', borderRadius: '0.75rem' }}>
            <label style={{ ...labelStyle, fontSize: '1rem', marginBottom: '1rem' }}>Quel est votre profil ?</label>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: profileType === 'eleve' ? 700 : 500 }}>
                <input type="radio" name="profileType" value="eleve" checked={profileType === 'eleve'} onChange={() => setProfileType('eleve')} /> Élève (Secondaire)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: profileType === 'etudiant' ? 700 : 500 }}>
                <input type="radio" name="profileType" value="etudiant" checked={profileType === 'etudiant'} onChange={() => setProfileType('etudiant')} /> Étudiant (Supérieur)
              </label>
            </div>
          </div>

          {/* CHAMPS SPÉCIFIQUES ÉLÈVE (Point 3.4 & 3.6) */}
          {profileType === 'eleve' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem', borderLeft: '3px solid #7C6FFF' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Classe / niveau</label>
                  <select name="classe" value={formData.classe} onChange={handleChange} style={inputStyle}>
                    <option value="">Sélectionner</option><option value="6eme">6ème</option><option value="5eme">5ème</option><option value="4eme">4ème</option><option value="3eme">3ème</option><option value="2nde">2nde</option><option value="1ere">1ère</option><option value="Tle">Terminale</option>
                  </select>
                </div>
                {['2nde', '1ere', 'Tle'].includes(formData.classe) && (
                  <div>
                    <label style={labelStyle}>Série (Points 3.6)</label>
                    <select name="serie" value={formData.serie} onChange={handleChange} style={inputStyle}>
                      <option value="">Sélectionner</option><option value="A1">A1</option><option value="A2">A2</option><option value="A3">A3</option><option value="A4">A4</option><option value="C">C</option><option value="D">D</option><option value="SES">SES / ES</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Examen préparé *</label>
                <select name="examenEleve" value={formData.examenEleve} onChange={handleChange} style={inputStyle}>
                  <option value="">Sélectionner</option><option value="BEPC">BEPC</option><option value="Probatoire">Probatoire</option><option value="BAC">BAC</option><option value="GCE O-Level">GCE O-Level</option><option value="GCE A-Level">GCE A-Level</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Langue préférée</label><select name="langueEleve" value={formData.langueEleve} onChange={handleChange} style={inputStyle}><option>Français</option><option>Anglais</option></select></div>
                <div><label style={labelStyle}>Établissement</label><input type="text" name="etablissementEleve" value={formData.etablissementEleve} onChange={handleChange} style={inputStyle} /></div>
              </div>
            </div>
          )}

          {/* CHAMPS SPÉCIFIQUES ÉTUDIANT (Point 3.5) */}
          {profileType === 'etudiant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1rem', borderLeft: '3px solid #00D4AA' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Niveau d'étude *</label>
                  <select name="niveauEtude" value={formData.niveauEtude} onChange={handleChange} style={inputStyle}>
                    <option value="">Sélectionner</option><option value="BTS">BTS / HND</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option><option value="Doctorat">Doctorat</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Filière / domaine *</label><input type="text" name="filiere" value={formData.filiere} onChange={handleChange} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Établissement</label><input type="text" name="etablissementEtudiant" value={formData.etablissementEtudiant} onChange={handleChange} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Examen préparé (Optionnel)</label><input type="text" name="examenEtudiant" value={formData.examenEtudiant} onChange={handleChange} placeholder="ex: Partiels S2" style={inputStyle} /></div>
                <div><label style={labelStyle}>Langue préférée</label><select name="langueEtudiant" value={formData.langueEtudiant} onChange={handleChange} style={inputStyle}><option>Français</option><option>Anglais</option></select></div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '1rem' }}>
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
          <p style={{ color: '#6E6E6B', margin: 0 }}>Déjà inscrit ? <Link to="/login" style={{ color: '#00A37A', fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link></p>
          <p style={{ color: '#6E6E6B', margin: 0 }}>Vous souhaitez devenir tuteur ? <Link to="/become-tutor" style={{ color: '#1A1A1A', fontWeight: 600, textDecoration: 'underline' }}>Devenez tuteur</Link></p>
        </div>
      </div>
    </div>
  );
}

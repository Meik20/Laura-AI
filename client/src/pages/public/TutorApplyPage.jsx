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
  };

  const inputStyle = { width: '100%', padding: '0.9rem', borderRadius: '0.6rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#444' };

  return (
    <div style={{ padding: '4rem 2rem', background: '#F9F9F8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '3.5rem', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #E5E5E2' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Candidature Tuteur</h1>
        
        {inviteCode ? (
          <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1', padding: '1.2rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
            <span>✨</span>
            <span>Invitation validée ({inviteCode}). Votre compte tuteur sera instantanément activé à la création.</span>
          </div>
        ) : (
          <p style={{ color: '#6E6E6B', marginBottom: '2.5rem' }}>Votre dossier sera examiné avant toute activation.</p>
        )}

        {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* IDENTITÉ */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '0.5rem' }}>1. Identité & Connexion</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Nom *</label><input type="text" name="nom" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Prénom *</label><input type="text" name="prenom" onChange={handleChange} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Adresse mail *</label><input type="email" name="email" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Téléphone</label><input type="text" name="telephone" onChange={handleChange} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>Mot de passe *</label><input type="password" name="password" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Confirmation *</label><input type="password" name="confirmPassword" onChange={handleChange} style={inputStyle} /></div>
            </div>
          </div>

          {/* PROFIL PROFESSIONNEL */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '0.5rem' }}>2. Profil Professionnel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Discipline / matière *</label><input type="text" name="discipline" placeholder="ex: Mathématiques" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Niveau accompagné *</label><input type="text" name="niveau" placeholder="ex: Lycée / BTS" onChange={handleChange} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={labelStyle}>Années d'expérience</label><input type="number" name="experience" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Établissement / structure</label><input type="text" name="etablissement" onChange={handleChange} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>Diplôme principal *</label><input type="text" name="diplome" onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>Compétences (séparées par virgule)</label><input type="text" name="competences" onChange={handleChange} style={inputStyle} /></div>
            </div>
          </div>

          {/* ÉVALUATION */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '0.5rem' }}>3. Motivation & Justificatif</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Pourquoi souhaitez-vous devenir tuteur ? *</label>
              <textarea name="motivation" rows="4" onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }}></textarea>
            </div>
            <div>
              <label style={labelStyle}>Pièce justificative (CV, Diplôme, Carte Pro) *</label>
              <input type="file" style={{ ...inputStyle, background: 'white', padding: '0.6rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/become-tutor" style={{ flex: 1, textAlign: 'center', padding: '1rem', background: '#F5F4EF', color: '#1A1A1A', textDecoration: 'none', borderRadius: '0.75rem', fontWeight: 600 }}>Annuler</Link>
            <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '1rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Envoi en cours...' : 'Soumettre ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function TutorProfilePage() {
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', discipline: '', etablissement: '', experience: '', diplome: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const uid = currentUser?.uid || userProfile?.uid;

  useEffect(() => {
    if (userProfile) {
      setFormData({
        prenom: userProfile.prenom || '',
        nom: userProfile.nom || '',
        email: userProfile.email || '',
        discipline: userProfile.discipline || userProfile.filiere || '',
        etablissement: userProfile.etablissement || '',
        experience: userProfile.experience || '',
        diplome: userProfile.diplome || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await updateDoc(doc(db, 'users', uid), formData);
      setSuccessMsg("Profil tuteur mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil :", err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' };
  const cardStyle = { background: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Profil Tuteur</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Gérez vos informations professionnelles et académiques.
        </p>
      </div>

      <div style={cardStyle}>
        {successMsg && (
          <div style={{ padding: '1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '0.75rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid #A7F3D0' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input type="text" name="nom" required value={formData.nom} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Adresse Email</label>
            <input type="email" name="email" disabled value={formData.email} style={{ ...inputStyle, background: '#E5E5E2', cursor: 'not-allowed', color: '#6E6E6B' }} />
            <span style={{ fontSize: '0.8rem', color: '#6E6E6B', marginTop: '0.3rem', display: 'block' }}>L'adresse email ne peut pas être modifiée.</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F0F0EE', margin: '1rem 0' }} />

          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A' }}>Informations Pédagogiques</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Discipline d'enseignement *</label>
              <input type="text" name="discipline" placeholder="ex: Mathématiques" required value={formData.discipline} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Établissement / Structure</label>
              <input type="text" name="etablissement" placeholder="ex: Lycée Leclerc" value={formData.etablissement} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Années d'expérience</label>
              <input type="number" name="experience" placeholder="ex: 5" value={formData.experience} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Diplôme principal</label>
              <input type="text" name="diplome" placeholder="ex: CAPES, Master" value={formData.diplome} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={isSaving} style={{ padding: '1rem', background: isSaving ? '#6E6E6B' : '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => !isSaving && (e.currentTarget.style.background = '#333')} onMouseLeave={e => !isSaving && (e.currentTarget.style.background = '#1A1A1A')}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

        </form>
      </div>

    </div>
  );
}

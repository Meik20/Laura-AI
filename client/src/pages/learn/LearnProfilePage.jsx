import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function LearnProfilePage() {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', roleLabel: 'Élève', niveau: '', serie: '', filiere: '', examen: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        prenom: userProfile.prenom || userProfile.nom || userProfile.displayName || '',
        nom: userProfile.nom || '',
        email: userProfile.email || '',
        roleLabel: userProfile.roleLabel || (userProfile.role === 'student' ? 'Élève' : userProfile.role) || 'Élève',
        niveau: userProfile.niveau || userProfile.classe || userProfile.niveauEtude || '',
        serie: userProfile.serie || '',
        filiere: userProfile.filiere || userProfile.discipline || '',
        examen: userProfile.examen || userProfile.examenEleve || userProfile.examenEtudiant || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        ...formData,
        displayName: formData.prenom,
        classe: formData.niveau,
        niveauEtude: formData.niveau,
        examenEleve: formData.examen,
        examenEtudiant: formData.examen
      });
      setSuccessMsg("Profil mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du profil :", err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Mon Profil</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Gerez vos informations personnelles et academiques.
        </p>
      </div>

      <div className="learn-card">
        {successMsg && (
          <div style={{ padding: '1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '0.75rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid #A7F3D0' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-grid">
            <div>
              <label>Prenom *</label>
              <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label>Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <label>Adresse Email</label>
            <input type="email" name="email" disabled value={formData.email} style={{ width: '100%', background: '#E5E5E2', cursor: 'not-allowed', color: '#6E6E6B' }} />
            <span style={{ fontSize: '11px', color: '#6E6E6B', marginTop: '0.3rem', display: 'block' }}>L'adresse email ne peut pas etre modifiee.</span>
          </div>

          <div className="divider" style={{ margin: '0.5rem 0' }} />

          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>Informations Academiques</h3>

          <div className="form-grid">
            <div>
              <label>Statut / Profil</label>
              <select name="roleLabel" value={formData.roleLabel} onChange={handleChange} style={{ width: '100%' }}>
                <option value="Eleve">Eleve (Lycee / College)</option>
                <option value="Etudiant">Etudiant (Superieur)</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label>Classe / Niveau *</label>
              <input type="text" name="niveau" placeholder="ex: Terminale, Licence 1" required value={formData.niveau} onChange={handleChange} style={{ width: '100%' }} />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label>Serie (Lycee)</label>
              <input type="text" name="serie" placeholder="ex: D, C, A4, SES" value={formData.serie} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div>
              <label>Filiere (Superieur)</label>
              <input type="text" name="filiere" placeholder="ex: Droit, Medecine, Informatique" value={formData.filiere} onChange={handleChange} style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <label>Examen prepare *</label>
            <input type="text" name="examen" placeholder="ex: BAC, BTS, Licence" required value={formData.examen} onChange={handleChange} style={{ width: '100%' }} />
          </div>

          <button type="submit" disabled={isSaving} className="primary" style={{ width: '100%', height: '36px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

        </form>
      </div>

    </div>
  );
}

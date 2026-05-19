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

  return (
    <div className="stack stack--lg animate-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div>
        <h1 className="laura-h1">Profil Tuteur</h1>
        <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
          Gérez vos informations professionnelles et académiques.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        {successMsg && (
          <div className="badge badge--green" style={{ padding: 'var(--sp-3)', width: '100%', boxSizing: 'border-box', marginBottom: 'var(--sp-5)', justifyContent: 'center', fontSize: 'var(--tx-sm)' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack stack--md">
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
            <div>
              <label>Prénom *</label>
              <input type="text" name="prenom" required value={formData.prenom} onChange={handleChange} />
            </div>
            <div>
              <label>Nom *</label>
              <input type="text" name="nom" required value={formData.nom} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label>Adresse Email</label>
            <input type="email" name="email" disabled value={formData.email} style={{ cursor: 'not-allowed', opacity: 0.7 }} />
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', marginTop: 'var(--sp-1)', display: 'block' }}>L'adresse email ne peut pas être modifiée.</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--brd-subtle)', margin: 'var(--sp-3) 0' }} />

          <h3 style={{ margin: 0, fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)' }}>Informations Pédagogiques</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
            <div>
              <label>Discipline d'enseignement *</label>
              <input type="text" name="discipline" placeholder="ex: Mathématiques" required value={formData.discipline} onChange={handleChange} />
            </div>
            <div>
              <label>Établissement / Structure</label>
              <input type="text" name="etablissement" placeholder="ex: Lycée Leclerc" value={formData.etablissement} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
            <div>
              <label>Années d'expérience</label>
              <input type="number" name="experience" placeholder="ex: 5" value={formData.experience} onChange={handleChange} />
            </div>
            <div>
              <label>Diplôme principal</label>
              <input type="text" name="diplome" placeholder="ex: CAPES, Master" value={formData.diplome} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: '44px', marginTop: 'var(--sp-4)', fontSize: 'var(--tx-base)' }}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

        </form>
      </div>

    </div>
  );
}

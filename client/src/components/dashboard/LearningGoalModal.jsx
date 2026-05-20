import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

const filterMatieres = (allMatieres, userProfile) => {
  const examen = (userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || '').toLowerCase();
  const niveau = (userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || '').toLowerCase();
  const serie = (userProfile?.serie || '').toLowerCase();
  const filiere = (userProfile?.filiere || userProfile?.discipline || '').toLowerCase();

  // If user is BTS or Superior Level
  const isBtsOrSup = examen.includes('bts') || niveau.includes('bts') || niveau.includes('supérieur') || niveau.includes('étudiant') || niveau.includes('licence') || niveau.includes('université');

  if (!allMatieres || allMatieres.length === 0) return [];

  return allMatieres.filter(m => {
    const mNiveau = (m.niveau || '').toLowerCase();
    const mSerie = (m.serie || '').toLowerCase();
    const mFiliere = (m.filiere || '').toLowerCase();

    if (isBtsOrSup) {
      return mNiveau.includes('bts') || mNiveau.includes('supérieur') || mNiveau.includes('étudiant') || 
             (filiere && mFiliere.includes(filiere)) || (serie && mSerie.includes(serie));
    } else if (examen.includes('bepc') || niveau.includes('collège') || niveau.includes('3eme') || niveau.includes('4eme') || niveau.includes('5eme') || niveau.includes('6eme')) {
      return mNiveau.includes('collège') || mNiveau.includes('bepc');
    } else {
      return mNiveau.includes('lycée') || mNiveau.includes('bac') || mSerie.includes('toutes') || 
             (serie && mSerie.includes(serie));
    }
  });
};

export default function LearningGoalModal({ isOpen, onClose, onSave }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '', matiere: '', type: 'Revision', 
    dateDebut: '', dateFin: '', cible: 'Chapitres', notes: ''
  });

  const [matieresList, setMatieresList] = useState([]);

  useEffect(() => {
    async function fetchMatieres() {
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        const fetchedMatieres = docSnap.exists() && docSnap.data().matieres ? docSnap.data().matieres : [];
        const filtered = filterMatieres(fetchedMatieres, userProfile);
        setMatieresList(filtered);
      } catch (err) {
        console.error("Erreur chargement matières:", err);
      }
    }
    if (isOpen) {
      fetchMatieres();
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const inputStyle = { width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#444' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.2rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Définir un objectif</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6E6E6B' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Titre de l’objectif *</label>
            <input type="text" name="title" placeholder="ex: Réviser 8 chapitres de maths" required value={formData.title} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Matière *</label>
              <select name="matiere" required value={formData.matiere} onChange={handleChange} style={inputStyle}>
                <option value="">Sélectionner</option>
                {matieresList.map(m => (
                  <option key={m.id} value={m.nom}>{m.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                <option value="Revision">Révision</option><option value="Quiz">Quiz</option><option value="Exercices">Exercices</option><option value="Examen">Examen blanc</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Date de début</label><input type="date" name="dateDebut" required value={formData.dateDebut} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Date de fin</label><input type="date" name="dateFin" required value={formData.dateFin} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <div>
            <label style={labelStyle}>Cible (Optionnel)</label>
            <select name="cible" value={formData.cible} onChange={handleChange} style={inputStyle}>
              <option value="Chapitres">Nombre de chapitres</option><option value="Exercices">Nombre d'exercices</option><option value="Quiz">Nombre de quiz</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: '#F5F4EF', color: '#1A1A1A', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" style={{ flex: 1, padding: '0.8rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
          </div>
        </form>

      </div>
    </div>
  );
}

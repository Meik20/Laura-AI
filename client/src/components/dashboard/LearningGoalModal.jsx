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

  let filtered = [];

  if (allMatieres && allMatieres.length > 0) {
    filtered = allMatieres.filter(m => {
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
  }

  if (filtered.length > 0) {
    return filtered;
  }

  // Fallbacks
  if (isBtsOrSup) {
    if (filiere.includes('mcv') || serie.includes('mcv') || examen.includes('mcv') || filiere.includes('commer') || filiere.includes('vent')) {
      return [
        { id: 'bts_mcv_1', nom: 'Relation Client et Vente (RCNV)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_2', nom: 'Relation Client à Distance (RCDD)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_3', nom: 'Animation et Dynamisation Commerciale (RCAR)', niveau: 'Supérieur', serie: 'MCV', filiere: 'Commerce' },
        { id: 'bts_mcv_4', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_5', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_6', nom: 'Management des Entreprises', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
        { id: 'bts_mcv_7', nom: 'Anglais Commercial', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Langues' }
      ];
    }
    return [
      { id: 'bts_gen_1', nom: 'Culture Générale et Expression', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_2', nom: 'Économie - Droit', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_3', nom: 'Management des Entreprises', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Général' },
      { id: 'bts_gen_4', nom: 'Anglais Commercial', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Langues' },
      { id: 'bts_gen_5', nom: 'Relation Client et Vente', niveau: 'Supérieur', serie: 'Toutes', filiere: 'Commerce' }
    ];
  } else if (examen.includes('bepc') || niveau.includes('collège')) {
    return [
      { id: 'col_1', nom: 'Mathématiques', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_2', nom: 'Français', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_3', nom: 'Sciences de la Vie et de la Terre', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_4', nom: 'Physique-Chimie', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_5', nom: 'Histoire-Géographie', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' },
      { id: 'col_6', nom: 'Anglais', niveau: 'Collège', serie: 'Toutes', filiere: 'Général' }
    ];
  } else {
    return [
      { id: 'lyc_1', nom: 'Mathématiques', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_2', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' },
      { id: 'lyc_3', nom: 'SVT', niveau: 'Lycée', serie: 'C, D', filiere: 'Général' },
      { id: 'lyc_4', nom: 'Philosophie', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_5', nom: 'Français', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
      { id: 'lyc_6', nom: 'Histoire-Géo', niveau: 'Lycée', serie: 'A, C, D', filiere: 'Général' },
      { id: 'lyc_7', nom: 'Économie', niveau: 'Lycée', serie: 'SES, B', filiere: 'Général' },
      { id: 'lyc_8', nom: 'Informatique', niveau: 'Lycée', serie: 'TI', filiere: 'Général' }
    ];
  }
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

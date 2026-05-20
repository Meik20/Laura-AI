import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function LearningGoalModal({ isOpen, onClose, onSave }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '', matiere: '', type: 'Revision', 
    dateDebut: '', dateFin: '', cible: 'Chapitres', notes: ''
  });

  const [matieresList, setMatieresList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const userMatieres = userProfile?.matieres || [];
      setMatieresList(userMatieres.map(mName => ({ id: mName, nom: mName })));
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
              <input
                type="text"
                name="matiere"
                required
                value={formData.matiere}
                onChange={handleChange}
                list="goal-matiere-suggestions"
                placeholder="Sélectionner ou saisir une matière"
                style={inputStyle}
              />
              <datalist id="goal-matiere-suggestions">
                {matieresList.map(m => (
                  <option key={m.id} value={m.nom} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                list="goal-type-suggestions"
                placeholder="Révision"
                style={inputStyle}
              />
              <datalist id="goal-type-suggestions">
                <option value="Revision">Révision</option>
                <option value="Quiz">Quiz</option>
                <option value="Exercices">Exercices</option>
                <option value="Examen">Examen blanc</option>
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>Date de début</label><input type="date" name="dateDebut" required value={formData.dateDebut} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Date de fin</label><input type="date" name="dateFin" required value={formData.dateFin} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <div>
            <label style={labelStyle}>Cible (Optionnel)</label>
            <input
              type="text"
              name="cible"
              value={formData.cible}
              onChange={handleChange}
              list="goal-cible-suggestions"
              placeholder="Nombre de chapitres"
              style={inputStyle}
            />
            <datalist id="goal-cible-suggestions">
              <option value="Chapitres">Nombre de chapitres</option>
              <option value="Exercices">Nombre d'exercices</option>
              <option value="Quiz">Nombre de quiz</option>
            </datalist>
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

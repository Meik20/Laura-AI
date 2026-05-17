import { useState } from 'react';

export default function LearnRevisionPage() {
  const [sessionConfig, setSessionConfig] = useState({
    matiere: '', chapitre: '', type: '', duree: '30'
  });

  const handleChange = (e) => setSessionConfig({ ...sessionConfig, [e.target.name]: e.target.value });

  const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Révision Guidée</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Configurez votre session de révision avec LAURA.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* CONFIGURATION DE LA SESSION (Point 10.2 & 10.3) */}
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 2rem 0', fontWeight: 800 }}>Nouvelle session</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Matière</label>
                <select name="matiere" value={sessionConfig.matiere} onChange={handleChange} style={inputStyle}>
                  <option value="">Sélectionner</option><option value="Maths">Mathématiques</option><option value="Physique">Physique-Chimie</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chapitre</label>
                <input type="text" name="chapitre" placeholder="ex: Nombres complexes" value={sessionConfig.chapitre} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Type de session</label>
                <select name="type" value={sessionConfig.type} onChange={handleChange} style={inputStyle}>
                  <option value="">Sélectionner</option>
                  <option value="Resume">Résumé de cours</option>
                  <option value="Quiz">Générer un Quiz</option>
                  <option value="Exercice">Résolution d'exercice</option>
                  <option value="Examen">Préparation Examen</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Durée souhaitée (minutes)</label>
                <select name="duree" value={sessionConfig.duree} onChange={handleChange} style={inputStyle}>
                  <option value="15">15 min (Rapide)</option><option value="30">30 min (Standard)</option><option value="60">1h (Approfondi)</option>
                </select>
              </div>
            </div>

            <button style={{ width: '100%', padding: '1rem', background: '#00D4AA', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
              Démarrer la session
            </button>
          </div>
        </div>

        {/* SESSIONS RÉCENTES & ACTIONS (Point 10.4) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#1A1A1A', color: 'white', padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700 }}>Besoin d'aide ?</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Vous ne savez pas par quoi commencer ? Demandez à LAURA de créer un programme de révision sur mesure.
            </p>
            <button style={{ width: '100%', padding: '0.8rem', background: 'white', color: '#1A1A1A', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
              Demander à LAURA
            </button>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#444' }}>Reprendre une session</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button style={{ textAlign: 'left', padding: '1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.75rem', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#1A1A1A', marginBottom: '0.3rem' }}>Quiz : Probabilités</div>
                <div style={{ fontSize: '0.8rem', color: '#6E6E6B' }}>Inachevé · Reste 10 min</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

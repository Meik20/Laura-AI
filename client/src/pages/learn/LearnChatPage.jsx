import { useState } from 'react';

export default function LearnChatPage() {
  const [input, setInput] = useState('');
  
  // Mocks selon les spécifications 9.0
  const profileContext = {
    role: 'Élève', niveau: 'Terminale', serie: 'D', examen: 'BAC'
  };

  const messages = [
    {
      role: 'user',
      text: 'Explique-moi les suites arithmétiques simplement.'
    },
    {
      role: 'laura',
      text: "Une suite arithmétique est une suite de nombres dans laquelle on ajoute toujours la même valeur pour passer d'un terme au suivant.\n\nExemple : 2, 5, 8, 11...\nIci, on ajoute 3 à chaque fois.\n\nFormule : Un = U0 + n × r"
    }
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    // Logique d'envoi à implémenter
    setInput('');
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '2rem' }}>
      
      {/* ZONE CENTRALE : CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1.2rem', border: '1px solid #E5E5E2', overflow: 'hidden' }}>
        
        {/* En-tête du Chat */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E5E2', background: '#FAFAFA' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Préparation BAC Maths</h2>
          <span style={{ color: '#6E6E6B', fontSize: '0.9rem' }}>Dernière modification aujourd'hui</span>
        </div>

        {/* Liste des Messages */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: m.role === 'user' ? '#00D4AA' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {m.role === 'user' ? 'A' : 'L'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>
                  {m.role === 'user' ? 'Vous' : 'LAURA AI'}
                </div>
                <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
                
                {/* Actions sur la réponse de l'IA (Point 9.3) */}
                {m.role === 'laura' && (
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {['Simplifier', 'Approfondir', 'Générer quiz', 'Exercice similaire', 'Sauvegarder'].map(action => (
                      <button key={action} style={{ background: '#F5F4EF', border: '1px solid #E5E5E2', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', fontWeight: 600 }}>
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Zone de Saisie */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', background: '#FAFAFA' }}>
          
          {/* Actions rapides de saisie (Point 9.3) */}
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6E6E6B', fontWeight: 600, fontSize: '0.9rem' }}>
              <span>📎</span> Joindre fichier
            </button>
            <div style={{ width: '1px', background: '#E5E5E2', margin: '0 0.5rem' }}></div>
            {['Expliquer', 'Réviser', 'Corriger', 'Quiz'].map(action => (
              <button key={action} style={{ background: '#E0F2FE', border: 'none', color: '#0369A1', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {action}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <textarea 
              rows="3" 
              placeholder="Écrivez votre question ici..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ width: '100%', padding: '1rem 4rem 1rem 1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', fontSize: '1.05rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button 
              onClick={handleSend}
              style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: '#1A1A1A', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              →
            </button>
          </div>
        </div>

      </div>

      {/* ZONE LATÉRALE : CONTEXTE (Point 9.2) */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
        
        {/* Contexte Profil */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Contexte Profil</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Profil</span><span style={{ fontWeight: 600 }}>{profileContext.role}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Niveau</span><span style={{ fontWeight: 600 }}>{profileContext.niveau}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Série</span><span style={{ fontWeight: 600 }}>{profileContext.serie}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6E6E6B' }}>Examen</span><span style={{ fontWeight: 600 }}>{profileContext.examen}</span></div>
          </div>
        </div>

        {/* Ressources Liées */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Ressources liées</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#444', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ cursor: 'pointer', textDecoration: 'underline' }}>Chapitre 3 : Suites</li>
            <li style={{ cursor: 'pointer', textDecoration: 'underline' }}>Annale Maths 2022</li>
            <li style={{ cursor: 'pointer', textDecoration: 'underline' }}>Fiche méthode</li>
          </ul>
        </div>

        {/* Suggestions */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2' }}>
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Suggestions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Donne un quiz</button>
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Exercice type</button>
            <button style={{ padding: '0.6rem 1rem', background: '#F5F4EF', border: '1px solid #E5E5E2', borderRadius: '0.5rem', textAlign: 'left', cursor: 'pointer', color: '#444' }}>Simplifie ce concept</button>
          </div>
        </div>

      </div>

    </div>
  );
}

import { useState } from 'react';

export default function TutorChatPage() {
  const [input, setInput] = useState('');

  const messages = [
    {
      role: 'laura',
      text: "Bonjour Professeur. Je suis configurée pour vous assister dans la création de matériel pédagogique. Que souhaitez-vous préparer aujourd'hui ?"
    }
  ];

  const suggestions = [
    "Générer un plan de cours",
    "Créer un exercice",
    "Préparer un support visuel",
    "Reformuler cette leçon",
    "Produire un brouillon"
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Chat Pédagogique</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1rem' }}>
          Utilisez l'IA pour générer et structurer vos contenus avant de les soumettre.
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
        
        {/* CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1.5rem', border: '1px solid #E5E5E2', overflow: 'hidden' }}>
          
          {/* Messages */}
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, background: m.role === 'user' ? '#00A37A' : '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
                  {m.role === 'user' ? 'Vous' : 'L'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1A1A1A' }}>
                    {m.role === 'user' ? 'Vous' : 'LAURA Pédagogie'}
                  </div>
                  <div style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', background: '#FAFAFA' }}>
            <div style={{ position: 'relative' }}>
              <textarea 
                rows="3" 
                placeholder="Ex: Génère un quiz de 5 questions sur le théorème de Thalès pour des élèves de 3ème..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ width: '100%', padding: '1rem 4.5rem 1rem 1rem', borderRadius: '1rem', border: '1px solid #E5E5E2', fontSize: '1.05rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button 
                onClick={handleSend}
                style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: '#1A1A1A', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                →
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR SUGGESTIONS (Point 15.2) */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#1A1A1A', padding: '1.5rem', borderRadius: '1.5rem', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', fontWeight: 700 }}>Suggestions rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.8rem 1rem', borderRadius: '0.5rem', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#6E6E6B', textTransform: 'uppercase', letterSpacing: '1px' }}>Export & Soumission</h3>
            <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Une fois votre contenu généré et affiné, vous pourrez l'exporter directement comme brouillon dans vos soumissions.
            </p>
            <button style={{ width: '100%', padding: '0.8rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: 0.5 }}>
              Convertir en soumission
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

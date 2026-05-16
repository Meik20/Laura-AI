import { useState } from 'react'

function App() {
  const [messages, setMessages] = useState([
    { role: 'laura', text: 'Bonjour ! Je suis LAURA, ton assistante éducative. Comment puis-je t\'aider dans tes révisions aujourd\'hui ?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      const data = await response.json()
      
      setMessages(prev => [...prev, { 
        role: 'laura', 
        text: data.response,
        model: data.model_used,
        citations: data.citations
      }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'laura', text: 'Désolée, je rencontre un petit problème technique. Réessaie plus tard !' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="laura-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          display: 'inline-block', 
          padding: '0.5rem 1rem', 
          background: 'rgba(124, 111, 255, 0.1)', 
          borderRadius: '2rem',
          color: '#7C6FFF',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '2px',
          marginBottom: '1rem'
        }}>
          PROJECT LAURA v1.0
        </div>
        <h1 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900 }}>L.A.U.R.A</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>Ton Assistant Éducatif Intelligent & Officiel</p>
      </header>

      <main className="glass-card">
        <div className="chat-window">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-laura'}`}>
              <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
              {m.model && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.8rem', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--teal)' }}>Modèle: {m.model}</span>
                  {m.citations && m.citations.length > 0 && (
                    <span>• Sources: {m.citations.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble bubble-laura" style={{ opacity: 0.5 }}>
              LAURA réfléchit...
            </div>
          )}
        </div>

        <div className="input-area">
          <input 
            type="text" 
            placeholder="Pose ta question (ex: Explique-moi le théorème de Pythagore)" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            style={{ 
              background: 'var(--teal)', 
              border: 'none', 
              borderRadius: '1rem', 
              padding: '0 2rem', 
              color: 'black', 
              fontWeight: 800 
            }}
          >
            ENVOYER
          </button>
        </div>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        <p>© 2026 LAURA IA · MINESEC + GCE BOARD · CAMEROUN</p>
      </footer>
    </div>
  )
}

export default App

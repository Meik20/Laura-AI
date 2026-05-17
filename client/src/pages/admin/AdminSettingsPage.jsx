export default function AdminSettingsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Paramètres Système</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Configuration globale de l'intelligence artificielle et de la plateforme.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button style={{ textAlign: 'left', padding: '1rem 1.5rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Général</button>
          <button style={{ textAlign: 'left', padding: '1rem 1.5rem', background: 'transparent', color: '#94A3B8', border: 'none', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Modèles d'IA (LLM)</button>
          <button style={{ textAlign: 'left', padding: '1rem 1.5rem', background: 'transparent', color: '#94A3B8', border: 'none', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Sécurité & Anti-Spam</button>
          <button style={{ textAlign: 'left', padding: '1rem 1.5rem', background: 'transparent', color: '#94A3B8', border: 'none', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Intégrations</button>
        </div>

        {/* Content Area */}
        <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Modèles de Langage par Défaut</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>Modèle principal (Chat Apprenant)</label>
                <select style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}>
                  <option value="gemini">Google Gemini 1.5 Pro</option>
                  <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                  <option value="grok">xAI Grok 2</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>Modèle secondaire (Correction de copies)</label>
                <select style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none' }}>
                  <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gemini">Google Gemini 1.5 Flash</option>
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          <div>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Maintenance & Accès</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'white' }}>Mode Maintenance</div>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Désactiver l'accès à la plateforme pour les apprenants.</div>
              </div>
              <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontWeight: 600, cursor: 'pointer' }}>Activer</button>
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '0.8rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => alert('Paramètres sauvegardés.')}>Enregistrer les modifications</button>
          </div>

        </div>
      </div>
    </div>
  );
}

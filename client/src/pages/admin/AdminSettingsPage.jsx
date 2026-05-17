import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('Général');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Form State
  const [settings, setSettings] = useState({
    // Général
    platformName: 'LAURA',
    supportEmail: 'contact@laura-education.cm',
    maintenanceMode: false,
    allowRegistration: true,
    
    // LLM
    mainModel: 'gemini-1.5-pro',
    secondaryModel: 'claude-3-5-sonnet',
    fallbackModel: 'groq-llama-3',
    temperature: 0.7,
    maxTokens: 2048,

    // Sécurité
    rateLimit: 30,
    blockVPN: false,
    autoModerate: true,

    // Intégrations
    vectorDb: 'pinecone',
    ragChunkSize: 1000
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error("Erreur de chargement des paramètres :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await setDoc(doc(db, 'adminSettings', 'global'), settings);
      setSaveMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleMaintenance = () => {
    setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
  };

  const tabs = ['Général', "Modèles d'IA (LLM)", 'Sécurité & Anti-Spam', 'Intégrations'];

  const inputStyle = { width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box', marginTop: '0.4rem' };
  const labelStyle = { display: 'block', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 };
  const sectionCardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Paramètres Système</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Configuration globale de l'intelligence artificielle et de la plateforme.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2.5rem' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                textAlign: 'left', 
                padding: '1rem 1.5rem', 
                background: activeTab === tab ? '#3B82F6' : 'transparent', 
                color: activeTab === tab ? 'white' : '#94A3B8', 
                border: 'none', 
                borderRadius: '0.8rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des paramètres de la plateforme...</div>
          ) : (
            <>
              {/* TAB 1 : GÉNÉRAL */}
              {activeTab === 'Général' && (
                <>
                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Informations de la plateforme</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div>
                        <label style={labelStyle}>Nom de la plateforme</label>
                        <input type="text" name="platformName" value={settings.platformName} onChange={handleChange} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email du support technique</label>
                        <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Maintenance & Accès</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>Mode Maintenance</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Désactiver l'accès à la plateforme pour les apprenants (maintenance en cours).</div>
                      </div>
                      <button 
                        onClick={toggleMaintenance}
                        style={{ 
                          background: settings.maintenanceMode ? '#EF4444' : 'rgba(255,255,255,0.1)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '0.6rem 1.5rem', 
                          borderRadius: '2rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {settings.maintenanceMode ? 'Désactiver (Actif)' : 'Activer'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>Inscriptions Ouvertes</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Autoriser la création de nouveaux comptes sur la page d'inscription.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        name="allowRegistration" 
                        checked={settings.allowRegistration} 
                        onChange={handleChange}
                        style={{ width: '20px', height: '20px', accentColor: '#3B82F6', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2 : MODÈLES D'IA (LLM) */}
              {activeTab === "Modèles d'IA (LLM)" && (
                <>
                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Sélection des Modèles de Langage (Orchestrateur)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={labelStyle}>Modèle principal (Chat Apprenant & Explications complexes)</label>
                        <select name="mainModel" value={settings.mainModel} onChange={handleChange} style={inputStyle}>
                          <optgroup label="Google Gemini">
                            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Recommandé pour le raisonnement)</option>
                            <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Rapide)</option>
                          </optgroup>
                          <optgroup label="Anthropic Claude">
                            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Excellent en littérature/synthèse)</option>
                            <option value="claude-3-opus">Anthropic Claude 3 Opus</option>
                          </optgroup>
                          <optgroup label="Groq (LPU) & Autres">
                            <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                            <option value="groq-mixtral">Groq - Mixtral 8x7B</option>
                            <option value="mistral-large">Mistral Large 2</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Modèle secondaire (Correction de copies & Évaluation tuteur)</label>
                        <select name="secondaryModel" value={settings.secondaryModel} onChange={handleChange} style={inputStyle}>
                          <optgroup label="Anthropic Claude">
                            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                          </optgroup>
                          <optgroup label="Google Gemini">
                            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                            <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                          </optgroup>
                          <optgroup label="Groq (LPU) & Autres">
                            <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                            <option value="mistral-large">Mistral Large 2</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Modèle de secours (Fallback en cas de panne d'API)</label>
                        <select name="fallbackModel" value={settings.fallbackModel} onChange={handleChange} style={inputStyle}>
                          <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                          <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                          <option value="ollama-local">Ollama Local (Mistral 7B - Auto-hébergé)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Paramètres d'Échantillonnage (Sampling)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label style={labelStyle}>Température (Créativité vs Précision)</label>
                          <span style={{ color: '#3B82F6', fontWeight: 700 }}>{settings.temperature}</span>
                        </div>
                        <input 
                          type="range" 
                          name="temperature" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={settings.temperature} 
                          onChange={handleChange} 
                          style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <span>0.0 (Strict / QCM)</span>
                          <span>0.7 (Équilibré)</span>
                          <span>1.0 (Créatif / Dissertations)</span>
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Limite de tokens en sortie (Max Tokens)</label>
                        <input type="number" name="maxTokens" value={settings.maxTokens} onChange={handleChange} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3 : SÉCURITÉ & ANTI-SPAM */}
              {activeTab === 'Sécurité & Anti-Spam' && (
                <div style={sectionCardStyle}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Pare-feu & Limitation de débit (Rate Limiting)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>Requêtes maximales par minute (par utilisateur)</label>
                      <input type="number" name="rateLimit" value={settings.rateLimit} onChange={handleChange} style={inputStyle} />
                      <span style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>Évite les attaques DDoS et la surconsommation des quotas d'API LLM.</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>Blocage des VPN & Tor</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Restreindre l'accès aux adresses IP résidentielles camerounaises.</div>
                      </div>
                      <input type="checkbox" name="blockVPN" checked={settings.blockVPN} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: '#3B82F6', cursor: 'pointer' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>Modération IA automatique (Prompt Injection)</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Filtrer les tentatives de jailbreak et les propos inappropriés avant l'envoi au LLM.</div>
                      </div>
                      <input type="checkbox" name="autoModerate" checked={settings.autoModerate} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: '#3B82F6', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4 : INTÉGRATIONS */}
              {activeTab === 'Intégrations' && (
                <div style={sectionCardStyle}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Bases de données & Services Tiers</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>Base de données Vectorielle (RAG / Recherche sémantique)</label>
                      <select name="vectorDb" value={settings.vectorDb} onChange={handleChange} style={inputStyle}>
                        <option value="pinecone">Pinecone Vector Database (Actif)</option>
                        <option value="milvus">Milvus / Zilliz</option>
                        <option value="qdrant">Qdrant Cloud</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Taille des segments RAG (Chunk Size en caractères)</label>
                      <input type="number" name="ragChunkSize" value={settings.ragChunkSize} onChange={handleChange} style={inputStyle} />
                      <span style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>Taille de découpage des PDF du programme scolaire camerounais.</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.5rem 0' }} />

                    <div>
                      <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Statut des clés d'API (Environnement)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#CBD5E1' }}>Google Gemini API</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Connecté (Fichier .env)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#CBD5E1' }}>Anthropic Claude API</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Connecté (Fichier .env)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#CBD5E1' }}>Groq API (LPU)</span>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Connecté (Fichier .env)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BARRE D'ACTION ET DE SAUVEGARDE */}
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem' }}>
                {saveMessage && (
                  <span style={{ color: '#10B981', fontWeight: 700, background: '#10B98120', padding: '0.5rem 1rem', borderRadius: '0.5rem', animation: 'fadeIn 0.3s' }}>
                    {saveMessage}
                  </span>
                )}
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  style={{ 
                    background: isSaving ? '#64748B' : '#3B82F6', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.8rem 2.5rem', 
                    borderRadius: '0.8rem', 
                    fontWeight: 700, 
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

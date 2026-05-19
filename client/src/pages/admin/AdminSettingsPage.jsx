import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const defaultMatieres = [
  { id: 'm1', nom: 'Mathématiques', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
  { id: 'm2', nom: 'Physique-Chimie', niveau: 'Lycée', serie: 'C, D, TI', filiere: 'Général' },
  { id: 'm3', nom: 'SVT', niveau: 'Lycée', serie: 'C, D', filiere: 'Général' },
  { id: 'm4', nom: 'Philosophie', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
  { id: 'm5', nom: 'Français', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' },
  { id: 'm6', nom: 'Histoire-Géo', niveau: 'Lycée', serie: 'A, C, D', filiere: 'Général' },
  { id: 'm7', nom: 'Économie', niveau: 'Lycée', serie: 'SES, B', filiere: 'Général' },
  { id: 'm8', nom: 'Informatique', niveau: 'Lycée', serie: 'TI', filiere: 'Général' }
];

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
    ragChunkSize: 1000,

    // Curriculum / Programmes
    matieres: defaultMatieres
  });

  const [newMatiere, setNewMatiere] = useState({ nom: '', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            ...prev, 
            ...data,
            matieres: data.matieres && data.matieres.length > 0 ? data.matieres : defaultMatieres
          }));
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

  const handleAddMatiere = (e) => {
    e.preventDefault();
    if (!newMatiere.nom.trim()) return;
    const updated = [...(settings.matieres || defaultMatieres), { id: 'mat_' + Date.now(), ...newMatiere }];
    setSettings(prev => ({ ...prev, matieres: updated }));
    setNewMatiere({ nom: '', niveau: 'Lycée', serie: 'Toutes', filiere: 'Général' });
  };

  const handleDeleteMatiere = (id) => {
    const updated = (settings.matieres || defaultMatieres).filter(m => m.id !== id);
    setSettings(prev => ({ ...prev, matieres: updated }));
  };

  const tabs = ['Général', 'Programmes & Matières', "Modèles d'IA (LLM)", 'Sécurité & Anti-Spam', 'Intégrations'];

  const inputStyle = { width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)', outline: 'none', boxSizing: 'border-box', marginTop: 'var(--sp-2)' };
  const labelStyle = { display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const sectionCardStyle = { background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-lg)', padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' };

  return (
    <div className="stack stack--lg animate-in">
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Paramètres Système</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>Configuration globale de l'intelligence artificielle, des programmes et de la plateforme.</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--sp-8)' }}>
        
        {/* Navigation Sidebar */}
        <div className="stack stack--xs">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{ 
                textAlign: 'left', 
                padding: 'var(--sp-3) var(--sp-5)', 
                background: activeTab === tab ? 'var(--clr-brand-lt)' : 'transparent', 
                color: activeTab === tab ? 'var(--clr-brand)' : 'var(--txt-secondary)', 
                border: 'none',
                borderLeft: activeTab === tab ? '3px solid var(--clr-brand)' : '3px solid transparent',
                borderRadius: 'var(--rd-md)', 
                fontWeight: activeTab === tab ? 'var(--fw-bold)' : 'var(--fw-medium)', 
                cursor: 'pointer',
                transition: 'all var(--dur-fast)',
                fontSize: 'var(--tx-sm)',
                width: '100%'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="card card__body stack stack--md">
          
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement des paramètres de la plateforme...</div>
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
                        <div style={{ fontSize: '0.85rem', customColor: '#64748B' }}>Désactiver l'accès à la plateforme pour les apprenants (maintenance en cours).</div>
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

              {/* TAB 2 : PROGRAMMES & MATIÈRES */}
              {activeTab === 'Programmes & Matières' && (
                <>
                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: 700, color: 'white' }}>Gestion du Programme Local (Matières, Séries, Filières)</h2>
                    <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      Définissez les matières officielles disponibles pour les apprenants selon leur niveau, série et filière.
                    </p>

                    {/* FORMULAIRE D'AJOUT */}
                    <form onSubmit={handleAddMatiere} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                      <div>
                        <label style={labelStyle}>Nom de la matière *</label>
                        <input type="text" placeholder="ex: Mathématiques" value={newMatiere.nom} onChange={e => setNewMatiere({...newMatiere, nom: e.target.value})} style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Niveau</label>
                        <input type="text" placeholder="ex: Lycée" value={newMatiere.niveau} onChange={e => setNewMatiere({...newMatiere, niveau: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Série</label>
                        <input type="text" placeholder="ex: C, D, TI, Toutes" value={newMatiere.serie} onChange={e => setNewMatiere({...newMatiere, serie: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Filière</label>
                        <input type="text" placeholder="ex: Général" value={newMatiere.filiere} onChange={e => setNewMatiere({...newMatiere, filiere: e.target.value})} style={inputStyle} />
                      </div>
                      <button type="submit" style={{ padding: '0.8rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', height: '42px' }}>
                        + Ajouter
                      </button>
                    </form>

                    {/* TABLEAU DES MATIÈRES */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.8rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', color: '#94A3B8' }}>
                          <tr>
                            <th style={{ padding: '1rem 1.2rem' }}>Matière</th>
                            <th style={{ padding: '1rem 1.2rem' }}>Niveau</th>
                            <th style={{ padding: '1rem 1.2rem' }}>Série(s)</th>
                            <th style={{ padding: '1rem 1.2rem' }}>Filière</th>
                            <th style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(settings.matieres || defaultMatieres).map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '1rem 1.2rem', fontWeight: 700 }}>{item.nom}</td>
                              <td style={{ padding: '1rem 1.2rem', color: '#CBD5E1' }}>{item.niveau}</td>
                              <td style={{ padding: '1rem 1.2rem', color: '#CBD5E1' }}>{item.serie}</td>
                              <td style={{ padding: '1rem 1.2rem', color: '#CBD5E1' }}>{item.filiere}</td>
                              <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                <button onClick={() => handleDeleteMatiere(item.id)} style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444450', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </>
              )}

              {/* TAB 3 : MODÈLES D'IA (LLM) */}
              {activeTab === "Modèles d'IA (LLM)" && (
                <>
                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Sélection des Modèles de Langage (Orchestrateur)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={labelStyle}>Modèle principal (Chat Apprenant & Explications complexes)</label>
                        <select name="mainModel" value={settings.mainModel} onChange={handleChange} style={inputStyle}>
                          <optgroup label="Google Gemini" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="gemini-1.5-pro" style={{ background: '#0F1520', color: 'white' }}>Google Gemini 1.5 Pro (Recommandé pour le raisonnement)</option>
                            <option value="gemini-1.5-flash" style={{ background: '#0F1520', color: 'white' }}>Google Gemini 1.5 Flash (Rapide)</option>
                          </optgroup>
                          <optgroup label="Anthropic Claude" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="claude-3-5-sonnet" style={{ background: '#0F1520', color: 'white' }}>Anthropic Claude 3.5 Sonnet (Excellent en littérature/synthèse)</option>
                            <option value="claude-3-opus" style={{ background: '#0F1520', color: 'white' }}>Anthropic Claude 3 Opus</option>
                          </optgroup>
                          <optgroup label="Groq (LPU) & Autres" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="groq-llama-3" style={{ background: '#0F1520', color: 'white' }}>Groq - Meta Llama 3.3 70B</option>
                            <option value="groq-mixtral" style={{ background: '#0F1520', color: 'white' }}>Groq - Mixtral 8x7B</option>
                            <option value="mistral-large" style={{ background: '#0F1520', color: 'white' }}>Mistral Large 2</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Modèle secondaire (Correction de copies & Évaluation tuteur)</label>
                        <select name="secondaryModel" value={settings.secondaryModel} onChange={handleChange} style={inputStyle}>
                          <optgroup label="Anthropic Claude" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="claude-3-5-sonnet" style={{ background: '#0F1520', color: 'white' }}>Anthropic Claude 3.5 Sonnet</option>
                          </optgroup>
                          <optgroup label="Google Gemini" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="gemini-1.5-pro" style={{ background: '#0F1520', color: 'white' }}>Google Gemini 1.5 Pro</option>
                            <option value="gemini-1.5-flash" style={{ background: '#0F1520', color: 'white' }}>Google Gemini 1.5 Flash</option>
                          </optgroup>
                          <optgroup label="Groq (LPU) & Autres" style={{ background: '#0F1520', color: 'white' }}>
                            <option value="groq-llama-3" style={{ background: '#0F1520', color: 'white' }}>Groq - Meta Llama 3.3 70B</option>
                            <option value="mistral-large" style={{ background: '#0F1520', color: 'white' }}>Mistral Large 2</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Modèle de secours (Fallback en cas de panne d'API)</label>
                        <select name="fallbackModel" value={settings.fallbackModel} onChange={handleChange} style={inputStyle}>
                          <option value="groq-llama-3" style={{ background: '#0F1520', color: 'white' }}>Groq - Meta Llama 3.3 70B</option>
                          <option value="gemini-1.5-flash" style={{ background: '#0F1520', color: 'white' }}>Google Gemini 1.5 Flash</option>
                          <option value="ollama-local" style={{ background: '#0F1520', color: 'white' }}>Ollama Local (Mistral 7B - Auto-hébergé)</option>
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

              {/* TAB 4 : SÉCURITÉ & ANTI-SPAM */}
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

              {/* TAB 5 : INTÉGRATIONS */}
              {activeTab === 'Intégrations' && (
                <div style={sectionCardStyle}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'white' }}>Bases de données & Services Tiers</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>Base de données Vectorielle (RAG / Recherche sémantique)</label>
                      <select name="vectorDb" value={settings.vectorDb} onChange={handleChange} style={inputStyle}>
                        <option value="pinecone" style={{ background: '#0F1520', color: 'white' }}>Pinecone Vector Database (Actif)</option>
                        <option value="milvus" style={{ background: '#0F1520', color: 'white' }}>Milvus / Zilliz</option>
                        <option value="qdrant" style={{ background: '#0F1520', color: 'white' }}>Qdrant Cloud</option>
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
              <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                {saveMessage && (
                  <span className="badge badge--green" style={{ padding: 'var(--sp-2) var(--sp-4)', fontSize: 'var(--tx-sm)' }}>
                    {saveMessage}
                  </span>
                )}
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="btn btn--primary"
                  style={{ opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
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

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      setSaveMessage(t('admin.settings.success'));
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert(t('admin.settings.error'));
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

  const TABS_MAP = {
    'Général': t('admin.settings.tabs.general'),
    'Programmes & Matières': t('admin.settings.tabs.programs'),
    "Modèles d'IA (LLM)": t('admin.settings.tabs.llm'),
    'Sécurité & Anti-Spam': t('admin.settings.tabs.security'),
    'Intégrations': t('admin.settings.tabs.integrations')
  };
  const tabs = Object.keys(TABS_MAP);

  const inputStyle = { width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)', outline: 'none', boxSizing: 'border-box', marginTop: 'var(--sp-2)' };
  const labelStyle = { display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const sectionCardStyle = { background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-lg)', padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' };

  return (
    <div className="stack stack--lg animate-in">
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('admin.settings.title')}</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>{t('admin.settings.subtitle')}</p>
        </div>
      </div>
      
      <div className="settings-layout">
        
        {/* Navigation Sidebar */}
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`settings-tab${activeTab === tab ? ' settings-tab--active' : ''}`}
            >
              {TABS_MAP[tab]}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="card card__body stack stack--md">
          
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.settings.loading')}</div>
          ) : (
            <>
              {/* TAB 1 : GÉNÉRAL */}
              {activeTab === 'Général' && (
                <>
                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.general.info_title')}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.general.name_label')}</label>
                        <input type="text" name="platformName" value={settings.platformName} onChange={handleChange} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.general.email_label')}</label>
                        <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.general.maintenance_title')}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--srf-base)', borderRadius: '0.8rem', border: '1px solid var(--brd-subtle)', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{t('admin.settings.general.maintenance_mode')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>{t('admin.settings.general.maintenance_desc')}</div>
                      </div>
                      <button 
                        onClick={toggleMaintenance}
                        style={{ 
                          background: settings.maintenanceMode ? '#EF4444' : 'var(--srf-raised)', 
                          color: settings.maintenanceMode ? 'white' : 'var(--txt-primary)', 
                          border: settings.maintenanceMode ? 'none' : '1px solid var(--brd-default)', 
                          padding: '0.6rem 1.5rem', 
                          borderRadius: '2rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {settings.maintenanceMode ? t('admin.settings.general.maintenance_btn_active') : t('admin.settings.general.maintenance_btn_inactive')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--srf-base)', borderRadius: '0.8rem', border: '1px solid var(--brd-subtle)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{t('admin.settings.general.registration_mode')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>{t('admin.settings.general.registration_desc')}</div>
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
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.programs.title')}</h2>
                    <p style={{ color: 'var(--txt-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      {t('admin.settings.programs.desc')}
                    </p>

                    {/* FORMULAIRE D'AJOUT */}
                    <form onSubmit={handleAddMatiere} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end', background: 'var(--srf-base)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--brd-subtle)', marginBottom: '2rem' }}>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.programs.name')}</label>
                        <input type="text" placeholder="ex: Mathématiques" value={newMatiere.nom} onChange={e => setNewMatiere({...newMatiere, nom: e.target.value})} style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.programs.level')}</label>
                        <input type="text" placeholder="ex: Lycée" value={newMatiere.niveau} onChange={e => setNewMatiere({...newMatiere, niveau: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.programs.serie')}</label>
                        <input type="text" placeholder="ex: C, D, TI, Toutes" value={newMatiere.serie} onChange={e => setNewMatiere({...newMatiere, serie: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>{t('admin.settings.programs.filiere')}</label>
                        <input type="text" placeholder="ex: Général" value={newMatiere.filiere} onChange={e => setNewMatiere({...newMatiere, filiere: e.target.value})} style={inputStyle} />
                      </div>
                      <button type="submit" style={{ padding: '0.8rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', height: '42px' }}>
                        {t('admin.settings.programs.add_btn')}
                      </button>
                    </form>

                    {/* TABLEAU DES MATIÈRES */}
                    <div style={{ background: 'var(--srf-base)', borderRadius: '0.8rem', border: '1px solid var(--brd-subtle)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--txt-primary)' }}>
                        <thead style={{ background: 'var(--srf-raised)', borderBottom: '1px solid var(--brd-subtle)', fontSize: '0.9rem', color: 'var(--txt-secondary)' }}>
                          <tr>
                            <th style={{ padding: '1rem 1.2rem' }}>{t('admin.settings.programs.table.subject')}</th>
                            <th style={{ padding: '1rem 1.2rem' }}>{t('admin.settings.programs.table.level')}</th>
                            <th style={{ padding: '1rem 1.2rem' }}>{t('admin.settings.programs.table.serie')}</th>
                            <th style={{ padding: '1rem 1.2rem' }}>{t('admin.settings.programs.table.filiere')}</th>
                            <th style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>{t('admin.settings.programs.table.action')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(settings.matieres || defaultMatieres).map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--brd-subtle)' }}>
                              <td style={{ padding: '1rem 1.2rem', fontWeight: 700 }}>{item.nom}</td>
                              <td style={{ padding: '1rem 1.2rem', color: 'var(--txt-secondary)' }}>{item.niveau}</td>
                              <td style={{ padding: '1rem 1.2rem', color: 'var(--txt-secondary)' }}>{item.serie}</td>
                              <td style={{ padding: '1rem 1.2rem', color: 'var(--txt-secondary)' }}>{item.filiere}</td>
                              <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                                <button onClick={() => handleDeleteMatiere(item.id)} style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444450', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                                  {t('admin.settings.programs.table.delete')}
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
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.llm.title_models')}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                       <div>
                        <label style={labelStyle}>{t('admin.settings.llm.main_model')}</label>
                        <input
                          type="text"
                          name="mainModel"
                          value={settings.mainModel}
                          onChange={handleChange}
                          list="admin-main-model-suggestions"
                          placeholder="gemini-1.5-pro"
                          style={inputStyle}
                        />
                        <datalist id="admin-main-model-suggestions">
                          <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Recommandé pour le raisonnement)</option>
                          <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Rapide)</option>
                          <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Excellent en littérature/synthèse)</option>
                          <option value="claude-3-opus">Anthropic Claude 3 Opus</option>
                          <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                          <option value="groq-mixtral">Groq - Mixtral 8x7B</option>
                          <option value="mistral-large">Mistral Large 2</option>
                        </datalist>
                      </div>

                      <div>
                        <label style={labelStyle}>{t('admin.settings.llm.secondary_model')}</label>
                        <input
                           type="text"
                           name="secondaryModel"
                           value={settings.secondaryModel}
                           onChange={handleChange}
                           list="admin-secondary-model-suggestions"
                           placeholder="claude-3-5-sonnet"
                           style={inputStyle}
                         />
                         <datalist id="admin-secondary-model-suggestions">
                           <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                           <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                           <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                           <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                           <option value="mistral-large">Mistral Large 2</option>
                         </datalist>
                      </div>

                      <div>
                        <label style={labelStyle}>{t('admin.settings.llm.fallback_model')}</label>
                         <input
                           type="text"
                           name="fallbackModel"
                           value={settings.fallbackModel}
                           onChange={handleChange}
                           list="admin-fallback-model-suggestions"
                           placeholder="groq-llama-3"
                           style={inputStyle}
                         />
                         <datalist id="admin-fallback-model-suggestions">
                           <option value="groq-llama-3">Groq - Meta Llama 3.3 70B</option>
                           <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                           <option value="ollama-local">Ollama Local (Mistral 7B - Auto-hébergé)</option>
                         </datalist>
                      </div>
                    </div>
                  </div>

                  <div style={sectionCardStyle}>
                    <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.llm.title_sampling')}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label style={labelStyle}>{t('admin.settings.llm.temperature')}</label>
                          <span style={{ color: 'var(--clr-brand)', fontWeight: 700 }}>{settings.temperature}</span>
                        </div>
                        <input 
                          type="range" 
                          name="temperature" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={settings.temperature} 
                          onChange={handleChange} 
                          style={{ width: '100%', accentColor: 'var(--clr-brand)', cursor: 'pointer' }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--txt-tertiary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                          <span>{t('admin.settings.llm.temp_low')}</span>
                          <span>{t('admin.settings.llm.temp_mid')}</span>
                          <span>{t('admin.settings.llm.temp_high')}</span>
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>{t('admin.settings.llm.max_tokens')}</label>
                        <input type="number" name="maxTokens" value={settings.maxTokens} onChange={handleChange} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4 : SÉCURITÉ & ANTI-SPAM */}
              {activeTab === 'Sécurité & Anti-Spam' && (
                <div style={sectionCardStyle}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.security.title_rate')}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>{t('admin.settings.security.rate_limit')}</label>
                      <input type="number" name="rateLimit" value={settings.rateLimit} onChange={handleChange} style={inputStyle} />
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>{t('admin.settings.security.rate_desc')}</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--brd-subtle)', margin: '0.5rem 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{t('admin.settings.security.vpn_block')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>{t('admin.settings.security.vpn_desc')}</div>
                      </div>
                      <input type="checkbox" name="blockVPN" checked={settings.blockVPN} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: 'var(--clr-brand)', cursor: 'pointer' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{t('admin.settings.security.auto_mod')}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>{t('admin.settings.security.auto_mod_desc')}</div>
                      </div>
                      <input type="checkbox" name="autoModerate" checked={settings.autoModerate} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: 'var(--clr-brand)', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5 : INTÉGRATIONS */}
              {activeTab === 'Intégrations' && (
                <div style={sectionCardStyle}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--txt-primary)' }}>{t('admin.settings.integrations.title')}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>{t('admin.settings.integrations.vector_db')}</label>
                      <input
                        type="text"
                        name="vectorDb"
                        value={settings.vectorDb}
                        onChange={handleChange}
                        list="admin-vectordb-suggestions"
                        placeholder="pinecone"
                        style={inputStyle}
                      />
                      <datalist id="admin-vectordb-suggestions">
                        <option value="pinecone">Pinecone Vector Database (Actif)</option>
                        <option value="milvus">Milvus / Zilliz</option>
                        <option value="qdrant">Qdrant Cloud</option>
                      </datalist>
                    </div>

                    <div>
                      <label style={labelStyle}>{t('admin.settings.integrations.chunk_size')}</label>
                      <input type="number" name="ragChunkSize" value={settings.ragChunkSize} onChange={handleChange} style={inputStyle} />
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>{t('admin.settings.integrations.chunk_desc')}</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--brd-subtle)', margin: '0.5rem 0' }} />

                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--txt-primary)', marginBottom: '0.5rem' }}>{t('admin.settings.integrations.api_status')}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'var(--srf-base)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid var(--brd-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--txt-secondary)' }}>Google Gemini API</span>
                          <span style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-bold)' }}>{t('admin.settings.integrations.api_connected')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--txt-secondary)' }}>Anthropic Claude API</span>
                          <span style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-bold)' }}>{t('admin.settings.integrations.api_connected')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--txt-secondary)' }}>Groq API (LPU)</span>
                          <span style={{ color: 'var(--clr-green)', fontWeight: 'var(--fw-bold)' }}>{t('admin.settings.integrations.api_connected')}</span>
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
                  {isSaving ? t('admin.settings.saving_btn') : t('admin.settings.save_btn')}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null); 
  const [authStep, setAuthStep] = useState('landing'); // 'landing', 'identity', 'role', 'details', 'pending'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', role: '', level: '', exam: '', series: '', filiere: '', domain: '', discipline: '', grade: '', school: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [adminData, setAdminData] = useState({ users: [], pendingTeachers: [], stats: {} });

  // Features chips data
  const features = [
    { icon: '📝', label: 'Réviser une leçon' },
    { icon: '🧮', label: 'Résoudre un exercice' },
    { icon: '📚', label: 'Préparer un examen' },
    { icon: '✍️', label: 'Rédiger une dissertation' },
    { icon: '🔬', label: 'Comprendre un concept' },
    { icon: '📊', label: 'Analyser des données' },
  ];

  // --- PERSISTANCE AUTH & ROUTAGE ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const docRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data();
          setUser({ uid: fbUser.uid, ...profile });
          if (profile.role === 'admin') fetchAdminData();
        }
      } else { setUser(null); }
    });
    return unsub;
  }, []);

  // --- LOGIQUE ADMIN ---
  const fetchAdminData = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAdminData({
      users: allUsers,
      pendingTeachers: allUsers.filter(u => u.role === 'teacher' && u.status === 'pending'),
      stats: {
        total: allUsers.length,
        students: allUsers.filter(u => u.role === 'student').length,
        uni: allUsers.filter(u => u.role === 'university').length,
        teachers: allUsers.filter(u => u.role === 'teacher').length
      }
    });
  }

  const approveTeacher = async (teacherId) => {
    await updateDoc(doc(db, "users", teacherId), { status: 'active' });
    fetchAdminData();
  }

  // --- PERSISTANCE CHAT ---
  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'university')) {
      const q = query(collection(db, "users", user.uid, "messages"), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => d.data())));
      return unsub;
    }
  }, [user]);

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = { ...formData, status: formData.role === 'teacher' ? 'pending' : 'active', createdAt: serverTimestamp() };
      delete userData.password;
      await setDoc(doc(db, "users", res.user.uid), userData);
      if (formData.role === 'teacher') setAuthStep('pending');
    } catch (e) { alert(e.message); } finally { setIsLoading(false); }
  }

  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;
    setIsLoading(true);
    const userText = input; setInput('');
    try {
      await addDoc(collection(db, "users", user.uid, "messages"), { role: 'user', text: userText, timestamp: serverTimestamp() });
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, user_profile: user })
      });
      const data = await response.json();
      await addDoc(collection(db, "users", user.uid, "messages"), { role: 'laura', text: data.response, timestamp: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }

  const handleLogout = () => {
    signOut(auth);
    setAuthStep('landing');
  }

  // --- VIEWS ---

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', fontFamily: "'Inter', sans-serif", color: '#1A1A1A' }}>
        {/* HEADER */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAuthStep('landing')}>
            <img src="/logo.png" alt="LAURA" style={{ height: '32px' }} />
          </div>
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#444' }}>
            <span style={{ cursor: 'pointer' }}>À propos</span>
            <span style={{ cursor: 'pointer' }}>Fonctionnalités</span>
            <span style={{ cursor: 'pointer' }}>Établissements</span>
          </nav>
          <button 
            onClick={() => setAuthStep('identity')} 
            style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Se connecter / S'inscrire
          </button>
        </header>

        {/* MAIN CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '6rem 2rem 2rem' }}>
          
          {authStep === 'landing' && (
            <div style={{ textAlign: 'center', maxWidth: '800px' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                Apprends plus vite,<br />
                <span style={{ color: '#00A37A' }}>réussis mieux.</span>
              </h1>
              <p style={{ fontSize: '1.25rem', color: '#555', lineHeight: 1.6, marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                L'IA souveraine conçue pour le programme scolaire camerounais. Révise, pratique et excelle avec LAURA.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', width: '100%', maxWidth: '900px' }}>
                {features.map((f, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid #E5E5E0', borderRadius: '1rem', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#333', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                    <span style={{ fontWeight: 500 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(authStep === 'identity' || authStep === 'role' || authStep === 'details') && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
              {authStep === 'identity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Créer votre compte</h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input type="text" placeholder="Nom" style={{ flex: 1, padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                    <input type="text" placeholder="Prénom" style={{ flex: 1, padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                  </div>
                  <input type="email" placeholder="E-mail professionnel ou scolaire" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <input type="password" placeholder="Mot de passe sécurisé" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  <button onClick={() => setAuthStep('role')} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>Suivant</button>
                </div>
              )}

              {authStep === 'role' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Vous êtes...</h2>
                  <button onClick={() => { setFormData({...formData, role: 'student'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: 'white', border: '1.5px solid #7C6FFF', color: '#1A1A1A', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Élève</div>
                    <div style={{ fontSize: '0.85rem', color: '#6E6E6B', marginTop: '4px' }}>Secondaire (6ème à Terminale)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'university'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: 'white', border: '1.5px solid #00D4AA', color: '#1A1A1A', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Étudiant</div>
                    <div style={{ fontSize: '0.85rem', color: '#6E6E6B', marginTop: '4px' }}>Supérieur (LMD, Grandes Écoles)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'teacher'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: 'white', border: '1.5px solid #F59E0B', color: '#1A1A1A', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tuteur / Expert</div>
                    <div style={{ fontSize: '0.85rem', color: '#6E6E6B', marginTop: '4px' }}>Enseignant ou Professionnel</div>
                  </button>
                </div>
              )}

              {authStep === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Derniers détails</h2>
                  {formData.role === 'student' && (
                    <>
                      <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Classe</option><option value="Tle">Terminale</option><option value="1ère">Première</option><option value="3ème">Troisième</option>
                      </select>
                      <select onChange={(e) => setFormData({...formData, exam: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Examen</option><option value="BACC">BACC</option><option value="PROBATOIRE">PROBATOIRE</option><option value="BEPC">BEPC</option>
                      </select>
                      <select onChange={(e) => setFormData({...formData, series: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Série</option><option value="C">Scientifique (C)</option><option value="D">Scientifique (D)</option><option value="A4">Littéraire (A4)</option><option value="SES">Économique (SES)</option>
                      </select>
                    </>
                  )}
                  {formData.role === 'university' && (
                    <>
                      <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Niveau</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="Master">Master</option>
                      </select>
                      <input type="text" placeholder="Filière (ex: Génie Logiciel)" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} onChange={(e) => setFormData({...formData, filiere: e.target.value})} />
                    </>
                  )}
                  <button onClick={handleSignup} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{isLoading ? 'Création...' : 'Finaliser mon profil'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>Dossier en cours d'examen</h2>
        <p style={{ color: '#6E6E6B', maxWidth: '450px', lineHeight: '1.6' }}>Merci {user.prenom}. Votre profil de Tuteur est en attente de validation par l'administration.</p>
        <button onClick={handleLogout} style={{ marginTop: '2rem', background: '#1A1A1A', color: 'white', padding: '0.8rem 2rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retour</button>
      </div>
    );
  }

  // --- DASHBOARD ADMIN ---
  if (user.role === 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', display: 'flex' }}>
        <aside style={{ width: '280px', background: '#0F1520', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', marginBottom: '3rem' }} />
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left' }}>🌍 Vue d'ensemble</button>
            <button onClick={handleLogout} style={{ marginTop: 'auto', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Déconnexion</button>
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '3rem' }}>
          <h1 style={{ marginBottom: '2rem' }}>Dashboard Admin</h1>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ flex: 1, background: '#0F1520', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94A3B8' }}>Utilisateurs</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{adminData.stats.total || 0}</div>
            </div>
            <div style={{ flex: 1, background: '#0F1520', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#F59E0B' }}>Attente Tuteurs</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{adminData.pendingTeachers.length}</div>
            </div>
          </div>
          <div style={{ background: '#0F1520', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Tuteurs en attente</h2>
            {adminData.pendingTeachers.map(t => (
              <div key={t.id} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>{t.prenom} {t.nom} ({t.discipline})</div>
                <button onClick={() => approveTeacher(t.id)} style={{ background: '#00D4AA', color: 'black', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Approuver</button>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // --- INTERFACE APPRENANT ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9F9F8', color: '#1D1D1D' }}>
      <aside style={{ width: isSidebarCollapsed ? '0' : '280px', background: '#F0F0EE', borderRight: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', transition: '0.3s', overflow: 'hidden' }}>
        <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', marginBottom: '2.5rem', cursor: 'pointer' }} onClick={() => setMessages([])} />
        </div>
        <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLogout}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{user.prenom[0]}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: '0.75rem', color: '#6E6E6B' }}>{user.level} · {user.series || user.filiere}</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: messages.length === 0 ? 'center' : 'flex-start', padding: '2rem 4rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 500 }}>Bonjour, {user.prenom}.</h1>
            <p style={{ color: '#6E6E6B', fontSize: '1.2rem' }}>Comment puis-je t'aider à réviser aujourd'hui ?</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '10rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: m.role === 'user' ? '#00D4AA' : '#F0F0EE', flexShrink: 0, marginTop: '5px' }}></div>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>{m.text}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '840px', background: 'white', borderRadius: '1.5rem', border: '1px solid #E5E5E2', padding: '1.2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', position: messages.length === 0 ? 'relative' : 'fixed', bottom: messages.length === 0 ? 'auto' : '2.5rem' }}>
          <textarea rows="2" placeholder="Pose ta question..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.15rem', resize: 'none' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={handleSend} style={{ background: '#1D1D1D', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '0.8rem', fontWeight: 600 }}>{isLoading ? '...' : 'Envoyer'}</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

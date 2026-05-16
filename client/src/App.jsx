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
  const [authStep, setAuthStep] = useState('landing'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', passwordConfirm: '', role: '', level: '', exam: '', series: '', filiere: '', domain: '', discipline: '', grade: '', school: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [adminData, setAdminData] = useState({ users: [], pendingTeachers: [], stats: {} });

  const features = [
    { icon: '📝', label: 'Réviser une leçon' },
    { icon: '🧮', label: 'Résoudre un exercice' },
    { icon: '📚', label: 'Préparer un examen' },
    { icon: '✍️', label: 'Rédiger une dissertation' },
    { icon: '🔬', label: 'Comprendre un concept' },
    { icon: '📊', label: 'Analyser des données' },
  ];

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

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'university')) {
      const q = query(collection(db, "users", user.uid, "messages"), orderBy("timestamp", "asc"));
      const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => d.data())));
      return unsub;
    }
  }, [user]);

  const handleSignup = async () => {
    if (formData.password !== formData.passwordConfirm) return alert("Les mots de passe ne correspondent pas.");
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = { ...formData, status: formData.role === 'teacher' ? 'pending' : 'active', createdAt: serverTimestamp() };
      delete userData.password;
      delete userData.passwordConfirm;
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

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', fontFamily: "'Inter', sans-serif", color: '#1A1A1A', display: 'flex', flexDirection: 'column' }}>
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
          <button onClick={() => setAuthStep('identity')} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Se connecter</button>
        </header>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8rem 2rem 4rem' }}>
          {authStep === 'landing' && (
            <div style={{ textAlign: 'center', maxWidth: '1000px' }}>
              <h1 style={{ fontSize: '4.5rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Apprends plus vite,<br /><span style={{ color: '#00A37A' }}>réussis mieux.</span></h1>
              <p style={{ fontSize: '1.25rem', color: '#555', lineHeight: 1.6, marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem' }}>L'IA souveraine conçue pour le programme scolaire camerounais. Révise, pratique et excelle avec LAURA.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%' }}>
                {features.map((f, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid #E5E5E0', borderRadius: '1.2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1rem', color: '#333', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                    <span style={{ fontWeight: 600 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(authStep === 'identity' || authStep === 'role' || authStep === 'details') && (
            <div style={{ background: 'white', padding: '3rem', borderRadius: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
              {authStep === 'identity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 700 }}>Créer votre compte</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input type="text" placeholder="Nom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                    <input type="text" placeholder="Prénom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                  </div>
                  <input type="email" placeholder="E-mail professionnel ou scolaire" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <input type="password" placeholder="Mot de passe sécurisé" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  <input type="password" placeholder="Confirmer le mot de passe" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.passwordConfirm} onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})} />
                  <button onClick={() => setAuthStep('role')} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Suivant</button>
                </div>
              )}

              {authStep === 'role' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>Vous êtes...</h2>
                  <button onClick={() => { setFormData({...formData, role: 'student'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1.2rem', background: 'white', border: '2px solid #7C6FFF', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Élève</div>
                    <div style={{ fontSize: '0.9rem', color: '#6E6E6B', marginTop: '4px' }}>Secondaire (6ème à Terminale)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'university'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1.2rem', background: 'white', border: '2px solid #00D4AA', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Étudiant</div>
                    <div style={{ fontSize: '0.9rem', color: '#6E6E6B', marginTop: '4px' }}>Supérieur (LMD, Grandes Écoles)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'teacher'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1.2rem', background: 'white', border: '2px solid #F59E0B', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tuteur / Expert</div>
                    <div style={{ fontSize: '0.9rem', color: '#6E6E6B', marginTop: '4px' }}>Enseignant ou Professionnel</div>
                  </button>
                </div>
              )}

              {authStep === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 700 }}>Derniers détails</h2>
                  {formData.role === 'student' && (
                    <>
                      <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Classe</option><option value="Tle">Terminale</option><option value="1ère">Première</option><option value="3ème">Troisième</option>
                      </select>
                      <select onChange={(e) => setFormData({...formData, exam: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Examen</option><option value="BACC">BACC</option><option value="PROBATOIRE">PROBATOIRE</option><option value="BEPC">BEPC</option>
                      </select>
                      <select onChange={(e) => setFormData({...formData, series: e.target.value})} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }}>
                        <option value="">Série</option><option value="C">C</option><option value="D">D</option><option value="A4">A4</option><option value="SES">SES</option>
                      </select>
                    </>
                  )}
                  <button onClick={handleSignup} style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{isLoading ? 'Création...' : 'Finaliser mon profil'}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ background: '#1A1A1A', color: '#94A3B8', padding: '5rem 3rem 3rem', fontSize: '0.9rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
            <div>
              <img src="/logo.png" alt="LAURA" style={{ height: '32px', marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }} />
              <p style={{ lineHeight: 1.6 }}>L'intelligence artificielle dédiée à la réussite académique au Cameroun.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Produit</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li style={{ cursor: 'pointer' }}>Fonctionnalités</li>
                <li style={{ cursor: 'pointer' }}>Tuteurs Experts</li>
                <li style={{ cursor: 'pointer' }}>Tarification</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Ressources</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li style={{ cursor: 'pointer' }}>Centre d'aide</li>
                <li style={{ cursor: 'pointer' }}>Blog Éducatif</li>
                <li style={{ cursor: 'pointer' }}>Annales MINESEC</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Légal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li style={{ cursor: 'pointer' }}>Confidentialité</li>
                <li style={{ cursor: 'pointer' }}>Conditions</li>
                <li style={{ cursor: 'pointer' }}>Contact</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', textAlign: 'center', color: '#6E6E6B' }}>
            <p>LAURA AI © 2026 — Fabriqué au Cameroun 🇨🇲</p>
          </div>
        </footer>
      </div>
    );
  }

  if (user.status === 'pending') {
    return <div style={{ minHeight: '100vh', background: '#F5F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Validation en cours...</h2></div>
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
            <button onClick={handleSend} style={{ background: '#1D1D1D', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '0.8rem', fontWeight: 600 }}>Envoyer</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

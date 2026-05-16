import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null); 
  const [authStep, setAuthStep] = useState('landing'); 
  const [isLogin, setIsLogin] = useState(true); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', passwordConfirm: '', role: '', level: '', exam: '', series: '', filiere: '', domain: '', discipline: '', grade: '', school: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleAuthAction = async () => {
    if (!formData.email || !formData.password) return alert("Veuillez remplir tous les champs.");
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        if (formData.password !== formData.passwordConfirm) return alert("Les mots de passe ne correspondent pas.");
        setAuthStep('role');
      }
    } catch (e) { alert("Erreur : " + e.message); } finally { setIsLoading(false); }
  }

  const handleSignupFinal = async () => {
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
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setAuthStep('landing')}>
            <img src="/logo.png" alt="LAURA" style={{ height: '44px' }} />
          </div>
          <button onClick={() => { setAuthStep('identity'); setIsLogin(true); }} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.7rem 1.6rem', borderRadius: '0.6rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>Se connecter</button>
        </header>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 2rem 6rem' }}>
          {authStep === 'landing' && (
            <div style={{ textAlign: 'center', maxWidth: '1000px' }}>
              <h1 style={{ fontSize: '4.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.8rem', letterSpacing: '-0.03em' }}>Apprends plus vite,<br /><span style={{ color: '#00A37A' }}>réussis mieux.</span></h1>
              <p style={{ fontSize: '1.35rem', color: '#555', lineHeight: 1.6, marginBottom: '5rem', maxWidth: '650px', margin: '0 auto 5rem' }}>L'IA souveraine conçue pour le programme scolaire camerounais.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.8rem', width: '100%' }}>
                {features.map((f, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid #E5E5E0', borderRadius: '1.4rem', padding: '1.8rem', display: 'flex', alignItems: 'center', gap: '18px', fontSize: '1.1rem', color: '#333', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontSize: '2.5rem' }}>{f.icon}</span>
                    <span style={{ fontWeight: 600 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(authStep === 'identity' || authStep === 'role' || authStep === 'details') && (
            <div style={{ background: 'white', padding: '3.5rem', borderRadius: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 30px 80px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
              {authStep === 'identity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '0.8rem', fontSize: '2rem', fontWeight: 800 }}>{isLogin ? 'Bon retour !' : 'Créer votre compte'}</h2>
                  {!isLogin && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input type="text" placeholder="Nom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                      <input type="text" placeholder="Prénom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                    </div>
                  )}
                  <input type="email" placeholder="E-mail" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  <input type="password" placeholder="Mot de passe" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  {!isLogin && (
                    <input type="password" placeholder="Confirmer le mot de passe" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', width: '100%', boxSizing: 'border-box' }} value={formData.passwordConfirm} onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})} />
                  )}
                  <button onClick={handleAuthAction} disabled={isLoading} style={{ padding: '1.1rem', borderRadius: '0.9rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    {isLoading ? 'Attente...' : isLogin ? 'Se connecter' : 'Continuer'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.95rem', color: '#6E6E6B' }}>
                    {isLogin ? "Nouveau sur LAURA ?" : "Déjà un compte ?"} 
                    <span onClick={() => { setIsLogin(!isLogin); setFormData({...formData, password: '', passwordConfirm: ''}); }} style={{ color: '#00A37A', fontWeight: 700, cursor: 'pointer', marginLeft: '8px' }}>
                      {isLogin ? "S'inscrire" : "Se connecter"}
                    </span>
                  </p>
                </div>
              )}
              {/* Rôles et détails ici... */}
              {authStep === 'role' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 800 }}>Vous êtes...</h2>
                  <button onClick={() => { setFormData({...formData, role: 'student'}); setAuthStep('details'); }} style={{ padding: '1.8rem', borderRadius: '1.4rem', background: 'white', border: '2px solid #7C6FFF', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Élève</div>
                    <div style={{ fontSize: '0.95rem', color: '#6E6E6B', marginTop: '6px' }}>Secondaire (6ème à Terminale)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'university'}); setAuthStep('details'); }} style={{ padding: '1.8rem', borderRadius: '1.4rem', background: 'white', border: '2px solid #00D4AA', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Étudiant</div>
                    <div style={{ fontSize: '0.95rem', color: '#6E6E6B', marginTop: '6px' }}>Supérieur (LMD, Grandes Écoles)</div>
                  </button>
                  <button onClick={() => { setFormData({...formData, role: 'teacher'}); setAuthStep('details'); }} style={{ padding: '1.8rem', borderRadius: '1.4rem', background: 'white', border: '2px solid #F59E0B', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>Tuteur / Expert</div>
                    <div style={{ fontSize: '0.95rem', color: '#6E6E6B', marginTop: '6px' }}>Enseignant ou Professionnel</div>
                  </button>
                </div>
              )}
              {authStep === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem', fontWeight: 800 }}>Derniers détails</h2>
                  {formData.role === 'student' && (
                    <>
                      <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%' }}>
                        <option value="">Classe</option><option value="Tle">Terminale</option><option value="1ère">Première</option><option value="3ème">Troisième</option>
                      </select>
                      <select onChange={(e) => setFormData({...formData, series: e.target.value})} style={{ padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%' }}>
                        <option value="">Série</option><option value="C">C</option><option value="D">D</option><option value="A4">A4</option><option value="SES">SES</option>
                      </select>
                    </>
                  )}
                  <button onClick={handleSignupFinal} style={{ padding: '1.1rem', borderRadius: '0.9rem', background: '#1A1A1A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}>Finaliser mon profil</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER RESTAURÉ */}
        <footer style={{ background: '#1A1A1A', color: '#94A3B8', padding: '6rem 3rem 4rem', fontSize: '0.95rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem', marginBottom: '5rem' }}>
            <div>
              <img src="/logo.png" alt="LAURA" style={{ height: '44px', marginBottom: '2rem', filter: 'brightness(0) invert(1)' }} />
              <p style={{ lineHeight: 1.7 }}>L'intelligence artificielle dédiée à la réussite académique au Cameroun.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.8rem', fontSize: '1.1rem' }}>Produit</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ cursor: 'pointer' }}>Fonctionnalités</li>
                <li style={{ cursor: 'pointer' }}>Tuteurs Experts</li>
                <li style={{ cursor: 'pointer' }}>Tarification</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.8rem', fontSize: '1.1rem' }}>Ressources</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ cursor: 'pointer' }}>Centre d'aide</li>
                <li style={{ cursor: 'pointer' }}>Blog Éducatif</li>
                <li style={{ cursor: 'pointer' }}>Annales MINESEC</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', marginBottom: '1.8rem', fontSize: '1.1rem' }}>Légal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ cursor: 'pointer' }}>Confidentialité</li>
                <li style={{ cursor: 'pointer' }}>Conditions</li>
                <li style={{ cursor: 'pointer' }}>Contact</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem', textAlign: 'center', color: '#6E6E6B' }}>
            <p>LAURA AI © 2026 — Fabriqué au Cameroun 🇨🇲</p>
          </div>
        </footer>
      </div>
    );
  }

  if (user.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>Dossier en cours d'examen</h2>
        <p style={{ color: '#6E6E6B', maxWidth: '450px', lineHeight: '1.6' }}>Merci {user.prenom}. Votre profil est en attente de validation.</p>
        <button onClick={handleLogout} style={{ marginTop: '2rem', background: '#1A1A1A', color: 'white', padding: '0.8rem 2rem', borderRadius: '0.8rem', cursor: 'pointer' }}>Retour</button>
      </div>
    );
  }

  // --- INTERFACE APPRENANT ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9F9F8', color: '#1D1D1D' }}>
      <aside style={{ width: isSidebarCollapsed ? '0' : '300px', background: '#F0F0EE', borderRight: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', transition: '0.3s', overflow: 'hidden' }}>
        <div style={{ padding: '2.5rem 1.8rem', flex: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => setMessages([])} />
        </div>
        <div style={{ padding: '1.8rem', borderTop: '1px solid #E5E5E2', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={handleLogout}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>{user.prenom[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: '0.8rem', color: '#6E6E6B' }}>{user.level} · {user.series || user.filiere}</div>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: messages.length === 0 ? 'center' : 'flex-start', padding: '2rem 4rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 600 }}>Bonjour, {user.prenom}.</h1>
            <p style={{ color: '#6E6E6B', fontSize: '1.3rem', marginTop: '1rem' }}>Comment puis-je t'aider aujourd'hui ?</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '12rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '2.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: m.role === 'user' ? '#00D4AA' : '#F0F0EE', flexShrink: 0, marginTop: '6px' }}></div>
                <div style={{ fontSize: '1.15rem', lineHeight: '1.8' }}>{m.text}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ width: '100%', maxWidth: '900px', background: 'white', borderRadius: '1.8rem', border: '1px solid #E5E5E2', padding: '1.4rem', boxShadow: '0 12px 45px rgba(0,0,0,0.04)', position: messages.length === 0 ? 'relative' : 'fixed', bottom: messages.length === 0 ? 'auto' : '3rem' }}>
          <textarea rows="2" placeholder="Pose ta question..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.2rem', resize: 'none' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
            <button onClick={handleSend} style={{ background: '#1D1D1D', color: 'white', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '0.9rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Envoyer</button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

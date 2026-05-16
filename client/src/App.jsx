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
  const [authStep, setAuthStep] = useState('identity'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', role: '', level: '', exam: '', series: '', filiere: '', domain: '', discipline: '', grade: '', school: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifact, setArtifact] = useState(null);
  const [adminData, setAdminData] = useState({ users: [], pendingTeachers: [], stats: {} });

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

  const handleLogout = () => signOut(auth);

  // --- VIEWS ---

  if (!user && authStep !== 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '64px', marginBottom: '2.5rem' }} />
        <div style={{ background: '#0F1520', padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {authStep === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Nom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A2236', border: '1px solid #334155', color: 'white' }} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
              <input type="text" placeholder="Prénom" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A2236', border: '1px solid #334155', color: 'white' }} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
              <input type="email" placeholder="Email" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A2236', border: '1px solid #334155', color: 'white' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Mots de passe" style={{ padding: '1rem', borderRadius: '0.8rem', background: '#1A2236', border: '1px solid #334155', color: 'white' }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button onClick={() => setAuthStep('role')} style={{ padding: '1rem', borderRadius: '0.8rem', background: 'white', color: 'black', fontWeight: 700 }}>Continuer</button>
            </div>
          )}
          {authStep === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => { setFormData({...formData, role: 'student'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: '#1A2236', border: '1px solid #7C6FFF', color: 'white', textAlign: 'left' }}><strong>Élève</strong></button>
              <button onClick={() => { setFormData({...formData, role: 'university'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: '#1A2236', border: '1px solid #00D4AA', color: 'white', textAlign: 'left' }}><strong>Étudiant</strong></button>
              <button onClick={() => { setFormData({...formData, role: 'teacher'}); setAuthStep('details'); }} style={{ padding: '1.5rem', borderRadius: '1rem', background: '#1A2236', border: '1px solid #F59E0B', color: 'white', textAlign: 'left' }}><strong>Tuteur</strong></button>
            </div>
          )}
          {authStep === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={handleSignup} style={{ padding: '1rem', borderRadius: '0.8rem', background: 'white', color: 'black', fontWeight: 700 }}>Finaliser</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (authStep === 'pending') {
    return <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Dossier Tuteur en attente...</h2></div>
  }

  // --- DASHBOARD ADMIN (DIEU) ---
  if (user && user.role === 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex' }}>
        <aside style={{ width: '280px', background: '#0F1520', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', marginBottom: '3rem' }} />
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left' }}>🌍 Vue d'ensemble</button>
            <button style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left' }}>🎓 Tuteurs</button>
            <button style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left' }}>📊 Stats ChromaDB</button>
            <button onClick={handleLogout} style={{ marginTop: '2rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Déconnexion</button>
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '3rem' }}>
          <h1 style={{ marginBottom: '2rem' }}>Tableau de bord Souverain</h1>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ flex: 1, background: '#0F1520', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Total Utilisateurs</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{adminData.stats.total || 0}</div>
            </div>
            <div style={{ flex: 1, background: '#0F1520', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#F59E0B', fontSize: '0.9rem' }}>Tuteurs en attente</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{adminData.pendingTeachers.length}</div>
            </div>
          </div>

          <section>
            <h2 style={{ marginBottom: '1.5rem' }}>Validation des Tuteurs</h2>
            <div style={{ background: '#0F1520', borderRadius: '1rem', overflow: 'hidden' }}>
              {adminData.pendingTeachers.map(t => (
                <div key={t.id} style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.prenom} {t.nom}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{t.discipline} · {t.grade}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => approveTeacher(t.id)} style={{ background: '#00D4AA', color: 'black', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Approuver</button>
                    <button style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Rejeter</button>
                  </div>
                </div>
              ))}
              {adminData.pendingTeachers.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucune demande en attente.</div>}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- INTERFACE APPRENANT ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9F9F8', color: '#1D1D1D', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: isSidebarCollapsed ? '0' : '280px', background: '#F0F0EE', borderRight: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', marginBottom: '2.5rem' }} />
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
          <h1 style={{ fontSize: '3.5rem', fontWeight: 500 }}>Bonjour, {user.prenom}.</h1>
        ) : (
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: m.role === 'user' ? '#00D4AA' : '#F0F0EE', flexShrink: 0 }}></div>
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

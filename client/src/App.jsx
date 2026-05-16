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

  // Features chips data
  const features = [
    { icon: '📝', label: 'Réviser une leçon' },
    { icon: '🧮', label: 'Résoudre un exercice' },
    { icon: '📚', label: 'Préparer un examen' },
    { icon: '✍️', label: 'Rédiger une dissertation' },
    { icon: '🔬', label: 'Comprendre un concept' },
    { icon: '📊', label: 'Analyser des données' },
  ];

  if (!user && authStep !== 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', fontFamily: "'Inter', sans-serif", color: '#1A1A1A' }}>

        {/* HEADER */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="LAURA" style={{ height: '32px' }} />
          </div>
          <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#444' }}>
            <span style={{ cursor: 'pointer' }}>À propos</span>
            <span style={{ cursor: 'pointer' }}>Fonctionnalités</span>
            <span style={{ cursor: 'pointer' }}>Pour les établissements</span>
          </nav>
          <button style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Commencer gratuitement</button>
        </header>

        {/* HERO + FORM SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)', padding: '4rem 3rem', gap: '5rem', maxWidth: '1200px', margin: '0 auto' }}>

          {/* LEFT : HERO */}
          <div style={{ flex: 1, maxWidth: '520px' }}>
            <h1 style={{ fontSize: '3.8rem', fontWeight: 700, lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Apprends plus vite,<br />
              <span style={{ color: '#00A37A' }}>réussis mieux.</span>
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#555', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              LAURA est l'assistante IA conçue pour le programme scolaire et universitaire camerounais. Révise tes cours, prépare tes examens et maîtrise tes matières avec une IA qui connaît le MINESEC.
            </p>

            {/* FEATURE CHIPS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
              {features.map((f, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E5E5E0', borderRadius: '0.8rem', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#333', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT : FORM CARD */}
          <div style={{ width: '380px', background: 'white', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>

            {authStep === 'identity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Créer votre compte</h2>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <input type="text" placeholder="Nom" style={{ flex: 1, padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                  <input type="text" placeholder="Prénom" style={{ flex: 1, padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                </div>
                <input type="email" placeholder="Votre adresse e-mail" style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <input type="password" placeholder="Créer un mot de passe" style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                <button onClick={() => setAuthStep('role')} style={{ padding: '0.9rem', borderRadius: '0.7rem', background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
                  Continuer avec l'e-mail
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#999', marginTop: '0.5rem' }}>
                  En continuant, vous acceptez les <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Conditions d'utilisation</span> de LAURA.
                </p>
              </div>
            )}

            {authStep === 'role' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Vous êtes...</h2>
                <button onClick={() => { setFormData({...formData, role: 'student'}); setAuthStep('details'); }} style={{ padding: '1.2rem', borderRadius: '0.8rem', border: '1.5px solid #7C6FFF', color: '#1A1A1A', background: 'white', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700 }}>Élève (Secondaire)</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '3px' }}>De la 6ème à la Terminale · MINESEC</div>
                </button>
                <button onClick={() => { setFormData({...formData, role: 'university'}); setAuthStep('details'); }} style={{ padding: '1.2rem', borderRadius: '0.8rem', border: '1.5px solid #00A37A', color: '#1A1A1A', background: 'white', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700 }}>Étudiant (Supérieur)</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '3px' }}>LMD, BTS/HND, Grandes Écoles</div>
                </button>
                <button onClick={() => { setFormData({...formData, role: 'teacher'}); setAuthStep('details'); }} style={{ padding: '1.2rem', borderRadius: '0.8rem', border: '1.5px solid #F59E0B', color: '#1A1A1A', background: 'white', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700 }}>Tuteur / Expert</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '3px' }}>PLEG, PCEG, Formateur, Professionnel</div>
                </button>
                <button onClick={() => setAuthStep('identity')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>← Retour</button>
              </div>
            )}

            {authStep === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Votre parcours</h2>

                {formData.role === 'student' && (<>
                  <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Classe</option>
                    <option value="Tle">Terminale</option><option value="1ère">Première</option><option value="3ème">Troisième</option>
                  </select>
                  <select onChange={(e) => setFormData({...formData, exam: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Examen préparé</option>
                    <option value="BACC">Baccalauréat</option><option value="PROBATOIRE">Probatoire</option><option value="BEPC">BEPC</option>
                  </select>
                  <select onChange={(e) => setFormData({...formData, series: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Série</option>
                    <optgroup label="Scientifique"><option value="C">C — Maths/Physique</option><option value="D">D — SVT/Chimie</option></optgroup>
                    <optgroup label="Littéraire"><option value="A1">A1</option><option value="A2">A2</option><option value="A3">A3</option><option value="A4">A4</option></optgroup>
                    <optgroup label="Économique"><option value="SES">SES / ES</option></optgroup>
                  </select>
                </>)}

                {formData.role === 'university' && (<>
                  <select onChange={(e) => setFormData({...formData, level: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Niveau d'étude</option>
                    <option value="BAC+2">BAC+2 / BTS / HND</option>
                    <option value="L1">Licence 1</option><option value="L2">Licence 2</option><option value="L3">Licence 3</option>
                    <option value="Master">Master</option><option value="Doctorat">Doctorat</option>
                  </select>
                  <select onChange={(e) => setFormData({...formData, domain: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Domaine</option>
                    <option value="Sciences">Sciences & Tech</option><option value="Santé">Médecine / Santé</option>
                    <option value="Droit">Droit / Sc. Po</option><option value="Eco">Économie / Gestion</option>
                    <option value="Lettres">Lettres / Arts</option>
                  </select>
                  <input type="text" placeholder="Filière précise (ex: Génie Logiciel)" style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} onChange={(e) => setFormData({...formData, filiere: e.target.value})} />
                </>)}

                {formData.role === 'teacher' && (<>
                  <select onChange={(e) => setFormData({...formData, grade: e.target.value})} style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', color: '#1A1A1A' }}>
                    <option value="">Grade / Titre</option>
                    <option value="PLEG">PLEG</option><option value="PCEG">PCEG</option>
                    <option value="PENI">PENI</option><option value="Expert">Expert / Professionnel</option>
                  </select>
                  <input type="text" placeholder="Discipline (ex: Mathématiques)" style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} onChange={(e) => setFormData({...formData, discipline: e.target.value})} />
                  <input type="text" placeholder="Établissement (Lycée, Université...)" style={{ padding: '0.9rem', borderRadius: '0.7rem', border: '1px solid #E5E5E0', fontSize: '0.95rem', outline: 'none' }} onChange={(e) => setFormData({...formData, school: e.target.value})} />
                </>)}

                <button onClick={handleSignup} disabled={isLoading} style={{ padding: '0.9rem', borderRadius: '0.7rem', background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
                  {isLoading ? 'Création en cours...' : 'Rejoindre LAURA'}
                </button>
                <button onClick={() => setAuthStep('role')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.85rem' }}>← Modifier le rôle</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F4EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <img src="/logo.png" alt="LAURA" style={{ height: '56px', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Dossier en cours d'examen</h2>
        <p style={{ color: '#666', maxWidth: '420px', lineHeight: 1.7 }}>Merci {formData.prenom}. Votre profil de Tuteur est soumis à validation administrative. Vous serez notifié par e-mail dès l'activation de votre accès.</p>
        <button onClick={() => { setAuthStep('identity'); signOut(auth); }} style={{ marginTop: '2.5rem', background: '#1A1A1A', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Retour à l'accueil</button>
      </div>
    );
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

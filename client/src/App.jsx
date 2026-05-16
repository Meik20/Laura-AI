import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc } from "firebase/firestore";
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';

const cardStyle = {
  background: 'white', padding: '3.5rem', borderRadius: '2.5rem',
  width: '100%', maxWidth: '480px',
  boxShadow: '0 30px 80px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.05)',
};

const features = [
  { icon: '📝', label: 'Réviser une leçon' },
  { icon: '🧮', label: 'Résoudre un exercice' },
  { icon: '📚', label: 'Préparer un examen' },
  { icon: '✍️', label: 'Rédiger une dissertation' },
  { icon: '🔬', label: 'Comprendre un concept' },
  { icon: '📊', label: 'Analyser des données' },
];

function App() {
  const [user, setUser] = useState(null);
  const [authStep, setAuthStep] = useState('landing');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [signupData, setSignupData] = useState({});
  const [profileData, setProfileData] = useState({ role: '', level: '', exam: '', series: '', filiere: '', domain: '', discipline: '', grade: '', school: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminData, setAdminData] = useState({ users: [], pendingTeachers: [], stats: {} });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists()) {
          const p = snap.data();
          setUser({ uid: fbUser.uid, ...p });
          if (p.role === 'admin') fetchAdminData();
        }
      } else setUser(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'university')) {
      const q = query(collection(db, "users", user.uid, "messages"), orderBy("timestamp", "asc"));
      return onSnapshot(q, snap => setMessages(snap.docs.map(d => d.data())));
    }
  }, [user]);

  const fetchAdminData = async () => {
    const snap = await getDocs(collection(db, "users"));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAdminData({
      users: all,
      pendingTeachers: all.filter(u => u.role === 'teacher' && u.status === 'pending'),
      stats: { total: all.length, students: all.filter(u => u.role === 'student').length, teachers: all.filter(u => u.role === 'teacher').length }
    });
  };

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { alert("Erreur connexion : " + e.message); }
    finally { setIsLoading(false); }
  };

  const handleSignupNext = data => { setSignupData(data); setAuthStep('role'); };

  const handleSignupFinal = async () => {
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const userData = { nom: signupData.nom, prenom: signupData.prenom, email: signupData.email, ...profileData, status: profileData.role === 'teacher' ? 'pending' : 'active', createdAt: serverTimestamp() };
      await setDoc(doc(db, "users", res.user.uid), userData);
    } catch (e) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;
    setIsLoading(true);
    const txt = input; setInput('');
    try {
      await addDoc(collection(db, "users", user.uid, "messages"), { role: 'user', text: txt, timestamp: serverTimestamp() });
      const res = await fetch('http://localhost:5000/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: txt, user_profile: user }) });
      const data = await res.json();
      await addDoc(collection(db, "users", user.uid, "messages"), { role: 'laura', text: data.response, timestamp: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleLogout = () => { signOut(auth); setAuthStep('landing'); };

  const btnDark = { padding: '1.1rem', borderRadius: '0.9rem', background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', width: '100%' };
  const selectStyle = { padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%' };
  const inputStyle2 = { padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%', boxSizing: 'border-box' };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#F5F4EF', fontFamily: "'Inter', sans-serif", color: '#1A1A1A', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 3rem', background: '#F5F4EF', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <img src="/logo.png" alt="LAURA" style={{ height: '44px', cursor: 'pointer' }} onClick={() => setAuthStep('landing')} />
        <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', color: '#444' }}>
          <span style={{ cursor: 'pointer' }}>À propos</span>
          <span style={{ cursor: 'pointer' }}>Fonctionnalités</span>
          <span style={{ cursor: 'pointer' }}>Établissements</span>
        </nav>
        <button onClick={() => { setAuthStep('identity'); setIsLoginMode(true); }} style={{ background: '#1A1A1A', color: 'white', border: 'none', padding: '0.7rem 1.6rem', borderRadius: '0.6rem', fontWeight: 600, cursor: 'pointer' }}>
          Se connecter
        </button>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 2rem 6rem' }}>
        {authStep === 'landing' && (
          <div style={{ textAlign: 'center', maxWidth: '1000px', width: '100%' }}>
            <h1 style={{ fontSize: '4.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Apprends plus vite,<br /><span style={{ color: '#00A37A' }}>réussis mieux.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#555', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
              L'IA souveraine conçue pour le programme scolaire camerounais.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.5rem' }}>
              {features.map((f, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E5E5E0', borderRadius: '1.2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                  <span style={{ fontWeight: 600 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORMULAIRE AUTH — composants importés séparément */}
        {authStep === 'identity' && (
          <div style={cardStyle}>
            {isLoginMode
              ? <LoginForm onLogin={handleLogin} onSwitch={() => setIsLoginMode(false)} isLoading={isLoading} />
              : <SignupForm onNext={handleSignupNext} onSwitch={() => setIsLoginMode(true)} />
            }
          </div>
        )}

        {/* CHOIX DU RÔLE */}
        {authStep === 'role' && (
          <div style={cardStyle}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '1.8rem' }}>Vous êtes...</h2>
            {[
              { role: 'student', label: 'Élève', sub: 'Secondaire — 6ème à Terminale', color: '#7C6FFF' },
              { role: 'university', label: 'Étudiant', sub: 'Supérieur — LMD, BTS, Grandes Écoles', color: '#00D4AA' },
              { role: 'teacher', label: 'Tuteur / Expert', sub: 'Enseignant ou Professionnel', color: '#F59E0B' },
            ].map(r => (
              <button key={r.role} onClick={() => { setProfileData({ ...profileData, role: r.role }); setAuthStep('details'); }}
                style={{ width: '100%', padding: '1.5rem', borderRadius: '1.2rem', background: 'white', border: `2px solid ${r.color}`, textAlign: 'left', cursor: 'pointer', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{r.label}</div>
                <div style={{ fontSize: '0.9rem', color: '#6E6E6B', marginTop: '4px' }}>{r.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* DÉTAILS DU PROFIL */}
        {authStep === 'details' && (
          <div style={cardStyle}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Votre parcours</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {profileData.role === 'student' && (<>
                <select value={profileData.level} onChange={e => setProfileData({ ...profileData, level: e.target.value })} style={selectStyle}>
                  <option value="">Classe</option><option value="Tle">Terminale</option><option value="1ère">Première</option><option value="3ème">Troisième</option>
                </select>
                <select value={profileData.exam} onChange={e => setProfileData({ ...profileData, exam: e.target.value })} style={selectStyle}>
                  <option value="">Examen préparé</option><option value="BACC">BACC</option><option value="PROBATOIRE">Probatoire</option><option value="BEPC">BEPC</option>
                </select>
                <select value={profileData.series} onChange={e => setProfileData({ ...profileData, series: e.target.value })} style={selectStyle}>
                  <option value="">Série</option>
                  <optgroup label="Scientifique"><option value="C">C — Maths/Physique</option><option value="D">D — SVT/Chimie</option></optgroup>
                  <optgroup label="Littéraire"><option value="A1">A1</option><option value="A2">A2</option><option value="A3">A3</option><option value="A4">A4</option></optgroup>
                  <optgroup label="Économique"><option value="SES">SES / ES</option></optgroup>
                </select>
              </>)}
              {profileData.role === 'university' && (<>
                <select value={profileData.level} onChange={e => setProfileData({ ...profileData, level: e.target.value })} style={selectStyle}>
                  <option value="">Niveau</option><option value="BAC+2">BAC+2 / BTS / HND</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="Master">Master</option><option value="Doctorat">Doctorat</option>
                </select>
                <select value={profileData.domain} onChange={e => setProfileData({ ...profileData, domain: e.target.value })} style={selectStyle}>
                  <option value="">Domaine</option><option value="Sciences">Sciences & Tech</option><option value="Santé">Médecine / Santé</option><option value="Droit">Droit / Sc. Po</option><option value="Eco">Économie / Gestion</option><option value="Lettres">Lettres / Arts</option>
                </select>
                <input type="text" placeholder="Filière (ex : Génie Logiciel)" value={profileData.filiere} onChange={e => setProfileData({ ...profileData, filiere: e.target.value })} style={inputStyle2} />
              </>)}
              {profileData.role === 'teacher' && (<>
                <select value={profileData.grade} onChange={e => setProfileData({ ...profileData, grade: e.target.value })} style={selectStyle}>
                  <option value="">Grade / Titre</option><option value="PLEG">PLEG</option><option value="PCEG">PCEG</option><option value="PENI">PENI</option><option value="Expert">Expert / Professionnel</option>
                </select>
                <input type="text" placeholder="Discipline (ex : Mathématiques)" value={profileData.discipline} onChange={e => setProfileData({ ...profileData, discipline: e.target.value })} style={inputStyle2} />
                <input type="text" placeholder="Établissement" value={profileData.school} onChange={e => setProfileData({ ...profileData, school: e.target.value })} style={inputStyle2} />
              </>)}
              <button onClick={handleSignupFinal} disabled={isLoading} style={{ ...btnDark, marginTop: '0.5rem' }}>
                {isLoading ? 'Création en cours...' : 'Finaliser mon profil'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#1A1A1A', color: '#94A3B8', padding: '5rem 3rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
          <div>
            <img src="/logo.png" alt="LAURA" style={{ height: '44px', marginBottom: '1.5rem', filter: 'brightness(0) invert(1)' }} />
            <p style={{ lineHeight: 1.7 }}>L'IA dédiée à la réussite académique au Cameroun.</p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Produit</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <li style={{ cursor: 'pointer' }}>Fonctionnalités</li>
              <li style={{ cursor: 'pointer' }}>Tuteurs Experts</li>
              <li style={{ cursor: 'pointer' }}>Tarification</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Ressources</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <li style={{ cursor: 'pointer' }}>Centre d'aide</li>
              <li style={{ cursor: 'pointer' }}>Blog Éducatif</li>
              <li style={{ cursor: 'pointer' }}>Annales MINESEC</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Légal</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <li style={{ cursor: 'pointer' }}>Confidentialité</li>
              <li style={{ cursor: 'pointer' }}>Conditions</li>
              <li style={{ cursor: 'pointer' }}>Contact</li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem', textAlign: 'center', color: '#6E6E6B' }}>
          <p>LAURA AI © 2026 — Fabriqué au Cameroun 🇨🇲</p>
        </div>
      </footer>
    </div>
  );

  if (user.status === 'pending') return (
    <div style={{ minHeight: '100vh', background: '#F5F4EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Dossier en attente</h2>
      <p style={{ color: '#6E6E6B', margin: '1rem 0 2rem' }}>Votre profil Tuteur est en cours de validation par l'administration.</p>
      <button onClick={handleLogout} style={{ background: '#1A1A1A', color: 'white', padding: '0.8rem 2rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retour</button>
    </div>
  );

  // INTERFACE CHAT APPRENANT
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9F9F8', color: '#1D1D1D' }}>
      <aside style={{ width: '280px', background: '#F0F0EE', borderRight: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', marginBottom: '2.5rem', cursor: 'pointer' }} onClick={() => setMessages([])} />
        </div>
        <div style={{ padding: '1.5rem', borderTop: '1px solid #E5E5E2', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleLogout}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#00D4AA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{user.prenom?.[0]}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: '0.8rem', color: '#6E6E6B' }}>{user.level} · {user.series || user.filiere}</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: messages.length === 0 ? 'center' : 'flex-start', padding: '2rem 4rem', fontFamily: "'Inter', sans-serif" }}>
        {messages.length === 0
          ? <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 600 }}>Bonjour, {user.prenom}.</h1>
              <p style={{ color: '#6E6E6B', fontSize: '1.2rem', marginTop: '0.8rem' }}>Comment puis-je t'aider aujourd'hui ?</p>
            </div>
          : <div style={{ width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '10rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: m.role === 'user' ? '#00D4AA' : '#E8E8E6', flexShrink: 0 }} />
                  <div style={{ fontSize: '1.1rem', lineHeight: 1.75 }}>{m.text}</div>
                </div>
              ))}
            </div>
        }
        <div style={{ width: '100%', maxWidth: '860px', background: 'white', borderRadius: '1.5rem', border: '1px solid #E5E5E2', padding: '1.2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', position: messages.length === 0 ? 'relative' : 'fixed', bottom: messages.length === 0 ? 'auto' : '2.5rem' }}>
          <textarea rows="2" placeholder="Pose ta question..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.1rem', resize: 'none', fontFamily: 'inherit' }} value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={handleSend} disabled={isLoading} style={{ background: '#1D1D1D', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              {isLoading ? '...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await login(email, password);
      
      // On récupère le profil pour la redirection
      const docRef = doc(db, 'users', userCred.user.uid);
      const docSnap = await getDoc(docRef);
      
      let role = 'student';
      let isTutor = false;

      if (docSnap.exists()) {
        const data = docSnap.data();
        isTutor = !!data.isTutor;
        role = data.role || (isTutor ? 'teacher' : 'student');
      }

      // SELF-HEALING: Check if there's any document with the same email that was validated as tutor
      if (role !== 'teacher' || !isTutor) {
        const q = query(collection(db, 'users'), where('email', '==', userCred.user.email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docItem) => {
          const itemData = docItem.data();
          if (itemData.isTutor || itemData.role === 'teacher' || itemData.roleLabel === 'Tuteur') {
            isTutor = true;
            role = 'teacher';
          }
        });

        // Merge the corrected tutor status into the real user document
        if (isTutor) {
          await setDoc(docRef, {
            isTutor: true,
            isTutorPending: false,
            statut: 'active',
            role: 'teacher',
            roleLabel: 'Tuteur'
          }, { merge: true });
        }
      }
      
      if (role === 'teacher') navigate('/tutor/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/learn/dashboard');
      
    } catch (err) {
      console.error(err);
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--laura-text-primary)' }}>
          Connexion à LAURA
        </h1>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--laura-text-2)' }}>Adresse e-mail</label>
            <input 
              type="email" 
              placeholder="vous@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--laura-border-strong)', background: 'var(--laura-bg-input)', color: 'var(--laura-text-1)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--laura-text-2)' }}>Mot de passe</label>
              <span style={{ fontSize: '0.85rem', color: 'var(--laura-primary)', fontWeight: 600, cursor: 'pointer' }}>Oublié ?</span>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--laura-border-strong)', background: 'var(--laura-bg-input)', color: 'var(--laura-text-1)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '1rem', background: 'var(--laura-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
          <p style={{ color: 'var(--laura-text-secondary)', margin: 0 }}>
            Vous n'avez pas de compte ? <Link to="/signup" style={{ color: 'var(--laura-green)', fontWeight: 700, textDecoration: 'none' }}>S'inscrire</Link>
          </p>
          <p style={{ color: 'var(--laura-text-secondary)', margin: 0 }}>
            Vous souhaitez devenir tuteur ? <Link to="/become-tutor" style={{ color: 'var(--laura-text-primary)', fontWeight: 600, textDecoration: 'underline' }}>Devenez tuteur</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

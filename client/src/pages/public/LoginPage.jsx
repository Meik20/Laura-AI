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
        <h1>Connexion à LAURA</h1>

        {error && (
          <div className="auth-error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Adresse e-mail</label>
            <input 
              type="email" 
              placeholder="vous@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="row row--between">
              <label>Mot de passe</label>
              <span className="forgot-link">Oublié ?</span>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Vous n'avez pas de compte ? <Link to="/signup" className="auth-accent-link">S'inscrire</Link>
          </p>
          <p>
            Vous souhaitez devenir tuteur ? <Link to="/become-tutor" className="auth-underline-link">Devenez tuteur</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

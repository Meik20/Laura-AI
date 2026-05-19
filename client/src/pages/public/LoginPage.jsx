import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('auth.error_empty'));
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
      setError(t('auth.error_invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.login_title')}</h1>

        {error && (
          <div className="auth-error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>{t('auth.email_label')}</label>
            <input 
              type="email" 
              placeholder={t('auth.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="row row--between">
              <label>{t('auth.password_label')}</label>
              <span className="forgot-link">{t('auth.forgot_password')}</span>
            </div>
            <input 
              type="password" 
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? t('auth.login_loading') : t('auth.login_button')}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            {t('auth.no_account')} <Link to="/signup" className="auth-accent-link">{t('auth.signup_link')}</Link>
          </p>
          <p>
            {t('auth.become_tutor_text')} <Link to="/become-tutor" className="auth-underline-link">{t('auth.become_tutor_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

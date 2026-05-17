import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulation de connexion et gestion des données utilisateur
      let savedUser = JSON.parse(localStorage.getItem('laura_user'));
      if (!savedUser) {
        savedUser = {
          prenom: email.split('@')[0],
          roleLabel: 'Élève',
          niveau: 'Terminale D',
          examen: 'BAC'
        };
        localStorage.setItem('laura_user', JSON.stringify(savedUser));
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      // Simulation de redirection basée sur le rôle
      const simulatedRole = 'student'; // À remplacer par le vrai rôle depuis Firestore
      
      if (simulatedRole === 'student') navigate('/learn/dashboard');
      else if (simulatedRole === 'teacher') navigate('/tutor/dashboard');
      else if (simulatedRole === 'admin') navigate('/admin/dashboard');
      
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ background: 'white', padding: '3.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid #E5E5E2' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', color: '#1A1A1A' }}>
          Connexion à LAURA
        </h1>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Adresse e-mail</label>
            <input 
              type="email" 
              placeholder="vous@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Mot de passe</label>
              <span style={{ fontSize: '0.85rem', color: '#00A37A', fontWeight: 600, cursor: 'pointer' }}>Oublié ?</span>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '1rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
          <p style={{ color: '#6E6E6B', margin: 0 }}>
            Vous n'avez pas de compte ? <Link to="/signup" style={{ color: '#00A37A', fontWeight: 700, textDecoration: 'none' }}>S'inscrire</Link>
          </p>
          <p style={{ color: '#6E6E6B', margin: 0 }}>
            Vous souhaitez devenir tuteur ? <Link to="/become-tutor" style={{ color: '#1A1A1A', fontWeight: 600, textDecoration: 'underline' }}>Devenez tuteur</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

const s = {
  input: { padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%', boxSizing: 'border-box', display: 'block' },
  btn:   { padding: '1.1rem', borderRadius: '0.9rem', background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', width: '100%' },
};

export default function LoginForm({ onLogin, onSwitch, isLoading }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!email || !password) return alert('Remplissez tous les champs.');
    onLogin(email, password);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800 }}>Bon retour !</h2>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Adresse e-mail</label>
        <input
          type="email"
          placeholder="vous@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={s.input}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && submit()}
          style={s.input}
        />
      </div>

      <button onClick={submit} disabled={isLoading} style={s.btn}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>

      <p style={{ textAlign: 'center', color: '#6E6E6B', fontSize: '0.95rem' }}>
        Nouveau sur LAURA ?{' '}
        <span onClick={onSwitch} style={{ color: '#00A37A', fontWeight: 700, cursor: 'pointer' }}>
          Créer un compte
        </span>
      </p>
    </div>
  );
}

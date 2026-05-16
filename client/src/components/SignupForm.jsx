import { useState } from 'react';

const s = {
  input: { padding: '1.1rem', borderRadius: '0.9rem', background: '#F9F9F8', border: '1px solid #E5E5E2', outline: 'none', fontSize: '1rem', width: '100%', boxSizing: 'border-box', display: 'block' },
  btn:   { padding: '1.1rem', borderRadius: '0.9rem', background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', width: '100%' },
};

export default function SignupForm({ onNext, onSwitch }) {
  const [nom, setNom]                       = useState('');
  const [prenom, setPrenom]                 = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const submit = () => {
    if (!nom || !prenom || !email || !password || !passwordConfirm)
      return alert('Veuillez remplir tous les champs.');
    if (password.length < 6)
      return alert('Le mot de passe doit contenir au moins 6 caractères.');
    if (password !== passwordConfirm)
      return alert('Les mots de passe ne correspondent pas.');
    onNext({ nom, prenom, email, password });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800 }}>Créer un compte</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Nom</label>
          <input type="text" placeholder="Kameni" value={nom} onChange={e => setNom(e.target.value)} style={s.input} />
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Prénom</label>
          <input type="text" placeholder="Armel" value={prenom} onChange={e => setPrenom(e.target.value)} style={s.input} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Adresse e-mail</label>
        <input type="email" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} style={s.input} />
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={s.input} />
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
        <input type="password" placeholder="••••••••" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onKeyPress={e => e.key === 'Enter' && submit()} style={s.input} />
      </div>

      <button onClick={submit} style={s.btn}>Continuer →</button>

      <p style={{ textAlign: 'center', color: '#6E6E6B', fontSize: '0.95rem' }}>
        Déjà inscrit ?{' '}
        <span onClick={onSwitch} style={{ color: '#00A37A', fontWeight: 700, cursor: 'pointer' }}>
          Se connecter
        </span>
      </p>
    </div>
  );
}

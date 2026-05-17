import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function TutorSettingsPage() {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    theme: 'clair',
    rythmeSoumission: 'hebdomadaire'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (userProfile?.preferences) {
      setSettings(userProfile.preferences);
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), { preferences: settings });
      setSuccessMsg("Paramètres tuteur enregistrés avec succès !");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des paramètres :", err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: '#F9F9F8', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#444' };
  const cardStyle = { background: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Paramètres Tuteur</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Personnalisez votre espace pédagogique et vos préférences de notification.
        </p>
      </div>

      <div style={cardStyle}>
        {successMsg && (
          <div style={{ padding: '1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '0.75rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid #A7F3D0' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0EE', paddingBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '1.1rem', marginBottom: '0.2rem' }}>Notifications de révision</div>
              <div style={{ fontSize: '0.9rem', color: '#6E6E6B' }}>Recevoir un email lorsque l'administration commente ou valide vos soumissions.</div>
            </div>
            <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} style={{ width: '24px', height: '24px', accentColor: '#00D4AA', cursor: 'pointer' }} />
          </div>

          <div style={{ borderBottom: '1px solid #F0F0EE', paddingBottom: '1.5rem' }}>
            <label style={labelStyle}>Thème de l'interface</label>
            <select name="theme" value={settings.theme} onChange={handleChange} style={inputStyle}>
              <option value="clair">Thème Clair (Par défaut)</option>
              <option value="sombre">Thème Sombre</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Rythme de soumission souhaité</label>
            <select name="rythmeSoumission" value={settings.rythmeSoumission} onChange={handleChange} style={inputStyle}>
              <option value="occasionnel">Occasionnel (1-2 ressources par mois)</option>
              <option value="hebdomadaire">Hebdomadaire (1 ressource par semaine)</option>
              <option value="intensif">Intensif (Plusieurs ressources par semaine)</option>
            </select>
          </div>

          <button type="submit" disabled={isSaving} style={{ padding: '1rem', background: isSaving ? '#6E6E6B' : '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'background 0.2s' }} onMouseEnter={e => !isSaving && (e.currentTarget.style.background = '#333')} onMouseLeave={e => !isSaving && (e.currentTarget.style.background = '#1A1A1A')}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </button>

        </form>
      </div>

    </div>
  );
}

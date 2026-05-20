import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function TutorSettingsPage() {
  const { currentUser, userProfile } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    theme: 'clair',
    rythmeSoumission: 'hebdomadaire'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const uid = currentUser?.uid || userProfile?.uid;

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
    if (!uid) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await updateDoc(doc(db, 'users', uid), { preferences: settings });
      setSuccessMsg("Paramètres tuteur enregistrés avec succès !");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des paramètres :", err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="stack stack--lg animate-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div>
        <h1 className="laura-h1">Paramètres Tuteur</h1>
        <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
          Personnalisez votre espace pédagogique et vos préférences de notification.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        {successMsg && (
          <div className="badge badge--green" style={{ padding: 'var(--sp-3)', width: '100%', boxSizing: 'border-box', marginBottom: 'var(--sp-5)', justifyContent: 'center', fontSize: 'var(--tx-sm)' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack stack--lg">
          
          <div className="row row--between" style={{ alignItems: 'center', borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-4)', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)', fontSize: 'var(--tx-base)', marginBottom: 'var(--sp-1)' }}>Notifications de révision</div>
              <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>Recevoir un email lorsque l'administration commente ou valide vos soumissions.</div>
            </div>
            <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: 'var(--clr-brand)', cursor: 'pointer' }} />
          </div>

          <div style={{ borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-4)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--sp-2)' }}>Thème de l'interface</label>
            <input
              type="text"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              list="tutor-theme-suggestions"
              placeholder="Thème Clair (Par défaut)"
            />
            <datalist id="tutor-theme-suggestions">
              <option value="clair">Thème Clair (Par défaut)</option>
              <option value="sombre">Thème Sombre</option>
            </datalist>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--sp-2)' }}>Rythme de soumission souhaité</label>
            <input
              type="text"
              name="rythmeSoumission"
              value={settings.rythmeSoumission}
              onChange={handleChange}
              list="tutor-rythme-suggestions"
              placeholder="Hebdomadaire (1 ressource par semaine)"
            />
            <datalist id="tutor-rythme-suggestions">
              <option value="occasionnel">Occasionnel (1-2 ressources par mois)</option>
              <option value="hebdomadaire">Hebdomadaire (1 ressource par semaine)</option>
              <option value="intensif">Intensif (Plusieurs ressources par semaine)</option>
            </datalist>
          </div>

          <button type="submit" disabled={isSaving} className="laura-btn laura-btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: '44px', marginTop: 'var(--sp-4)', fontSize: 'var(--tx-base)' }}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </button>

        </form>
      </div>

    </div>
  );
}

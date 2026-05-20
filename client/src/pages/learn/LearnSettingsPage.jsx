import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function LearnSettingsPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    theme: 'clair',
    rythme: 'regulier',
    objectifNote: '16'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (userProfile) {
      if (userProfile.preferences) {
        setSettings(userProfile.preferences);
      } else {
        setSettings({
          notifications: userProfile.notifications !== undefined ? userProfile.notifications : true,
          theme: userProfile.theme || 'clair',
          rythme: userProfile.rythme || 'regulier',
          objectifNote: userProfile.objectifNote || '16'
        });
      }
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
      await updateDoc(doc(db, 'users', userProfile.uid), { 
        preferences: settings,
        notifications: settings.notifications,
        theme: settings.theme,
        rythme: settings.rythme,
        objectifNote: settings.objectifNote
      });
      setSuccessMsg(t('learn.settings.success', "Paramètres enregistrés avec succès !"));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des paramètres :", err);
      alert(t('learn.settings.error', "Erreur lors de la mise à jour."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>{t('learn.settings.title', 'Paramètres')}</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          {t('learn.settings.subtitle', "Personnalisez votre expérience d'apprentissage sur LAURA.")}
        </p>
      </div>

      <div className="learn-card">
        {successMsg && (
          <div style={{ padding: '1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '0.75rem', fontWeight: 600, marginBottom: '2rem', border: '1px solid #A7F3D0' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="setting-item">
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '13px', marginBottom: '0.125rem' }}>
                {t('learn.settings.notifications.title', 'Notifications de rappel')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {t('learn.settings.notifications.desc', 'Recevoir des rappels pour vos sessions de révision planifiées.')}
              </div>
            </div>
            <div 
              className={`toggle ${settings.notifications ? 'active' : ''}`} 
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })} 
            />
          </div>

          <div className="divider" />

          <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label>{t('learn.settings.theme.title', "Thème de l'interface")}</label>
            <input
              type="text"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              list="learn-theme-suggestions"
              placeholder={t('learn.settings.theme.light', 'Thème Clair (Par défaut)')}
              style={{ width: '100%' }}
            />
            <datalist id="learn-theme-suggestions">
              <option value="clair">{t('learn.settings.theme.light', 'Thème Clair (Par défaut)')}</option>
              <option value="sombre">{t('learn.settings.theme.dark', 'Thème Sombre')}</option>
            </datalist>
          </div>

          <div className="divider" />

          <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label>{t('learn.settings.pace.title', 'Rythme de travail souhaité')}</label>
            <input
              type="text"
              name="rythme"
              value={settings.rythme}
              onChange={handleChange}
              list="learn-rythme-suggestions"
              placeholder={t('learn.settings.pace.regular', 'Régulier (1h par jour - Recommandé)')}
              style={{ width: '100%' }}
            />
            <datalist id="learn-rythme-suggestions">
              <option value="modere">{t('learn.settings.pace.moderate', 'Modéré (15-30 min par jour)')}</option>
              <option value="regulier">{t('learn.settings.pace.regular', 'Régulier (1h par jour - Recommandé)')}</option>
              <option value="intensif">{t('learn.settings.pace.intensive', 'Intensif (2h+ par jour - Préparation examen)')}</option>
            </datalist>
          </div>

          <div className="divider" />

          <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label>{t('learn.settings.goal.title', 'Objectif de moyenne générale (sur 20)')}</label>
            <input type="number" name="objectifNote" min="10" max="20" value={settings.objectifNote} onChange={handleChange} style={{ width: '100%' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              {t('learn.settings.goal.desc', 'LAURA adaptera la difficulté de ses explications et quiz pour atteindre cet objectif.')}
            </span>
          </div>

          <div style={{ padding: '0.875rem 1rem' }}>
            <button type="submit" disabled={isSaving} className="primary" style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSaving ? t('learn.settings.saving', 'Enregistrement...') : t('learn.settings.save_btn', 'Enregistrer les préférences')}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

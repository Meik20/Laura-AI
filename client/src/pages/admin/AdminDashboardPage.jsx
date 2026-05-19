import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Élèves', value: '...', icon: '🎒', color: 'var(--laura-primary)' },
    { label: 'Étudiants', value: '...', icon: '🎓', color: 'var(--laura-accent)' },
    { label: 'Tuteurs (Total)', value: '...', icon: '👨‍🏫', color: 'var(--laura-success)' },
    { label: 'Contributeurs', value: '...', icon: '⭐', color: 'var(--laura-warning)' }
  ]);
  const [alerts, setAlerts] = useState([]);
  const [chatActivity, setChatActivity] = useState([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let eleves = 0, etudiants = 0, tuteurs = 0, pendingTutors = 0, pendingContributors = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.roleLabel === 'Élève') eleves++;
          if (data.roleLabel === 'Étudiant') etudiants++;
          if (data.isTutor) tuteurs++;
          if (data.isTutorPending) pendingTutors++;
          if (data.statut === 'En attente de contribution') pendingContributors++;
        });

        setStats([
          { label: 'Élèves', value: eleves.toString(), icon: '🎒', color: 'var(--laura-primary)' },
          { label: 'Étudiants', value: etudiants.toString(), icon: '🎓', color: 'var(--laura-accent)' },
          { label: 'Tuteurs (Total)', value: tuteurs.toString(), icon: '👨‍🏫', color: 'var(--laura-success)' },
          { label: 'Contributeurs', value: '0', icon: '⭐', color: 'var(--laura-warning)' }
        ]);

        const dynamicAlerts = [];
        if (pendingTutors > 0) {
          dynamicAlerts.push({ type: 'warning', msg: `${pendingTutors} candidature(s) tuteur(s) en attente de révision.`, link: '/admin/tutor-applications' });
        }
        if (pendingContributors > 0) {
          dynamicAlerts.push({ type: 'warning', msg: `${pendingContributors} demande(s) de droit Contributeur en attente.`, link: '/admin/users' });
        }
        
        try {
          const resSnap = await getDocs(collection(db, 'resources'));
          let pendingRes = 0;
          resSnap.forEach(doc => { if (doc.data().statut === 'brouillon' || doc.data().statut === 'en_attente') pendingRes++; });
          if (pendingRes > 0) {
            dynamicAlerts.push({ type: 'info', msg: `${pendingRes} nouvelle(s) soumission(s) de ressources à valider.`, link: '/admin/resources' });
          }
        } catch (e) {
          console.error(e);
        }

        setAlerts(dynamicAlerts);

        // Fetch real chat activity
        try {
          const chatsSnap = await getDocs(collection(db, 'chats'));
          const dayCounts = [0, 0, 0, 0, 0, 0, 0];
          const now = new Date();
          chatsSnap.forEach(doc => {
            const msgs = doc.data().messages || [];
            msgs.forEach(m => {
              if (m.timestamp) {
                const msgDate = new Date(m.timestamp);
                const diffTime = Math.abs(now - msgDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                  dayCounts[6 - diffDays]++;
                }
              }
            });
          });
          const maxCount = Math.max(...dayCounts, 1);
          const heights = dayCounts.map(c => Math.round((c / maxCount) * 100));
          setChatActivity(heights);
        } catch (e) {
          console.error("Erreur fetch chat activity:", e);
        }

      } catch (err) {
        console.error("Erreur fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="stack stack--lg animate-in">
      
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Vue Globale</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Supervision de l'activité sur LAURA.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-5)' }}>
        {stats.map((s, i) => (
          <div key={i} className="card card--hoverable card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            <div className="row row--between" style={{ marginBottom: 'var(--sp-2)' }}>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <span className="badge" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, color: s.color }}>Actifs</span>
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{s.value}</h3>
            <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
        
        {/* GRAPHIQUE ACTIVITÉ */}
        <div className="card card__body" style={{ flex: 2 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--sp-6)' }}>Activité Chat (7 derniers jours)</h2>
          <div style={{ width: '100%', height: '300px', background: 'var(--srf-raised)', borderRadius: 'var(--rd-lg)', display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-3)', padding: 'var(--sp-4)' }}>
            {chatActivity.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${Math.max(h, 4)}%`, background: h > 0 ? 'var(--grd-brand)' : 'var(--brd-subtle)', borderRadius: 'var(--rd-sm) var(--rd-sm) 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8px', color: h > 0 ? 'white' : 'transparent', fontSize: 'var(--tx-xs)', fontWeight: 700, transition: 'height var(--dur-slow) var(--ease-spring)' }}>
                {h > 0 ? `${h}%` : '0'}
              </div>
            ))}
          </div>
        </div>

        {/* ALERTES ET ACTIONS À PRENDRE */}
        <div className="card card__body" style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--sp-6)' }}>Centre d'action</h2>
          <div className="stack stack--md">
            {alerts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">🎉</span>
                <p className="empty-state__title">Tout est à jour</p>
                <p className="empty-state__text">Aucune action requise pour le moment.</p>
              </div>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className={`alert alert--${a.type}`} style={{ flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{a.msg}</span>
                  <Link to={a.link} style={{ fontSize: 'var(--tx-sm)', fontWeight: 700, textDecoration: 'underline' }}>Traiter l'action</Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

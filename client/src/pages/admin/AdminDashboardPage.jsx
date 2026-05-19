import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Élèves', value: '...', iconClass: 'backpack', color: 'var(--clr-brand)', badgeClass: 'brand' },
    { label: 'Étudiants', value: '...', iconClass: 'school', color: 'var(--clr-brand)', badgeClass: 'brand' },
    { label: 'Tuteurs (Total)', value: '...', iconClass: 'presentation', color: 'var(--clr-green)', badgeClass: 'green' },
    { label: 'Contributeurs', value: '...', iconClass: 'award', color: 'var(--clr-warning)', badgeClass: 'warning' }
  ]);
  const [alerts, setAlerts] = useState([]);
  const [chatActivity, setChatActivity] = useState([
    { count: 0, height: 4 },
    { count: 0, height: 4 },
    { count: 0, height: 4 },
    { count: 0, height: 4 },
    { count: 0, height: 4 },
    { count: 0, height: 4 },
    { count: 0, height: 4 }
  ]);

  const getDayLabels = () => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }
    return labels;
  };

  const dayLabels = getDayLabels();

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
          { label: 'Élèves', value: eleves.toString(), iconClass: 'backpack', color: 'var(--clr-brand)', badgeClass: 'brand' },
          { label: 'Étudiants', value: etudiants.toString(), iconClass: 'school', color: 'var(--clr-brand)', badgeClass: 'brand' },
          { label: 'Tuteurs (Total)', value: tuteurs.toString(), iconClass: 'presentation', color: 'var(--clr-green)', badgeClass: 'green' },
          { label: 'Contributeurs', value: '0', iconClass: 'award', color: 'var(--clr-warning)', badgeClass: 'warning' }
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
          const activityData = dayCounts.map(count => ({
            count,
            height: Math.max(Math.round((count / maxCount) * 100), 5)
          }));
          setChatActivity(activityData);
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
      
      {/* WELCOME HERO PANEL */}
      <div className="hero-panel" style={{ marginBottom: 'var(--sp-2)' }}>
        <div className="hero-panel__body stack stack--xs">
          <h1 style={{ color: 'var(--txt-inverse)', margin: 0, fontSize: 'var(--tx-2xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            Bonjour, Administrateur 👋
          </h1>
          <p style={{ margin: 0, opacity: 0.95, fontSize: 'var(--tx-base)', color: 'var(--txt-inverse)' }}>
            Bienvenue sur votre console de supervision éducative. Suivez l'activité des élèves, étudiants et enseignants de LAURA en temps réel.
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-5)' }}>
        {stats.map((s, i) => (
          <div 
            key={i} 
            className="card card--hoverable card__body" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--sp-3)',
              background: 'var(--srf-base)',
              boxShadow: 'var(--shd-sm)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div className="row row--between" style={{ alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: `color-mix(in srgb, ${s.color} 10%, transparent)`,
                color: s.color
              }}>
                <i className={`ti ti-${s.iconClass}`} style={{ fontSize: '1.4rem' }}></i>
              </div>
              <span className={`badge badge--${s.badgeClass}`}>Actifs</span>
            </div>
            <div>
              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 var(--sp-1) 0', color: 'var(--txt-primary)', letterSpacing: '-0.02em' }}>{s.value}</h3>
              <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{s.label}</span>
            </div>
            
            {/* Soft background glow line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: s.color,
              opacity: 0.8
            }}></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
        
        {/* GRAPHIQUE ACTIVITÉ */}
        <div className="card card__body" style={{ flex: 2, display: 'flex', flexDirection: 'column', background: 'var(--srf-base)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--txt-primary)' }}>
            <i className="ti ti-chart-bar" style={{ color: 'var(--clr-brand)', fontSize: '1.4rem' }}></i>
            Activité Chat (7 derniers jours)
          </h2>
          <div style={{ 
            width: '100%', 
            height: '300px', 
            background: 'var(--srf-raised)', 
            borderRadius: 'var(--rd-lg)', 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 'var(--sp-4)', 
            padding: 'var(--sp-6) var(--sp-6) var(--sp-4) var(--sp-6)',
            boxSizing: 'border-box'
          }}>
            {chatActivity.map((act, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)', height: '100%', justifyContent: 'flex-end' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${act.height}%`, 
                    background: act.count > 0 ? 'var(--grd-brand)' : 'var(--brd-subtle)', 
                    borderRadius: 'var(--rd-sm) var(--rd-sm) 0 0', 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '8px',
                    color: act.count > 0 ? 'white' : 'transparent',
                    fontSize: 'var(--tx-xs)',
                    fontWeight: 700,
                    transition: 'height var(--dur-slow) var(--ease-spring)',
                    boxShadow: act.count > 0 ? '0 4px 12px rgba(79, 110, 247, 0.2)' : 'none'
                  }}
                >
                  {act.count > 0 && <span style={{ opacity: 0.95 }}>{act.count}</span>}
                </div>
                <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', fontWeight: 600 }}>
                  {dayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTES ET ACTIONS À PRENDRE */}
        <div className="card card__body" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--srf-base)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--txt-primary)' }}>
            <i className="ti ti-bell-ringing" style={{ color: 'var(--clr-warning)', fontSize: '1.4rem' }}></i>
            Centre d'action
          </h2>
          <div className="stack stack--md" style={{ flex: 1, justifyContent: 'center' }}>
            {alerts.length === 0 ? (
              <div className="stack" style={{ padding: '2.5rem var(--sp-4)', textAlign: 'center', background: 'var(--srf-raised)', borderRadius: 'var(--rd-lg)', border: '1px dashed var(--brd-strong)', margin: 'auto 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--clr-success-lt)', color: 'var(--clr-success)', margin: '0 auto var(--sp-4) auto' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: '2.2rem' }}></i>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 var(--sp-1) 0', color: 'var(--txt-primary)' }}>Tout est en ordre</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--txt-secondary)' }}>Aucune action requise pour le moment.</p>
              </div>
            ) : (
              <div className="stack stack--sm" style={{ width: '100%' }}>
                {alerts.map((a, i) => (
                  <div key={i} className={`alert alert--${a.type}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', padding: '1rem', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <i className={`ti ti-${a.type === 'warning' ? 'alert-triangle' : 'info-circle'}`} style={{ fontSize: '1.2rem', color: `var(--clr-${a.type})` }}></i>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.msg}</span>
                    </div>
                    <Link to={a.link} className="btn btn--ghost btn--sm" style={{ paddingLeft: 0, height: 'auto', textDecoration: 'underline', color: 'var(--clr-brand)', fontWeight: 700 }}>
                      Traiter l'action <i className="ti ti-arrow-right" style={{ fontSize: '1rem', marginLeft: '4px' }}></i>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

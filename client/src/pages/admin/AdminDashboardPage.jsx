import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Élèves', value: '...', icon: '🎒', color: '#3B82F6' },
    { label: 'Étudiants', value: '...', icon: '🎓', color: '#8B5CF6' },
    { label: 'Tuteurs (Total)', value: '...', icon: '👨‍🏫', color: '#10B981' },
    { label: 'Contributeurs', value: '...', icon: '⭐', color: '#F59E0B' }
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let eleves = 0, etudiants = 0, tuteurs = 0, pendingTutors = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.roleLabel === 'Élève') eleves++;
          if (data.roleLabel === 'Étudiant') etudiants++;
          if (data.isTutor) tuteurs++;
          if (data.isTutorPending) pendingTutors++;
        });

        setStats([
          { label: 'Élèves', value: eleves.toString(), icon: '🎒', color: '#3B82F6' },
          { label: 'Étudiants', value: etudiants.toString(), icon: '🎓', color: '#8B5CF6' },
          { label: 'Tuteurs (Total)', value: tuteurs.toString(), icon: '👨‍🏫', color: '#10B981' },
          { label: 'Contributeurs', value: '0', icon: '⭐', color: '#F59E0B' }
        ]);

        const dynamicAlerts = [];
        if (pendingTutors > 0) {
          dynamicAlerts.push({ type: 'warning', msg: `${pendingTutors} candidature(s) tuteur(s) en attente de révision.`, link: '/admin/tutor-applications' });
        }
        
        // On vérifie s'il y a des ressources en brouillon/soumises
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

      } catch (err) {
        console.error("Erreur fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  const cardStyle = { background: '#0F1520', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Tableau de bord</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>
            Vue globale de l'activité sur LAURA.
          </p>
        </div>
      </div>

      {/* KPI CARDS (Point 17.2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <span style={{ background: `${s.color}20`, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>Actifs</span>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{s.value}</h3>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        
        {/* GRAPHIQUE ACTIVITÉ (Simulé) */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700 }}>Activité Chat (7 derniers jours)</h2>
          <div style={{ width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem' }}>
            {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(to top, #3B82F6, #60A5FA)', borderRadius: '0.5rem 0.5rem 0 0', opacity: 0.8 }}></div>
            ))}
          </div>
        </div>

        {/* ALERTES ET ACTIONS À PRENDRE (Point 17.3) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 700 }}>Centre d'action</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {alerts.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.95rem' }}>Aucune action requise pour le moment.</div>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${a.type === 'warning' ? '#F59E0B' : a.type === 'error' ? '#DC2626' : '#3B82F6'}`, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <span style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.5 }}>{a.msg}</span>
                    <Link to={a.link} style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start' }}>Traiter →</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function TutorDashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [submissionCounts, setSubmissionCounts] = useState({ brouillons: 0, enRevue: 0, valides: 0 });
  const [adminMessages, setAdminMessages] = useState([]);

  const uid = currentUser?.uid || userProfile?.uid;

  const tutorData = {
    nom: userProfile?.nom || userProfile?.prenom || 'Tuteur',
    statut: userProfile?.statut || userProfile?.roleLabel || 'En attente',
    discipline: userProfile?.discipline || userProfile?.filiere || 'Général'
  };

  useEffect(() => {
    async function fetchTutorData() {
      if (!uid) return;
      try {
        const resSnap = await getDocs(collection(db, 'resources'));
        let b = 0, r = 0, v = 0;
        resSnap.forEach(docItem => {
          const data = docItem.data();
          if (data.auteurId === uid) {
            if (data.statut === 'brouillon') b++;
            else if (data.statut === 'en_attente' || data.statut === 'en_revue') r++;
            else if (data.statut === 'publie' || data.statut === 'valide') v++;
          }
        });
        setSubmissionCounts({ brouillons: b, enRevue: r, valides: v });

        const msgSnap = await getDocs(collection(db, 'users', uid, 'messages'));
        const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminMessages(msgs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Erreur fetch tutor data:", err);
      }
    }
    fetchTutorData();
  }, [uid]);

  const handleRequestContributor = async () => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'users', uid), { statut: 'En attente de contribution' }, { merge: true });
      alert("Votre demande a été envoyée à l'administration.");
    } catch (err) {
      console.error("Erreur demande contributeur:", err);
      alert("Erreur lors de l'envoi de la demande.");
    }
  };

  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Espace Tuteur', icon: '👤' },
    { id: 'tools', label: 'Boîte à Outils', icon: '🛠️' },
    { id: 'messages', label: 'Messages Admin', icon: '✉️' },
    { id: 'submissions', label: 'Mes Soumissions', icon: '📤' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="laura-h1">Bonjour Pr. {tutorData.nom}</h1>
          <p className="laura-body" style={{ color: 'var(--laura-text-2)' }}>
            Espace de préparation pédagogique · <strong>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" className="laura-btn laura-btn-primary">
          <span>💬</span> Chat Pédagogique
        </Link>
      </div>

      {/* TABS NAVBAR */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--laura-border-soft)', overflowX: 'auto' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--laura-primary)' : '3px solid transparent',
                color: isActive ? 'var(--laura-primary)' : 'var(--laura-text-2)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div style={{ minHeight: '300px' }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            {/* STATUT ET DROITS */}
            <div className={`laura-card ${tutorData.statut === 'Contributeur' ? 'laura-alert-success' : tutorData.statut === 'En attente de contribution' ? 'laura-alert-warning' : 'laura-alert-info'}`} style={{ border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h2 className="laura-h2" style={{ margin: 0 }}>Statut de votre compte</h2>
                <span className={`laura-badge laura-badge-${tutorData.statut === 'Contributeur' ? 'success' : tutorData.statut === 'En attente de contribution' ? 'warning' : 'info'}`}>
                  {tutorData.statut}
                </span>
              </div>
              {tutorData.statut === 'Contributeur' ? (
                <p className="laura-body">
                  Vous disposez des droits complets. Vous pouvez concevoir, soumettre et modifier des contenus pédagogiques sur la plateforme.
                </p>
              ) : tutorData.statut === 'En attente de contribution' ? (
                <p className="laura-body">
                  Votre demande de statut Contributeur est en cours d'examen par l'équipe administrative. Vous serez notifié dès son approbation.
                </p>
              ) : (
                <p className="laura-body">
                  Votre compte est validé pour l'usage personnel. <strong>Demandez le statut Contributeur</strong> pour soumettre vos propres exercices à la communauté.
                </p>
              )}
              {tutorData.statut !== 'Contributeur' && tutorData.statut !== 'En attente de contribution' && (
                <button onClick={handleRequestContributor} className="laura-btn laura-btn-primary" style={{ marginTop: '1rem' }}>
                  Demander les droits contributeur
                </button>
              )}
            </div>

            {/* ACTILINE SUMMARY GRID */}
            <div className="laura-card" style={{ background: 'var(--laura-bg-soft)' }}>
              <h3 className="laura-h3" style={{ marginBottom: '4px' }}>Résumé d'Activité</h3>
              <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: 'var(--sp-5)' }}>Vos statistiques clés en tant que tuteur LAURA.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
                <div className="laura-card" style={{ textAlign: 'center', padding: 'var(--sp-5)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--laura-text-1)' }}>{submissionCounts.valides}</div>
                  <div style={{ fontSize: '13px', color: 'var(--laura-success)', fontWeight: 700, marginTop: '8px' }}>Validées & Publiées</div>
                </div>
                <div className="laura-card" style={{ textAlign: 'center', padding: 'var(--sp-5)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--laura-text-1)' }}>{submissionCounts.enRevue}</div>
                  <div style={{ fontSize: '13px', color: 'var(--laura-warning)', fontWeight: 700, marginTop: '8px' }}>En cours de revue</div>
                </div>
                <div className="laura-card" style={{ textAlign: 'center', padding: 'var(--sp-5)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--laura-text-1)' }}>{submissionCounts.brouillons}</div>
                  <div style={{ fontSize: '13px', color: 'var(--laura-text-3)', fontWeight: 700, marginTop: '8px' }}>Brouillons</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div className="laura-card">
              <h2 className="laura-h2" style={{ marginBottom: '8px' }}>Boîte à outils pédagogique</h2>
              <p className="laura-body" style={{ color: 'var(--laura-text-2)', marginBottom: 'var(--sp-6)' }}>Accédez à vos outils de création assistée par IA et de partage.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
                <Link to="/tutor/chat" className="laura-card-soft" style={{ padding: 'var(--sp-6)', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📝</span>
                  <strong className="laura-h3" style={{ display: 'block', color: 'var(--laura-text-1)' }}>Générer un plan de cours</strong>
                  <span className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Utilisez l'intelligence artificielle pour structurer vos leçons et formuler des exercices pertinents.</span>
                </Link>
                <Link to="/tutor/submissions" className="laura-card-soft" style={{ padding: 'var(--sp-6)', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📤</span>
                  <strong className="laura-h3" style={{ display: 'block', color: 'var(--laura-text-1)' }}>Soumettre un contenu</strong>
                  <span className="laura-body" style={{ color: 'var(--laura-text-2)' }}>Téléversez et cataloguez vos quiz, épreuves et autres ressources d'apprentissage validées.</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div className="laura-card" style={{ background: 'var(--laura-text-1)', color: 'white' }}>
              <h2 className="laura-h2" style={{ marginBottom: 'var(--sp-6)', color: 'white' }}>Centre de communication administrative</h2>
              {adminMessages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                  {adminMessages.map(msg => (
                    <div key={msg.id} style={{ background: 'rgba(255,255,255,0.06)', padding: 'var(--sp-5)', borderRadius: 'var(--r-md)', borderLeft: '4px solid var(--laura-primary)' }}>
                      <strong style={{ display: 'block', fontSize: '15px', marginBottom: '8px', color: 'var(--laura-primary)' }}>{msg.title || 'Message Admin'}</strong>
                      <span className="laura-body" style={{ color: 'rgba(255,255,255,0.8)' }}>{msg.content || msg.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="laura-empty" style={{ background: 'transparent' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✉️</span>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>Aucun nouveau message de l'administration pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div className="laura-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="laura-h2" style={{ margin: 0 }}>Mes Contributions & Soumissions</h2>
                  <p className="laura-body" style={{ margin: '4px 0 0 0', color: 'var(--laura-text-2)' }}>État d'approbation et statut de vos contenus.</p>
                </div>
                <Link to="/tutor/submissions" className="laura-btn laura-btn-ghost">Gérer mes fichiers</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--laura-border-soft)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: 'var(--laura-text-1)' }}>Brouillons en attente</span>
                      <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>Contenus non finalisés et non soumis.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--laura-text-3)' }}>{submissionCounts.brouillons}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--laura-border-soft)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>⏳</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: 'var(--laura-text-1)' }}>En cours de revue</span>
                      <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>En attente de validation par l'administration.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--laura-warning)' }}>{submissionCounts.enRevue}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--laura-border-soft)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: 'var(--laura-text-1)' }}>Validés & Publiés</span>
                      <span style={{ fontSize: '13px', color: 'var(--laura-text-2)' }}>Contenus disponibles pour l'ensemble des élèves.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--laura-success)' }}>{submissionCounts.valides}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

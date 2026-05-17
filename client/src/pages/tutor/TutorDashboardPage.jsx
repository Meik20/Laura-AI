import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';

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
        // Fetch submissions
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

        // Fetch admin messages
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

  const [activeTab, setActiveTab] = useState('overview'); // overview, tools, messages, submissions

  const tabs = [
    { id: 'overview', label: 'Espace Tuteur', icon: '👤' },
    { id: 'tools', label: 'Boîte à Outils', icon: '🛠️' },
    { id: 'messages', label: 'Messages Admin', icon: '✉️' },
    { id: 'submissions', label: 'Mes Soumissions', icon: '📤' }
  ];

  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#1A1A1A' }}>Bonjour Pr. {tutorData.nom}</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1rem' }}>
            Espace de préparation pédagogique · <strong style={{ color: '#1A1A1A' }}>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" style={{ padding: '0.8rem 1.5rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#008E6B'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#00A37A'}>
          <span>💬</span> Chat Pédagogique
        </Link>
      </div>

      {/* TABS NAVBAR */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E5E5E2', paddingBottom: '0px', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3.5px solid #00A37A' : '3.5px solid transparent',
                color: isActive ? '#00A37A' : '#6E6E6B',
                fontWeight: isActive ? 800 : 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                marginBottom: '-1.5px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div style={{ minHeight: '300px' }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* STATUT ET DROITS */}
            <div style={{ ...cardStyle, background: tutorData.statut === 'Contributeur' ? '#ECFDF5' : tutorData.statut === 'En attente de contribution' ? '#FEF3C7' : '#F5F4EF', border: tutorData.statut === 'Contributeur' ? '1px solid #A7F3D0' : tutorData.statut === 'En attente de contribution' ? '1px solid #FDE68A' : '1px solid #E5E5E2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800, color: tutorData.statut === 'Contributeur' ? '#065F46' : tutorData.statut === 'En attente de contribution' ? '#92400E' : '#1A1A1A' }}>Statut de votre compte</h2>
                <span style={{ background: tutorData.statut === 'Contributeur' ? '#10B981' : tutorData.statut === 'En attente de contribution' ? '#F59E0B' : '#6B7280', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  {tutorData.statut}
                </span>
              </div>
              {tutorData.statut === 'Contributeur' ? (
                <p style={{ color: '#047857', margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                  Vous disposez des droits complets. Vous pouvez concevoir, soumettre et modifier des contenus pédagogiques sur la plateforme.
                </p>
              ) : tutorData.statut === 'En attente de contribution' ? (
                <p style={{ color: '#92400E', margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                  Votre demande de statut Contributeur est en cours d'examen par l'équipe administrative. Vous serez notifié dès son approbation.
                </p>
              ) : (
                <p style={{ color: '#4B5563', margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                  Votre compte est validé pour l'usage personnel. <strong style={{ color: '#1A1A1A' }}>Demandez le statut Contributeur</strong> pour soumettre vos propres exercices à la communauté.
                </p>
              )}
              {tutorData.statut !== 'Contributeur' && tutorData.statut !== 'En attente de contribution' && (
                <button onClick={handleRequestContributor} style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1A1A1A'}>
                  Demander les droits contributeur
                </button>
              )}
            </div>

            {/* ACTILINE SUMMARY GRID */}
            <div style={{ ...cardStyle, background: '#FAFAFA' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#1A1A1A' }}>Résumé d'Activité</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6E6E6B', fontSize: '0.95rem' }}>Vos statistiques clés en tant que tuteur LAURA.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E5E2', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A1A' }}>{submissionCounts.valides}</div>
                  <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700, marginTop: '0.3rem' }}>Validées & Publiées</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E5E2', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A1A' }}>{submissionCounts.enRevue}</div>
                  <div style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 700, marginTop: '0.3rem' }}>En cours de revue</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E5E2', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A1A' }}>{submissionCounts.brouillons}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 700, marginTop: '0.3rem' }}>Brouillons</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Boîte à outils pédagogique</h2>
              <p style={{ margin: '0 0 2rem 0', color: '#6E6E6B', fontSize: '0.95rem' }}>Accédez à vos outils de création assistée par IA et de partage.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <Link to="/tutor/chat" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '2rem', borderRadius: '1.2rem', textDecoration: 'none', color: '#1A1A1A', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: '#1A1A1A' }}>Générer un plan de cours</strong>
                  <span style={{ fontSize: '0.9rem', color: '#6E6E6B', lineHeight: 1.5 }}>Utilisez l'intelligence artificielle pour structurer vos leçons et formuler des exercices pertinents.</span>
                </Link>
                <Link to="/tutor/submissions" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '2rem', borderRadius: '1.2rem', textDecoration: 'none', color: '#1A1A1A', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📤</span>
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: '#1A1A1A' }}>Soumettre un contenu</strong>
                  <span style={{ fontSize: '0.9rem', color: '#6E6E6B', lineHeight: 1.5 }}>Téléversez et cataloguez vos quiz, épreuves et autres ressources d'apprentissage validées.</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="dark-card" style={{ ...cardStyle, background: '#1A1A1A', color: 'white' }}>
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Centre de communication administrative</h2>
              {adminMessages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {adminMessages.map(msg => (
                    <div key={msg.id} style={{ background: 'rgba(255,255,255,0.06)', padding: '1.5rem', borderRadius: '1rem', borderLeft: '4px solid #00D4AA' }}>
                      <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.5rem', color: '#00D4AA' }}>{msg.title || 'Message Admin'}</strong>
                      <span style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.6 }}>{msg.content || msg.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94A3B8' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✉️</span>
                  <p style={{ fontSize: '1rem', margin: 0 }}>Aucun nouveau message de l'administration pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>Mes Contributions & Soumissions</h2>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#6E6E6B', fontSize: '0.9rem' }}>État d'approbation et statut de vos contenus.</p>
                </div>
                <Link to="/tutor/submissions" style={{ padding: '0.6rem 1.2rem', background: '#E0F2FE', color: '#0369A1', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#BAE6FD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E0F2FE'}>Gérer mes fichiers</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F0F0EE', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: '#1A1A1A' }}>Brouillons en attente</span>
                      <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>Contenus non finalisés et non soumis.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4B5563' }}>{submissionCounts.brouillons}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F0F0EE', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⏳</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: '#1A1A1A' }}>En cours de revue</span>
                      <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>En attente de validation par l'administration.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{submissionCounts.enRevue}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F0F0EE', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', color: '#1A1A1A' }}>Validés & Publiés</span>
                      <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>Contenus disponibles pour l'ensemble des élèves.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{submissionCounts.valides}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

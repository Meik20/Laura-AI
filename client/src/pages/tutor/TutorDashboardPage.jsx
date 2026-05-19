import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function TutorDashboardPage() {
  const navigate = useNavigate();
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
    <div className="stack stack--lg animate-in">
      
      {/* HEADER */}
      <div className="row row--between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="laura-h1">Bonjour Pr. {tutorData.nom}</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Espace de préparation pédagogique · <strong style={{ color: 'var(--txt-primary)' }}>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" className="laura-btn laura-btn-primary" style={{ minHeight: '42px', padding: '0 var(--sp-6)' }}>
          💬 Chat Pédagogique
        </Link>
      </div>

      {/* TABS NAVBAR */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 'var(--sp-2)', borderBottom: '1px solid var(--brd-subtle)', overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--clr-brand)' : '3px solid transparent',
                color: isActive ? 'var(--clr-brand)' : 'var(--txt-secondary)',
                fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-semibold)',
                fontSize: 'var(--tx-sm)',
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease-std)',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              <span style={{ fontSize: 'var(--tx-md)' }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div style={{ minHeight: '340px' }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="stack stack--lg">
            {/* STATUT ET DROITS */}
            <div className={`card ${tutorData.statut === 'Contributeur' ? 'card--tint' : 'card--soft'}`} style={{ padding: 'var(--sp-6)', borderLeft: `6px solid ${tutorData.statut === 'Contributeur' ? 'var(--clr-success)' : tutorData.statut === 'En attente de contribution' ? 'var(--clr-warning)' : 'var(--clr-brand)'}` }}>
              <div className="row row--between" style={{ marginBottom: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                <h2 className="laura-h3" style={{ margin: 0 }}>Statut du compte</h2>
                <span className={`badge ${tutorData.statut === 'Contributeur' ? 'badge--green' : tutorData.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--brand'}`}>
                  {tutorData.statut}
                </span>
              </div>
              {tutorData.statut === 'Contributeur' ? (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  Vous disposez des droits complets de contribution. Vous pouvez concevoir, soumettre et publier des fiches, quiz, et annales directement dans le catalogue de LAURA.
                </p>
              ) : tutorData.statut === 'En attente de contribution' ? (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  Votre demande de statut Contributeur est en cours d'examen par l'équipe administrative. Vous serez notifié dès son approbation.
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  Votre compte est actuellement configuré en accès standard. Vous pouvez soumettre vos propres documents de cours pour validation par l'administration.
                </p>
              )}
              {tutorData.statut !== 'Contributeur' && tutorData.statut !== 'En attente de contribution' && (
                <button onClick={handleRequestContributor} className="laura-btn laura-btn-primary" style={{ marginTop: 'var(--sp-4)', minHeight: '38px' }}>
                  Demander les droits contributeur
                </button>
              )}
            </div>

            {/* ACTILINE SUMMARY GRID */}
            <div className="card" style={{ padding: 'var(--sp-6)', background: 'var(--srf-raised)' }}>
              <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-1)' }}>Résumé d'Activité</h3>
              <p style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-sm)', margin: '0 0 var(--sp-6)' }}>Vos statistiques clés en tant que tuteur LAURA.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.valides}</div>
                  <div className="badge badge--green" style={{ marginTop: 'var(--sp-3)' }}>Validées & Publiées</div>
                </div>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.enRevue}</div>
                  <div className="badge badge--warning" style={{ marginTop: 'var(--sp-3)' }}>En cours de revue</div>
                </div>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.brouillons}</div>
                  <div className="badge" style={{ marginTop: 'var(--sp-3)' }}>Brouillons</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === 'tools' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h2 className="laura-h3" style={{ marginBottom: 'var(--sp-1)' }}>Boîte à outils pédagogique</h2>
              <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>Accédez à vos outils de création assistée par IA et de partage.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
                <Link to="/tutor/chat" className="card card--hoverable" style={{ padding: 'var(--sp-6)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '2.2rem', marginBottom: 'var(--sp-2)' }}>📝</span>
                  <strong className="laura-h3" style={{ color: 'var(--txt-primary)' }}>Générer un plan de cours</strong>
                  <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-snug)' }}>Utilisez l'intelligence artificielle pour structurer vos leçons et formuler des exercices pertinents.</span>
                </Link>
                <Link to="/tutor/submissions" className="card card--hoverable" style={{ padding: 'var(--sp-6)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '2.2rem', marginBottom: 'var(--sp-2)' }}>📤</span>
                  <strong className="laura-h3" style={{ color: 'var(--txt-primary)' }}>Soumettre un contenu</strong>
                  <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-snug)' }}>Téléversez et cataloguez vos quiz, épreuves et autres ressources d'apprentissage validées.</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h2 className="laura-h3" style={{ marginBottom: 'var(--sp-6)' }}>Centre de communication administrative</h2>
              {adminMessages.length > 0 ? (
                <div className="stack stack--md">
                  {adminMessages.map(msg => (
                    <div key={msg.id} className="card card--soft" style={{ padding: 'var(--sp-5)', borderLeft: '4px solid var(--clr-brand)' }}>
                      <strong style={{ display: 'block', fontSize: 'var(--tx-base)', marginBottom: 'var(--sp-2)', color: 'var(--clr-brand)' }}>{msg.title || 'Message Admin'}</strong>
                      <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{msg.content || msg.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-state__icon">✉️</span>
                  <p className="empty-state__title">Aucun message</p>
                  <p style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>Aucun message de l'administration pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <div className="row row--between" style={{ marginBottom: 'var(--sp-6)', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                <div>
                  <h2 className="laura-h3" style={{ margin: 0 }}>Mes Contributions & Soumissions</h2>
                  <p style={{ margin: 'var(--sp-1) 0 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>État d'approbation et statut de vos contenus.</p>
                </div>
                <Link to="/tutor/submissions" className="laura-btn laura-btn-secondary" style={{ minHeight: '36px', fontSize: 'var(--tx-xs)' }}>Gérer mes fichiers</Link>
              </div>
              
              <div className="stack stack--md">
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>Brouillons en attente</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>Contenus non finalisés et non soumis.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)' }}>{submissionCounts.brouillons}</span>
                </div>
                
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>⏳</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>En cours de revue</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>En attente de validation par l'administration.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-warning)' }}>{submissionCounts.enRevue}</span>
                </div>
                
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>Validés & Publiés</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>Contenus disponibles pour l'ensemble des élèves.</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-success)' }}>{submissionCounts.valides}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

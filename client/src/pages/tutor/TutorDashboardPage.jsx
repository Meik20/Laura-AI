import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function TutorDashboardPage() {
  const { userProfile } = useAuth();
  const [submissionCounts, setSubmissionCounts] = useState({ brouillons: 0, enRevue: 0, valides: 0 });
  const [adminMessages, setAdminMessages] = useState([]);

  const tutorData = {
    nom: userProfile?.nom || userProfile?.prenom || 'Tuteur',
    statut: userProfile?.statut || userProfile?.roleLabel || 'En attente',
    discipline: userProfile?.discipline || userProfile?.filiere || 'Général'
  };

  useEffect(() => {
    async function fetchTutorData() {
      if (!userProfile?.uid) return;
      try {
        // Fetch submissions
        const resSnap = await getDocs(collection(db, 'resources'));
        let b = 0, r = 0, v = 0;
        resSnap.forEach(doc => {
          const data = doc.data();
          if (data.auteurId === userProfile.uid) {
            if (data.statut === 'brouillon') b++;
            else if (data.statut === 'en_attente' || data.statut === 'en_revue') r++;
            else if (data.statut === 'publie' || data.statut === 'valide') v++;
          }
        });
        setSubmissionCounts({ brouillons: b, enRevue: r, valides: v });

        // Fetch admin messages
        const msgSnap = await getDocs(collection(db, 'users', userProfile.uid, 'messages'));
        const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminMessages(msgs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Erreur fetch tutor data:", err);
      }
    }
    fetchTutorData();
  }, [userProfile?.uid]);

  const handleRequestContributor = async () => {
    if (!userProfile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), { statut: 'En attente de contribution' });
      alert("Votre demande a été envoyée à l'administration.");
    } catch (err) {
      console.error("Erreur demande contributeur:", err);
    }
  };

  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #E5E5E2' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Bonjour Pr. {tutorData.nom}</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Espace de préparation pédagogique · <strong style={{ color: '#1A1A1A' }}>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" style={{ padding: '0.8rem 1.5rem', background: '#00A37A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span>💬</span> Chat Pédagogique
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* STATUT ET DROITS */}
          <div style={{ ...cardStyle, background: tutorData.statut === 'Contributeur' ? '#ECFDF5' : '#F5F4EF', border: tutorData.statut === 'Contributeur' ? '1px solid #A7F3D0' : '1px solid #E5E5E2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800, color: '#065F46' }}>Statut de votre compte</h2>
              <span style={{ background: tutorData.statut === 'Contributeur' ? '#10B981' : '#6B7280', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 700 }}>
                {tutorData.statut}
              </span>
            </div>
            {tutorData.statut === 'Contributeur' ? (
              <p style={{ color: '#047857', margin: 0, lineHeight: 1.5 }}>
                Vous disposez des droits complets. Vous pouvez concevoir, soumettre et modifier des contenus pédagogiques sur la plateforme.
              </p>
            ) : (
              <p style={{ color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                Votre compte est validé pour l'usage personnel. <strong style={{ color: '#1A1A1A' }}>Demandez le statut Contributeur</strong> pour soumettre vos propres exercices à la communauté.
              </p>
            )}
            {tutorData.statut !== 'Contributeur' && (
              <button onClick={handleRequestContributor} style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                Demander les droits contributeur
              </button>
            )}
          </div>

          {/* OUTILS PÉDAGOGIQUES */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Boîte à outils pédagogique</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Link to="/tutor/chat" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '1.5rem', borderRadius: '1rem', textDecoration: 'none', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Générer un plan de cours</strong>
                <span style={{ fontSize: '0.9rem', color: '#6E6E6B' }}>Utilisez l'IA pour structurer vos leçons.</span>
              </Link>
              <Link to="/tutor/submissions" style={{ background: '#FAFAFA', border: '1px solid #E5E5E2', padding: '1.5rem', borderRadius: '1rem', textDecoration: 'none', color: '#1A1A1A', transition: 'box-shadow 0.2s' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📤</span>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Soumettre un contenu</strong>
                <span style={{ fontSize: '0.9rem', color: '#6E6E6B' }}>Partagez vos quiz et exercices.</span>
              </Link>
            </div>
          </div>

        </div>

        {/* COLONNE DROITE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* MESSAGES ADMIN */}
          <div style={{ ...cardStyle, background: '#1A1A1A', color: 'white' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', fontWeight: 800 }}>Messages Admin</h2>
            {adminMessages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {adminMessages.map(msg => (
                  <div key={msg.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.75rem', borderLeft: '3px solid #00D4AA' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.3rem', color: '#00D4AA' }}>{msg.title || 'Message Admin'}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#CBD5E1', lineHeight: 1.4 }}>{msg.content || msg.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>Aucun nouveau message.</p>
            )}
          </div>

          {/* RÉSUMÉ SOUMISSIONS */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Vos soumissions</h2>
              <Link to="/tutor/submissions" style={{ fontSize: '0.9rem', color: '#00A37A', fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>Brouillons</span>
                <span style={{ fontWeight: 700 }}>{submissionCounts.brouillons}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>En revue</span>
                <span style={{ fontWeight: 700, color: '#F59E0B' }}>{submissionCounts.enRevue}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F0F0EE' }}>
                <span style={{ color: '#444', fontSize: '0.95rem' }}>Validés (Publiés)</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{submissionCounts.valides}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

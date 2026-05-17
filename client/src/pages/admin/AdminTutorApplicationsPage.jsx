import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';

export default function AdminTutorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('isTutorPending', '==', true)));
        setApplications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleValidate = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        isTutor: true,
        isTutorPending: false,
        statut: 'active',
        role: 'teacher',
        roleLabel: 'Tuteur',
        adminMessage: "Félicitations, votre compte Tuteur a été validé avec succès !"
      }, { merge: true });
      setApplications(prev => prev.filter(app => app.id !== userId));
    } catch (e) {
      console.error("Erreur de validation :", e);
      alert("Erreur lors de la validation.");
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'en_attente': return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>En attente</span>;
      case 'test_requis': return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>Test Requis</span>;
      case 'valide': return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>Validé</span>;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* MODAL OUVRIR LE DOSSIER */}
      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0F1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '600px', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Dossier de Candidature</h2>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <div><strong style={{ color: '#94A3B8' }}>Candidat :</strong> {selectedApp.prenom} {selectedApp.nom}</div>
              <div><strong style={{ color: '#94A3B8' }}>Email :</strong> {selectedApp.email}</div>
              <div><strong style={{ color: '#94A3B8' }}>Téléphone :</strong> {selectedApp.telephone || 'Non renseigné'}</div>
              <div><strong style={{ color: '#94A3B8' }}>Discipline :</strong> {selectedApp.discipline} ({selectedApp.niveau})</div>
              <div><strong style={{ color: '#94A3B8' }}>Établissement :</strong> {selectedApp.etablissement || 'Non renseigné'}</div>
              <div><strong style={{ color: '#94A3B8' }}>Diplôme :</strong> {selectedApp.diplome || 'Non renseigné'}</div>
              <div><strong style={{ color: '#94A3B8' }}>Compétences :</strong> {selectedApp.competences || 'Non renseignées'}</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#94A3B8' }}>Motivation :</strong>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{selectedApp.motivation || 'Aucune motivation fournie.'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setSelectedApp(null)} style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
              <button onClick={() => { handleValidate(selectedApp.id); setSelectedApp(null); }} style={{ padding: '0.8rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Valider ce tuteur</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Candidatures Tuteurs</h1>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>
          Gérez et validez les accès enseignants.
        </p>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Candidat</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Discipline</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Expérience</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des candidatures...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucune candidature en attente.</td></tr>
            ) : (
              applications.map((app, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'white' }}>{`${app.prenom || ''} ${app.nom || ''}`.trim() || 'Sans nom'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Inscrit le {app.createdAt ? new Date(app.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>
                    <div style={{ fontWeight: 600 }}>{app.discipline || 'Non précisé'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Niveau: {app.niveau || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1' }}>{app.experience || 'Non précisée'}</td>
                  <td style={{ padding: '1.5rem' }}>{getStatusBadge('en_attente')}</td>
                  <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedApp(app)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        Ouvrir le dossier
                      </button>
                      <button onClick={() => handleValidate(app.id)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                        Valider
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

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
    <div className="stack stack--lg animate-in">
      {/* MODAL OUVRIR LE DOSSIER */}
      {selectedApp && (
        <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Dossier de Candidature</h2>
              <button onClick={() => setSelectedApp(null)} className="modal-close" aria-label="Fermer">✕</button>
            </div>
            
            <div className="modal-panel__body stack stack--md">
              <div className="stack stack--sm" style={{ fontSize: 'var(--tx-sm)' }}>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Candidat :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.prenom} {selectedApp.nom}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Email :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.email}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Téléphone :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.telephone || 'Non renseigné'}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Discipline :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.discipline} ({selectedApp.niveau})</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Établissement :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.etablissement || 'Non renseigné'}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Diplôme :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.diplome || 'Non renseigné'}</span></div>
                <div><strong style={{ color: 'var(--txt-secondary)' }}>Compétences :</strong> <span style={{ color: 'var(--txt-primary)' }}>{selectedApp.competences || 'Non renseignées'}</span></div>
              </div>
              <div style={{ background: 'var(--srf-raised)', padding: 'var(--sp-4)', borderRadius: 'var(--rd-lg)', border: '1px solid var(--brd-subtle)' }}>
                <strong style={{ display: 'block', marginBottom: 'var(--sp-2)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>Motivation :</strong>
                <p style={{ margin: 0, lineHeight: 'var(--lh-relaxed)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{selectedApp.motivation || 'Aucune motivation fournie.'}</p>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', padding: 'var(--sp-4)', borderTop: '1px solid var(--brd-subtle)', gap: 'var(--sp-4)' }}>
              <button onClick={() => setSelectedApp(null)} className="btn btn--secondary">Fermer</button>
              <button onClick={() => { handleValidate(selectedApp.id); setSelectedApp(null); }} className="btn btn--primary" style={{ background: 'var(--clr-success)', color: 'white' }}>Valider ce tuteur</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Candidatures Tuteurs</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Gérez et validez les accès enseignants.
          </p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Candidat</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Discipline</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expérience</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement des candidatures...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Aucune candidature en attente.</td></tr>
              ) : (
                applications.map((app, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--brd-subtle)', background: i % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <strong style={{ display: 'block', color: 'var(--txt-primary)', fontWeight: 'var(--fw-semibold)' }}>{`${app.prenom || ''} ${app.nom || ''}`.trim() || 'Sans nom'}</strong>
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>Inscrit le {app.createdAt ? new Date(app.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span style={{ color: 'var(--txt-primary)', fontWeight: 'var(--fw-medium)', display: 'block' }}>{app.discipline || 'Non précisé'}</span>
                      <span style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>Niveau: {app.niveau || 'N/A'}</span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{app.experience || 'Non précisée'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      {getStatusBadge('en_attente')}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                        <button onClick={() => setSelectedApp(app)} className="btn btn--secondary btn--sm">
                          Ouvrir le dossier
                        </button>
                        <button onClick={() => handleValidate(app.id)} className="btn btn--primary btn--sm" style={{ background: 'var(--clr-success)', color: 'white' }}>
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
    </div>
  );
}

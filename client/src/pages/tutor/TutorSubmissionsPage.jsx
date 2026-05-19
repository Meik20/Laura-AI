import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TutorSubmissionsPage() {
  const { currentUser, userProfile } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('Toutes');

  const uid = currentUser?.uid || userProfile?.uid;

  const isContributor = userProfile?.statut === 'Contributeur' || userProfile?.roleLabel === 'Tuteur' || userProfile?.isTutor;

  useEffect(() => {
    async function fetchSubmissions() {
      if (!uid) {
        setIsLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'resources'));
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.auteurId === uid) {
            list.push({ id: d.id, ...data });
          }
        });
        setSubmissions(list.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      } catch (err) {
        console.error("Erreur fetch submissions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubmissions();
  }, [uid]);

  const getStatusStyle = (statut) => {
    switch (statut) {
      case 'brouillon': return { label: 'Brouillon', cls: '' };
      case 'soumis': 
      case 'en_attente': return { label: 'Soumis', cls: 'badge--pending' };
      case 'en_revue': return { label: 'En revue', cls: 'badge--warning' };
      case 'a_corriger': return { label: 'À corriger', cls: 'badge--error' };
      case 'publie': 
      case 'valide': return { label: 'Validé (Publié)', cls: 'badge--green' };
      case 'rejete': return { label: 'Rejeté', cls: 'badge--error' };
      default: return { label: statut || 'Brouillon', cls: '' };
    }
  };

  if (!isContributor) {
    return (
      <div className="empty-state animate-in" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <span className="empty-state__icon">🔒</span>
        <h2 className="empty-state__title">Espace Soumission Restreint</h2>
        <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>
          Vous devez avoir le statut <strong>Tuteur Contributeur</strong> pour proposer et gérer du contenu sur la plateforme.
        </p>
        <button onClick={() => alert("Demande transmise à l'administration.")} className="laura-btn laura-btn-primary" style={{ minHeight: '44px', padding: '0 var(--sp-6)' }}>
          Faire la demande d'accès
        </button>
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'Toutes') return true;
    if (filter === 'Brouillons') return sub.statut === 'brouillon';
    if (filter === 'En attente') return sub.statut === 'en_attente' || sub.statut === 'soumis' || sub.statut === 'en_revue';
    if (filter === 'À corriger') return sub.statut === 'a_corriger';
    if (filter === 'Validées') return sub.statut === 'publie' || sub.statut === 'valide';
    return true;
  });

  return (
    <div className="stack stack--lg animate-in">
      
      {/* HEADER */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="laura-h1">Vos Soumissions</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Gérez le contenu que vous proposez à la communauté LAURA.
          </p>
        </div>
        <button onClick={() => alert("Utilisez le Chat Pédagogique pour générer et affiner vos contenus avant soumission.")} className="laura-btn laura-btn-primary" style={{ minHeight: '42px', padding: '0 var(--sp-6)' }}>
          + Nouvelle soumission
        </button>
      </div>

      {/* FILTRES RAPIDES */}
      <div className="chip-row">
        {['Toutes', 'Brouillons', 'En attente', 'À corriger', 'Validées'].map((f, i) => (
          <button key={i} onClick={() => setFilter(f)} className="chip" style={{ background: filter === f ? 'var(--clr-brand-lt)' : '', color: filter === f ? 'var(--clr-brand)' : '', borderColor: filter === f ? 'var(--clr-brand)' : '', fontWeight: filter === f ? 'var(--fw-bold)' : '' }}>
            {f}
          </button>
        ))}
      </div>

      {/* TABLEAU DES SOUMISSIONS */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                {['Titre de la ressource', 'Type', 'Niveau Cible', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                    Chargement de vos soumissions...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                    Aucune soumission trouvée.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => {
                  const statusStyle = getStatusStyle(sub.statut);
                  return (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>
                        {sub.titre || 'Sans titre'}
                      </td>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>
                        {sub.type || 'Général'}
                      </td>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>
                        {sub.cible || sub.niveau || 'Général'}
                      </td>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-tertiary)' }}>
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                        <span className={`badge ${statusStyle.cls}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                        <button onClick={() => alert(`Gestion de la ressource : ${sub.titre}`)} className="laura-btn laura-btn-secondary" style={{ minHeight: '30px', padding: '0 var(--sp-3)', fontSize: 'var(--tx-xs)' }}>
                          Gérer
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const TYPE_ICONS = {
  Quiz: '🎲', Annale: '📝', Épreuve: '📜', Fiche: '📋', Livre: '📖'
};
const getIcon = (type) => TYPE_ICONS[type] || '📚';

export default function TutorResourcesPage() {
  const { userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');

  useEffect(() => {
    async function fetchResources() {
      try {
        const snap = await getDocs(collection(db, 'resources'));
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.statut === 'publie' || data.statut === 'valide' || data.auteurId === userProfile?.uid) {
            list.push({ id: d.id, ...data });
          }
        });
        setResources(list);
      } catch (err) {
        console.error("Erreur fetch tutor resources:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResources();
  }, [userProfile?.uid]);

  const filtered = resources.filter(r => {
    const matchesSearch = (r.titre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.matiere || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || selectedType === 'Tous' || (r.type || '').toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="stack stack--lg animate-in">
      
      {/* HEADER */}
      <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="laura-h1">Ressources Pédagogiques</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            Consultez le catalogue partagé par les tuteurs et contributeurs de LAURA.
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Rechercher par titre, matière..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '2 1 300px' }}
          />
          <input 
            type="text"
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            placeholder="Filtrer par type..."
            list="tutor-filter-type-suggestions"
            style={{ flex: '1 1 180px' }}
          />
          <datalist id="tutor-filter-type-suggestions">
            <option value="Tous">Tous les types</option>
            <option value="Épreuve" />
            <option value="Annale" />
            <option value="Fiche" />
            <option value="Quiz" />
            <option value="Livre" />
          </datalist>
        </div>
      </div>

      {/* GRILLE */}
      {isLoading ? (
        <div className="empty-state">
          <span className="empty-state__icon">⏳</span>
          <p className="empty-state__title">Chargement des ressources...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <p className="empty-state__title">Aucune ressource trouvée</p>
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)' }}>
          {filtered.map(res => {
            const icon = getIcon(res.type);
            return (
              <div key={res.id} className="card card--hoverable" style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <div className="row row--between" style={{ alignItems: 'center' }}>
                    <span className="badge">{res.type || 'Général'}</span>
                    <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)', fontWeight: 'var(--fw-semibold)' }}>
                      {res.statut === 'publie' || res.statut === 'valide' ? '✓ En Ligne' : '• Brouillon'}
                    </span>
                  </div>
                  <h3 className="truncate" style={{ fontSize: 'var(--tx-base)', fontWeight: 'var(--fw-bold)', margin: 'var(--sp-2) 0 0', color: 'var(--txt-primary)' }}>
                    {icon} {res.titre || 'Sans titre'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>
                    Matière : <strong style={{ color: 'var(--txt-primary)' }}>{res.matiere || res.discipline || 'Général'}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)' }}>
                    Cible : <strong style={{ color: 'var(--txt-primary)' }}>{res.cible || res.niveau || 'Général'}</strong>
                  </p>
                </div>

                <div style={{ flex: 1 }} />

                <button 
                  onClick={() => res.url ? window.open(res.url, '_blank') : alert(`Contenu de la ressource : ${res.contenu || res.titre}`)} 
                  className="laura-btn laura-btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', minHeight: '36px', fontSize: 'var(--tx-xs)' }}
                >
                  Ouvrir la ressource
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

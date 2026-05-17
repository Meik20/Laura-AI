import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    const matchesType = selectedType === 'Tous' || r.type === selectedType;
    return matchesSearch && matchesType;
  });

  const cardStyle = { background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Ressources Pédagogiques</h1>
          <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
            Consultez le catalogue partagé par les tuteurs et contributeurs de LAURA.
          </p>
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Rechercher par titre, matière..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 300px', padding: '0.9rem 1.2rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: 'white', fontSize: '1rem', outline: 'none' }}
        />
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: '0.9rem 1.2rem', borderRadius: '0.75rem', border: '1px solid #E5E5E2', background: 'white', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="Tous">Tous les types</option>
          <option value="Épreuve">Épreuve</option>
          <option value="Annale">Annale</option>
          <option value="Fiche">Fiche de cours</option>
          <option value="Quiz">Quiz</option>
          <option value="Livre">Livre</option>
        </select>
      </div>

      {/* GRILLE */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6E6E6B', fontSize: '1.1rem' }}>Chargement des ressources...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6E6E6B', fontSize: '1.1rem', background: 'white', borderRadius: '1.5rem', border: '1px solid #E5E5E2' }}>Aucune ressource ne correspond à vos critères.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(res => (
            <div key={res.id} style={cardStyle}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ background: '#F5F4EF', color: '#1A1A1A', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.8rem' }}>{res.type || 'Général'}</span>
                  <span style={{ fontSize: '0.85rem', color: '#6E6E6B' }}>{res.statut === 'publie' || res.statut === 'valide' ? 'Publié' : 'Brouillon'}</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A' }}>{res.titre || 'Sans titre'}</h3>
                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: '#6E6E6B' }}>Matière : {res.matiere || res.discipline || 'Général'} · Cible : {res.cible || res.niveau || 'Général'}</p>
              </div>

              <button onClick={() => res.url ? window.open(res.url, '_blank') : alert(`Contenu de la ressource : ${res.contenu || res.titre}`)} style={{ width: '100%', padding: '0.8rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.6rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                Ouvrir la ressource
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

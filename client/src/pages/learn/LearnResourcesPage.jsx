import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export default function LearnResourcesPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [matieresList, setMatieresList] = useState([]);

  const profileContext = {
    role: userProfile?.roleLabel || (userProfile?.role === 'student' ? 'Élève' : userProfile?.role) || 'Élève',
    niveau: userProfile?.niveau || userProfile?.classe || userProfile?.niveauEtude || 'Terminale',
    serie: userProfile?.serie || '',
    examen: userProfile?.examen || userProfile?.examenEleve || userProfile?.examenEtudiant || 'BAC',
    filiere: userProfile?.filiere || userProfile?.discipline || ''
  };

  const [filters, setFilters] = useState({
    matiere: '', type: '', examen: '', search: ''
  });

  useEffect(() => {
    if (userProfile?.bookmarks) {
      setBookmarks(userProfile.bookmarks);
    }
    if (userProfile) {
      const userExam = userProfile.examen || userProfile.examenEleve || userProfile.examenEtudiant || '';
      setFilters(prev => ({ ...prev, examen: userExam }));
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchInitialData() {
      // Fetch matieres from adminSettings
      try {
        const docRef = doc(db, 'adminSettings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().matieres) {
          setMatieresList(docSnap.data().matieres);
        } else {
          setMatieresList([
            { id: 'm1', nom: 'Mathématiques' },
            { id: 'm2', nom: 'Physique-Chimie' },
            { id: 'm3', nom: 'SVT' },
            { id: 'm4', nom: 'Philosophie' },
            { id: 'm5', nom: 'Français' },
            { id: 'm6', nom: 'Histoire-Géo' },
            { id: 'm7', nom: 'Économie' }
          ]);
        }
      } catch (err) {
        console.error("Erreur chargement matières:", err);
      }

      // Fetch resources
      try {
        const snap = await getDocs(collection(db, 'resources'));
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResources(docs.filter(r => r.statut === 'publie'));
      } catch (err) {
        console.error("Erreur de récupération des ressources :", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const toggleBookmark = async (resId) => {
    if (!userProfile?.uid) return;
    const isBookmarked = bookmarks.includes(resId);
    const updatedBookmarks = isBookmarked ? bookmarks.filter(id => id !== resId) : [...bookmarks, resId];
    setBookmarks(updatedBookmarks);

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      if (isBookmarked) {
        await updateDoc(userRef, { bookmarks: arrayRemove(resId) });
      } else {
        await updateDoc(userRef, { bookmarks: arrayUnion(resId) });
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des favoris :", err);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchMatiere = !filters.matiere || res.cible?.toLowerCase().includes(filters.matiere.toLowerCase()) || res.titre?.toLowerCase().includes(filters.matiere.toLowerCase()) || res.matiere?.toLowerCase().includes(filters.matiere.toLowerCase());
    const matchType = !filters.type || res.type === filters.type;
    const matchExamen = !filters.examen || res.cible?.toLowerCase().includes(filters.examen.toLowerCase()) || res.titre?.toLowerCase().includes(filters.examen.toLowerCase());
    const matchSearch = !filters.search || res.titre?.toLowerCase().includes(filters.search.toLowerCase()) || res.cible?.toLowerCase().includes(filters.search.toLowerCase());
    return matchMatiere && matchType && matchExamen && matchSearch;
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1A1A1A' }}>Ressources</h1>
        <p style={{ margin: 0, color: '#6E6E6B', fontSize: '1.1rem' }}>
          Ressources adaptées à votre profil : <strong style={{ color: '#1A1A1A' }}>{profileContext.niveau} {profileContext.serie} · {profileContext.examen}</strong>
        </p>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #E5E5E2', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          name="search" 
          placeholder="Rechercher par titre ou mot-clé..." 
          value={filters.search} 
          onChange={handleFilterChange} 
          style={{ padding: '0.8rem 1rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '2 1 250px', outline: 'none' }} 
        />
        <select name="matiere" value={filters.matiere} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 180px', outline: 'none' }}>
          <option value="">Toutes les matières</option>
          {matieresList.map(m => (
            <option key={m.id} value={m.nom}>{m.nom}</option>
          ))}
        </select>
        <select name="type" value={filters.type} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 180px', outline: 'none' }}>
          <option value="">Tous les types</option>
          <option value="Épreuve">Épreuve</option>
          <option value="Annale">Annale</option>
          <option value="Fiche">Fiche de cours</option>
          <option value="Quiz">Quiz</option>
          <option value="Livre">Livre / PDF</option>
        </select>
        <select name="examen" value={filters.examen} onChange={handleFilterChange} style={{ padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid #E5E5E2', background: '#F9F9F8', flex: '1 1 180px', outline: 'none' }}>
          <option value="">Tous les examens</option>
          <option value="BAC">BAC</option>
          <option value="Probatoire">Probatoire</option>
          <option value="BEPC">BEPC</option>
          <option value="BTS">BTS</option>
          <option value="Licence">Licence</option>
        </select>
      </div>

      {/* GRILLE DE RESSOURCES */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6E6E6B', fontSize: '1.2rem' }}>Chargement des ressources...</div>
      ) : filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1.2rem', border: '1px solid #E5E5E2', color: '#6E6E6B' }}>
          Aucune ressource ne correspond à vos critères de recherche.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredResources.map(res => {
            const isBookmarked = bookmarks.includes(res.id);
            const icon = res.type === 'Quiz' ? '🎲' : res.type === 'Annale' ? '📝' : res.type === 'Épreuve' ? '📜' : '📚';
            return (
              <div key={res.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid #E5E5E2', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3 }}>{res.titre || 'Sans titre'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      <span style={{ background: '#F5F4EF', color: '#6E6E6B', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{res.type || 'Général'}</span>
                      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>{res.cible || res.matiere || 'Général'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}></div>

                {/* Actions sur la ressource */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F0F0EE', paddingTop: '1rem' }}>
                  <button onClick={() => res.url ? window.open(res.url, '_blank') : navigate('/learn/chat')} style={{ flex: 1, padding: '0.6rem', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
                    Ouvrir
                  </button>
                  <button onClick={() => navigate(`/learn/chat?resourceTitle=${encodeURIComponent(res.titre)}`)} style={{ flex: 1, padding: '0.6rem', background: '#F5F4EF', color: '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E5E2'} onMouseLeave={e => e.currentTarget.style.background = '#F5F4EF'}>
                    LAURA
                  </button>
                  <button onClick={() => toggleBookmark(res.id)} style={{ padding: '0.6rem 0.8rem', background: isBookmarked ? '#FEF3C7' : '#F5F4EF', color: isBookmarked ? '#D97706' : '#1A1A1A', border: '1px solid #E5E5E2', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                    {isBookmarked ? '★' : '☆'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

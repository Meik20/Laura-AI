import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function AdminAccessRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nom: '', critere: '', statut: 'actif' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, 'accessRules'));
        setRules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({ nom: rule.nom || '', critere: rule.critere || '', statut: rule.statut || 'actif' });
    } else {
      setEditingId(null);
      setFormData({ nom: '', critere: '', statut: 'actif' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'accessRules', editingId), formData);
        setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...formData } : r));
      } else {
        const docRef = await addDoc(collection(db, 'accessRules'), { ...formData, createdAt: new Date().toISOString() });
        setRules(prev => [{ id: docRef.id, ...formData }, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la règle.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette règle ?")) return;
    try {
      await deleteDoc(doc(db, 'accessRules', id));
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Règles d'accès</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '1.1rem' }}>Configurez la logique d'accès aux ressources.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.background = '#3B82F6'}
        >
          + Nouvelle Règle
        </button>
      </div>

      <div style={{ background: '#0F1520', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Nom de la règle</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Critères Logiques</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8' }}>Statut</th>
              <th style={{ padding: '1.5rem', fontWeight: 600, color: '#94A3B8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Chargement des règles...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Aucune règle définie.</td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700, color: 'white' }}>{r.nom || 'Sans nom'}</td>
                  <td style={{ padding: '1.5rem', color: '#CBD5E1', fontFamily: 'monospace' }}>{r.critere || 'N/A'}</td>
                  <td style={{ padding: '1.5rem' }}>
                    <span style={{ background: r.statut === 'actif' ? '#10B98120' : '#EF444420', color: r.statut === 'actif' ? '#10B981' : '#EF4444', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      {(r.statut || 'actif').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(r)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Éditer</button>
                      <button onClick={() => handleDelete(r.id)} style={{ background: '#EF444420', color: '#EF4444', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0F1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.2rem', padding: '2.5rem', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{editingId ? 'Modifier la règle' : 'Nouvelle règle d\'accès'}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>Nom de la règle</label>
                <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="ex: Accès Annales Terminale" style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>Critères Logiques</label>
                <input type="text" required value={formData.critere} onChange={e => setFormData({...formData, critere: e.target.value})} placeholder="ex: Niveau = Terminale ET Profil = Élève" style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>Statut</label>
                <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isSaving} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.8rem', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="stack stack--lg animate-in">
      
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Règles d'accès</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>Configurez la logique d'accès aux ressources.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn--primary">
          + Nouvelle Règle
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom de la règle</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critères Logiques</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement des règles...</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Aucune règle définie.</td></tr>
              ) : (
                rules.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>{r.nom || 'Sans nom'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', fontFamily: 'monospace' }}>{r.critere || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${r.statut === 'actif' ? 'badge--green' : 'badge--error'}`}>
                        {(r.statut || 'actif').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                        <button onClick={() => handleOpenModal(r)} className="btn btn--secondary btn--sm">Éditer</button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn--secondary btn--sm" style={{ color: 'var(--clr-error)', borderColor: 'var(--clr-error-lt)' }}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Modifier la règle' : 'Nouvelle règle d\'accès'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close" aria-label="Fermer">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-panel__body stack stack--md">
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Nom de la règle</label>
                <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="ex: Accès Annales Terminale" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Critères Logiques</label>
                <input type="text" required value={formData.critere} onChange={e => setFormData({...formData, critere: e.target.value})} placeholder="ex: Niveau = Terminale ET Profil = Élève" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)', fontFamily: 'monospace' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Statut</label>
                <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})} className="form-select" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn--secondary">Annuler</button>
                <button type="submit" disabled={isSaving} className="btn btn--primary">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

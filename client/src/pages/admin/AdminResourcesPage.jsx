import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { uploadResource } from '../../utils/storage';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ titre: '', type: 'Annale', cible: 'Terminale', statut: 'publie', url: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | 'uploading' | 'done' | 'error'

  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, 'resources'));
        setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenModal = (res = null) => {
    if (res) {
      setEditingId(res.id);
      setFormData({ titre: res.titre || '', type: res.type || 'Annale', cible: res.cible || 'Terminale', statut: res.statut || 'publie', url: res.url || '' });
    } else {
      setEditingId(null);
      setFormData({ titre: '', type: 'Annale', cible: 'Terminale', statut: 'publie', url: '' });
    }
    setUploadProgress(null);
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress('uploading');
    try {
      const { url } = await uploadResource(file, formData.type);
      setFormData(prev => ({ ...prev, url }));
      setUploadProgress('done');
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress('error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'resources', editingId), formData);
        setResources(prev => prev.map(r => r.id === editingId ? { ...r, ...formData } : r));
      } else {
        const docRef = await addDoc(collection(db, 'resources'), { ...formData, createdAt: new Date().toISOString() });
        setResources(prev => [{ id: docRef.id, ...formData }, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la ressource.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette ressource ?")) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="stack stack--lg animate-in">
      
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">Catalogue Ressources</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>Gérez les contenus disponibles sur la plateforme.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn--primary">
          + Ajouter une ressource
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Titre</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cible d'accès</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statut</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Chargement des ressources...</td></tr>
              ) : resources.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>Aucune ressource disponible.</td></tr>
              ) : (
                resources.map((res, idx) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>{res.titre || 'Sans titre'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{res.type || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)' }}>{res.cible || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${res.statut === 'publie' ? 'badge--green' : 'badge--warning'}`}>
                        {(res.statut || 'brouillon').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                        <button onClick={() => handleOpenModal(res)} className="btn btn--secondary btn--sm">Éditer</button>
                        <button onClick={() => handleDelete(res.id)} className="btn btn--secondary btn--sm" style={{ color: 'var(--clr-error)', borderColor: 'var(--clr-error-lt)' }}>Supprimer</button>
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
              <h2 className="modal-title">{editingId ? 'Modifier la ressource' : 'Ajouter une ressource'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close" aria-label="Fermer">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-panel__body stack stack--md">
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Titre de la ressource</label>
                <input type="text" required value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} placeholder="ex: Annale BAC Maths 2026" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    list="admin-res-type-suggestions"
                    placeholder="ex: Annale, Épreuve, Fiche..."
                    className="form-input"
                    style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }}
                  />
                  <datalist id="admin-res-type-suggestions">
                    <option value="Épreuve">Épreuve</option>
                    <option value="Annale">Annale</option>
                    <option value="Fiche">Fiche de cours</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Livre">Livre / PDF</option>
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Cible</label>
                  <input type="text" required value={formData.cible} onChange={e => setFormData({...formData, cible: e.target.value})} placeholder="ex: Terminale D" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Statut</label>
                    <input
                      type="text"
                      value={formData.statut}
                      onChange={e => setFormData({...formData, statut: e.target.value})}
                      list="admin-resource-status-suggestions"
                      placeholder="publie"
                      className="form-input"
                      style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }}
                    />
                    <datalist id="admin-resource-status-suggestions">
                      <option value="publie">Publié</option>
                      <option value="brouillon">Brouillon</option>
                    </datalist>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>Fichier ou URL</label>

                {/* File picker — uploads to Supabase */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '2px dashed var(--brd-subtle)', borderRadius: 'var(--rd-md)', cursor: 'pointer', marginBottom: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '1.3rem', color: 'var(--clr-brand)' }}>[+]</span>
                  <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>
                    {uploadProgress === 'uploading' ? 'Envoi en cours...' :
                     uploadProgress === 'done'      ? '[OK] Fichier envoyé avec succès' :
                     uploadProgress === 'error'     ? '[Erreur] — essaie avec une URL' :
                     'Choisir un fichier (PDF, image…)'}
                  </span>
                  <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>

                {/* Manual URL fallback */}
                <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="ou coller une URL directement" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }} />
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

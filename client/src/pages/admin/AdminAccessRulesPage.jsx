import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function AdminAccessRulesPage() {
  const { t } = useTranslation();
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
      alert(t('admin.access_rules.error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('admin.access_rules.confirm_delete'))) return;
    try {
      await deleteDoc(doc(db, 'accessRules', id));
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(t('admin.access_rules.error_delete'));
    }
  };

  return (
    <div className="stack stack--lg animate-in">
      
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('admin.access_rules.title')}</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>{t('admin.access_rules.subtitle')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn--primary">
          {t('admin.access_rules.new_rule_btn')}
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.access_rules.table.name')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.access_rules.table.criteria')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('admin.access_rules.table.status')}</th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>{t('admin.access_rules.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.access_rules.loading')}</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>{t('admin.access_rules.empty')}</td></tr>
              ) : (
                rules.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--brd-subtle)', background: idx % 2 === 1 ? 'var(--srf-raised)' : '' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-semibold)', color: 'var(--txt-primary)' }}>{r.nom || t('admin.access_rules.no_name')}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', fontFamily: 'monospace' }}>{r.critere || 'N/A'}</td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      <span className={`badge ${r.statut === 'actif' ? 'badge--green' : 'badge--error'}`}>
                        {r.statut === 'actif' ? t('admin.access_rules.status.active').toUpperCase() : t('admin.access_rules.status.inactive').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                        <button onClick={() => handleOpenModal(r)} className="btn btn--secondary btn--sm">{t('admin.access_rules.actions.edit')}</button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn--secondary btn--sm" style={{ color: 'var(--clr-error)', borderColor: 'var(--clr-error-lt)' }}>{t('admin.access_rules.actions.delete')}</button>
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
              <h2 className="modal-title">{editingId ? t('admin.access_rules.modal.edit_title') : t('admin.access_rules.modal.new_title')}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close" aria-label={t('admin.access_rules.modal.close')}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-panel__body stack stack--md">
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>{t('admin.access_rules.modal.name_label')}</label>
                <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="ex: Accès Annales Terminale" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>{t('admin.access_rules.modal.criteria_label')}</label>
                <input type="text" required value={formData.critere} onChange={e => setFormData({...formData, critere: e.target.value})} placeholder="ex: Niveau = Terminale ET Profil = Élève" className="form-input" style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)', fontFamily: 'monospace' }} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>{t('admin.access_rules.modal.status_label')}</label>
                <input
                  type="text"
                  value={formData.statut}
                  onChange={e => setFormData({...formData, statut: e.target.value})}
                  list="access-rule-status-suggestions"
                  placeholder="actif"
                  className="form-input"
                  style={{ width: '100%', padding: 'var(--sp-3)', background: 'var(--srf-raised)', border: '1px solid var(--brd-subtle)', borderRadius: 'var(--rd-md)', color: 'var(--txt-primary)' }}
                />
                <datalist id="access-rule-status-suggestions">
                  <option value="actif">{t('admin.access_rules.status.active')}</option>
                  <option value="inactif">{t('admin.access_rules.status.inactive')}</option>
                </datalist>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn--secondary">{t('admin.access_rules.modal.cancel')}</button>
                <button type="submit" disabled={isSaving} className="btn btn--primary">{isSaving ? t('admin.access_rules.modal.saving') : t('admin.access_rules.modal.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

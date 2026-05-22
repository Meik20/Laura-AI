import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createInvitationCode,
  createBulkInvitationCodes,
  getInvitationCodes,
  deleteInvitationCode,
  generateInvitationCode,
} from '../../services/adminService';

export default function AdminTutorsPage() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [customCode, setCustomCode] = useState('');
  const [codeEmail, setCodeEmail] = useState('');
  const [codeNotes, setCodeNotes] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, used, expired

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const allCodes = await getInvitationCodes();
      setCodes(allCodes);
    } catch (err) {
      console.error('Error fetching codes:', err);
      alert(t('admin.tutors.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSingle = async (e) => {
    e.preventDefault();
    if (!customCode.trim() && !codeEmail.trim()) {
      alert(t('admin.tutors.error_empty_fields'));
      return;
    }

    setIsSaving(true);
    try {
      const result = await createInvitationCode({
        code: customCode || generateInvitationCode(),
        email: codeEmail || null,
        notes: codeNotes || null,
        expiresAt: codeExpiresAt || null,
      });

      setCodes((prev) => [
        {
          id: result.id,
          code: result.code,
          createdAt: new Date().toISOString(),
          usedAt: null,
          usedBy: null,
          email: codeEmail,
          notes: codeNotes,
          status: 'active',
          expiresAt: codeExpiresAt,
        },
        ...prev,
      ]);

      setShowModal(false);
      setCustomCode('');
      setCodeEmail('');
      setCodeNotes('');
      setCodeExpiresAt('');
      alert(t('admin.tutors.success_created', { code: result.code }));
    } catch (err) {
      console.error('Error creating code:', err);
      alert(t('admin.tutors.error_creating'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBulk = async () => {
    if (!bulkCount || bulkCount < 1) {
      alert(t('admin.tutors.error_invalid_count'));
      return;
    }

    setIsSaving(true);
    try {
      const newCodes = await createBulkInvitationCodes(bulkCount, codeExpiresAt || null);
      setCodes((prev) => [
        ...newCodes.map((c) => ({
          id: c.id,
          code: c.code,
          createdAt: new Date().toISOString(),
          usedAt: null,
          usedBy: null,
          email: null,
          notes: null,
          status: 'active',
          expiresAt: codeExpiresAt,
        })),
        ...prev,
      ]);

      setShowModal(false);
      setBulkCount(5);
      setCodeExpiresAt('');
      alert(t('admin.tutors.success_bulk_created', { count: bulkCount }));
    } catch (err) {
      console.error('Error creating bulk codes:', err);
      alert(t('admin.tutors.error_creating'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (codeId) => {
    if (!window.confirm(t('admin.tutors.confirm_delete'))) return;

    try {
      await deleteInvitationCode(codeId);
      setCodes((prev) => prev.filter((c) => c.id !== codeId));
      alert(t('admin.tutors.success_deleted'));
    } catch (err) {
      console.error('Error deleting code:', err);
      alert(t('admin.tutors.error_deleting'));
    }
  };

  const getStatusBadge = (status, expiresAt) => {
    if (status === 'used') {
      return (
        <span
          style={{
            background: '#D1FAE5',
            color: '#065F46',
            padding: '0.4rem 0.8rem',
            borderRadius: '1rem',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {t('admin.tutors.status.used')}
        </span>
      );
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return (
        <span
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '0.4rem 0.8rem',
            borderRadius: '1rem',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {t('admin.tutors.status.expired')}
        </span>
      );
    }

    return (
      <span
        style={{
          background: '#FEF3C7',
          color: '#92400E',
          padding: '0.4rem 0.8rem',
          borderRadius: '1rem',
          fontSize: '0.85rem',
          fontWeight: 700,
        }}
      >
        {t('admin.tutors.status.active')}
      </span>
    );
  };

  const getFilteredCodes = () => {
    return codes.filter((code) => {
      if (filter === 'active') return code.status === 'active' && (!code.expiresAt || new Date(code.expiresAt) >= new Date());
      if (filter === 'used') return code.status === 'used';
      if (filter === 'expired') return code.expiresAt && new Date(code.expiresAt) < new Date();
      return true;
    });
  };

  const filteredCodes = getFilteredCodes();
  const stats = {
    total: codes.length,
    active: codes.filter((c) => c.status === 'active' && (!c.expiresAt || new Date(c.expiresAt) >= new Date())).length,
    used: codes.filter((c) => c.status === 'used').length,
    expired: codes.filter((c) => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
  };

  return (
    <div className="stack stack--lg animate-in">
      {/* CREATE CODE MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{t('admin.tutors.modal.title')}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close" aria-label={t('common.actions.close')}>
                ✕
              </button>
            </div>

            <div className="modal-panel__body stack stack--md">
              {/* TABS */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', borderBottom: '1px solid var(--brd-subtle)' }}>
                <button
                  onClick={() => {
                    setCustomCode('');
                    setCodeEmail('');
                    setCodeNotes('');
                  }}
                  style={{
                    padding: 'var(--sp-3) var(--sp-4)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderBottom: '2px solid var(--clr-brand)',
                    color: 'var(--txt-primary)',
                    fontWeight: 'var(--fw-bold)',
                  }}
                >
                  {t('admin.tutors.modal.single')}
                </button>
                <button
                  onClick={() => setBulkCount(5)}
                  style={{
                    padding: 'var(--sp-3) var(--sp-4)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--txt-secondary)',
                    fontWeight: 'var(--fw-medium)',
                  }}
                >
                  {t('admin.tutors.modal.bulk')}
                </button>
              </div>

              {/* SINGLE CODE FORM */}
              {bulkCount === 5 && customCode === '' && codeEmail === '' ? null : bulkCount !== 5 ? null : (
                <form onSubmit={handleCreateSingle} className="stack stack--sm">
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.code_label')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.tutors.modal.code_placeholder')}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                        fontFamily: 'monospace',
                      }}
                    />
                    <small style={{ color: 'var(--txt-tertiary)', display: 'block', marginTop: 'var(--sp-1)' }}>
                      {t('admin.tutors.modal.code_help')}
                    </small>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.email_label')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('admin.tutors.modal.email_placeholder')}
                      value={codeEmail}
                      onChange={(e) => setCodeEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.notes_label')}
                    </label>
                    <textarea
                      placeholder={t('admin.tutors.modal.notes_placeholder')}
                      value={codeNotes}
                      onChange={(e) => setCodeNotes(e.target.value)}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.expires_label')}
                    </label>
                    <input
                      type="datetime-local"
                      value={codeExpiresAt}
                      onChange={(e) => setCodeExpiresAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', paddingTop: 'var(--sp-2)' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn--secondary"
                    >
                      {t('common.actions.close')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={isSaving}
                    >
                      {isSaving ? t('admin.tutors.modal.saving') : t('admin.tutors.modal.create_btn')}
                    </button>
                  </div>
                </form>
              )}

              {/* BULK CODE FORM */}
              {bulkCount !== 5 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateBulk();
                  }}
                  className="stack stack--sm"
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.count_label')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 5)}
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--sp-2)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)', color: 'var(--txt-secondary)' }}>
                      {t('admin.tutors.modal.expires_label')}
                    </label>
                    <input
                      type="datetime-local"
                      value={codeExpiresAt}
                      onChange={(e) => setCodeExpiresAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--rd-md)',
                        border: '1px solid var(--brd-input)',
                        fontSize: 'var(--tx-sm)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', paddingTop: 'var(--sp-2)' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn--secondary"
                    >
                      {t('common.actions.close')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={isSaving}
                    >
                      {isSaving ? t('admin.tutors.modal.saving') : t('admin.tutors.modal.create_bulk_btn', { count: bulkCount })}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header__title">
          <h1 className="laura-h1">{t('admin.tutors.title')}</h1>
          <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            {t('admin.tutors.subtitle')}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn--primary">
          + {t('admin.tutors.create_btn')}
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="row" style={{ gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '150px', padding: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)' }}>
            {t('admin.tutors.stats.total')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)' }}>
            {stats.total}
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', padding: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)' }}>
            {t('admin.tutors.stats.active')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'var(--fw-bold)', color: '#92400E' }}>
            {stats.active}
          </div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '150px', padding: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-2)' }}>
            {t('admin.tutors.stats.used')}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'var(--fw-bold)', color: '#065F46' }}>
            {stats.used}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {['all', 'active', 'used', 'expired'].map((filterVal) => (
          <button
            key={filterVal}
            onClick={() => setFilter(filterVal)}
            style={{
              padding: 'var(--sp-2) var(--sp-3)',
              border: filter === filterVal ? '2px solid var(--clr-brand)' : '1px solid var(--brd-subtle)',
              background: filter === filterVal ? 'var(--srf-raised)' : 'transparent',
              borderRadius: 'var(--rd-md)',
              cursor: 'pointer',
              fontSize: 'var(--tx-sm)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--txt-primary)',
              transition: 'all 0.2s',
            }}
          >
            {t(`admin.tutors.filters.${filterVal}`)}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--tx-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--srf-raised)', borderBottom: '2px solid var(--brd-subtle)' }}>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('admin.tutors.table.code')}
                </th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('admin.tutors.table.email')}
                </th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('admin.tutors.table.status')}
                </th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('admin.tutors.table.created')}
                </th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('admin.tutors.table.expires')}
                </th>
                <th style={{ padding: 'var(--sp-4) var(--sp-5)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>
                  {t('admin.tutors.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                    {t('admin.tutors.loading')}
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-tertiary)' }}>
                    {t('admin.tutors.empty')}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} style={{ borderBottom: '1px solid var(--brd-subtle)' }}>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', fontFamily: 'monospace', fontWeight: 'var(--fw-bold)', color: 'var(--clr-brand)' }}>
                      {code.code}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-primary)', fontSize: 'var(--tx-xs)' }}>
                      {code.email || code.usedByEmail || '—'}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)' }}>
                      {getStatusBadge(code.status, code.expiresAt)}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)' }}>
                      {new Date(code.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', color: 'var(--txt-secondary)', fontSize: 'var(--tx-xs)' }}>
                      {code.expiresAt
                        ? new Date(code.expiresAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td style={{ padding: 'var(--sp-4) var(--sp-5)', textAlign: 'right' }}>
                      {code.status !== 'used' && (
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="btn btn--secondary btn--sm"
                          style={{ background: '#FEE2E2', color: '#991B1B', border: 'none' }}
                        >
                          {t('admin.tutors.actions.delete')}
                        </button>
                      )}
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

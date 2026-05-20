import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function TutorDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [submissionCounts, setSubmissionCounts] = useState({ brouillons: 0, enRevue: 0, valides: 0 });
  const [adminMessages, setAdminMessages] = useState([]);

  const uid = currentUser?.uid || userProfile?.uid;

  const tutorData = {
    nom: userProfile?.nom || userProfile?.prenom || t('common.roles.tutor'),
    statut: userProfile?.statut || userProfile?.roleLabel || 'En attente',
    discipline: userProfile?.discipline || userProfile?.filiere || 'Général'
  };

  useEffect(() => {
    async function fetchTutorData() {
      if (!uid) return;
      try {
        const resSnap = await getDocs(collection(db, 'resources'));
        let b = 0, r = 0, v = 0;
        resSnap.forEach(docItem => {
          const data = docItem.data();
          if (data.auteurId === uid) {
            if (data.statut === 'brouillon') b++;
            else if (data.statut === 'soumis' || data.statut === 'en_attente' || data.statut === 'en_revue') r++;
            else if (data.statut === 'publie' || data.statut === 'valide') v++;
          }
        });
        setSubmissionCounts({ brouillons: b, enRevue: r, valides: v });

        const msgSnap = await getDocs(collection(db, 'users', uid, 'messages'));
        const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminMessages(msgs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Erreur fetch tutor data:", err);
      }
    }
    fetchTutorData();
  }, [uid]);

  const handleRequestContributor = async () => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'users', uid), { statut: 'En attente de contribution' }, { merge: true });
      alert(t('tutor.dashboard.alerts.request_sent'));
    } catch (err) {
      console.error("Erreur demande contributeur:", err);
      alert(t('tutor.dashboard.alerts.request_error'));
    }
  };

  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', labelKey: 'tutor.dashboard.tabs.overview', icon: '👤' },
    { id: 'tools', labelKey: 'tutor.dashboard.tabs.tools', icon: '🛠️' },
    { id: 'messages', labelKey: 'tutor.dashboard.tabs.messages', icon: '✉️' },
    { id: 'submissions', labelKey: 'tutor.dashboard.tabs.submissions', icon: '📤' }
  ];

  return (
    <div className="stack stack--lg animate-in">
      
      {/* HEADER */}
      <div className="row row--between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="laura-h1">{t('tutor.dashboard.hello', { name: tutorData.nom })}</h1>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-base)' }}>
            {t('tutor.dashboard.subtitle')} · <strong style={{ color: 'var(--txt-primary)' }}>{tutorData.discipline}</strong>
          </p>
        </div>
        <Link to="/tutor/chat" className="laura-btn laura-btn-primary" style={{ minHeight: '42px', padding: '0 var(--sp-6)' }}>
          💬 {t('tutor.dashboard.buttons.pedagogical_chat')}
        </Link>
      </div>

      {/* TABS NAVBAR */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 'var(--sp-2)', borderBottom: '1px solid var(--brd-subtle)', overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--clr-brand)' : '3px solid transparent',
                color: isActive ? 'var(--clr-brand)' : 'var(--txt-secondary)',
                fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-semibold)',
                fontSize: 'var(--tx-sm)',
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease-std)',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              <span style={{ fontSize: 'var(--tx-md)' }}>{tab.icon}</span>
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div style={{ minHeight: '340px' }}>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="stack stack--lg">
            {/* STATUT ET DROITS */}
            <div className={`card ${tutorData.statut === 'Contributeur' ? 'card--tint' : 'card--soft'}`} style={{ padding: 'var(--sp-6)', borderLeft: `6px solid ${tutorData.statut === 'Contributeur' ? 'var(--clr-success)' : tutorData.statut === 'En attente de contribution' ? 'var(--clr-warning)' : 'var(--clr-brand)'}` }}>
              <div className="row row--between" style={{ marginBottom: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                <h2 className="laura-h3" style={{ margin: 0 }}>{t('tutor.dashboard.status_card.title')}</h2>
                <span className={`badge ${tutorData.statut === 'Contributeur' ? 'badge--green' : tutorData.statut === 'En attente de contribution' ? 'badge--warning' : 'badge--brand'}`}>
                  {t(`tutor.status.${tutorData.statut}`, { defaultValue: tutorData.statut })}
                </span>
              </div>
              {tutorData.statut === 'Contributeur' ? (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  {t('tutor.dashboard.status_card.desc_contributor')}
                </p>
              ) : tutorData.statut === 'En attente de contribution' ? (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  {t('tutor.dashboard.status_card.desc_pending')}
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>
                  {t('tutor.dashboard.status_card.desc_standard')}
                </p>
              )}
              {tutorData.statut !== 'Contributeur' && tutorData.statut !== 'En attente de contribution' && (
                <button onClick={handleRequestContributor} className="laura-btn laura-btn-primary" style={{ marginTop: 'var(--sp-4)', minHeight: '38px' }}>
                  {t('tutor.dashboard.status_card.request_rights')}
                </button>
              )}
            </div>

            {/* ACTILINE SUMMARY GRID */}
            <div className="card" style={{ padding: 'var(--sp-6)', background: 'var(--srf-raised)' }}>
              <h3 className="laura-h3" style={{ marginBottom: 'var(--sp-1)' }}>{t('tutor.dashboard.activity.title')}</h3>
              <p style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-sm)', margin: '0 0 var(--sp-6)' }}>{t('tutor.dashboard.activity.desc')}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-4)' }}>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.valides}</div>
                  <div className="badge badge--green" style={{ marginTop: 'var(--sp-3)' }}>{t('tutor.dashboard.activity.published')}</div>
                </div>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.enRevue}</div>
                  <div className="badge badge--warning" style={{ marginTop: 'var(--sp-3)' }}>{t('tutor.dashboard.activity.in_review')}</div>
                </div>
                <div className="card card--hoverable" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt-primary)' }}>{submissionCounts.brouillons}</div>
                  <div className="badge" style={{ marginTop: 'var(--sp-3)' }}>{t('tutor.dashboard.activity.drafts')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === 'tools' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h2 className="laura-h3" style={{ marginBottom: 'var(--sp-1)' }}>{t('tutor.dashboard.tools.title')}</h2>
              <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>{t('tutor.dashboard.tools.desc')}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
                <Link to="/tutor/chat" className="card card--hoverable" style={{ padding: 'var(--sp-6)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '2.2rem', marginBottom: 'var(--sp-2)' }}>📝</span>
                  <strong className="laura-h3" style={{ color: 'var(--txt-primary)' }}>{t('tutor.dashboard.tools.generate_plan')}</strong>
                  <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-snug)' }}>{t('tutor.dashboard.tools.generate_plan_desc')}</span>
                </Link>
                <Link to="/tutor/submissions" className="card card--hoverable" style={{ padding: 'var(--sp-6)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: '2.2rem', marginBottom: 'var(--sp-2)' }}>📤</span>
                  <strong className="laura-h3" style={{ color: 'var(--txt-primary)' }}>{t('tutor.dashboard.tools.submit_content')}</strong>
                  <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-snug)' }}>{t('tutor.dashboard.tools.submit_content_desc')}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <h2 className="laura-h3" style={{ marginBottom: 'var(--sp-6)' }}>{t('tutor.dashboard.messages.title')}</h2>
              {adminMessages.length > 0 ? (
                <div className="stack stack--md">
                  {adminMessages.map(msg => (
                    <div key={msg.id} className="card card--soft" style={{ padding: 'var(--sp-5)', borderLeft: '4px solid var(--clr-brand)' }}>
                      <strong style={{ display: 'block', fontSize: 'var(--tx-base)', marginBottom: 'var(--sp-2)', color: 'var(--clr-brand)' }}>{msg.title || t('tutor.dashboard.messages.default_title')}</strong>
                      <span style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', lineHeight: 'var(--lh-relaxed)' }}>{msg.content || msg.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-state__icon">✉️</span>
                  <p className="empty-state__title">{t('tutor.dashboard.messages.empty_title')}</p>
                  <p style={{ color: 'var(--txt-tertiary)', fontSize: 'var(--tx-xs)' }}>{t('tutor.dashboard.messages.empty_desc')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="stack stack--lg">
            <div className="card" style={{ padding: 'var(--sp-6)' }}>
              <div className="row row--between" style={{ marginBottom: 'var(--sp-6)', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
                <div>
                  <h2 className="laura-h3" style={{ margin: 0 }}>{t('tutor.dashboard.submissions.title')}</h2>
                  <p style={{ margin: 'var(--sp-1) 0 0 0', color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)' }}>{t('tutor.dashboard.submissions.desc')}</p>
                </div>
                <Link to="/tutor/submissions" className="laura-btn laura-btn-secondary" style={{ minHeight: '36px', fontSize: 'var(--tx-xs)' }}>{t('tutor.dashboard.submissions.manage')}</Link>
              </div>
             
              <div className="stack stack--md">
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{t('tutor.dashboard.submissions.drafts_title')}</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>{t('tutor.dashboard.submissions.drafts_desc')}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--txt-secondary)' }}>{submissionCounts.brouillons}</span>
                </div>
               
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', borderBottom: '1px solid var(--brd-subtle)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>⏳</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{t('tutor.dashboard.submissions.review_title')}</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>{t('tutor.dashboard.submissions.review_desc')}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-warning)' }}>{submissionCounts.enRevue}</span>
                </div>
               
                <div className="row row--between" style={{ paddingBottom: 'var(--sp-4)', alignItems: 'center' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                      <span style={{ fontWeight: 'var(--fw-semibold)', display: 'block', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{t('tutor.dashboard.submissions.published_title')}</span>
                      <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--txt-tertiary)' }}>{t('tutor.dashboard.submissions.published_desc')}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 'var(--tx-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-success)' }}>{submissionCounts.valides}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

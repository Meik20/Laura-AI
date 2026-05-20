import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function TutorStatusPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [applicationData, setApplicationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (!userProfile?.uid) {
        setIsLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', userProfile.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setApplicationData({
            nom: data.nom || data.prenom || 'Candidat',
            discipline: data.discipline || data.filiere || 'Général',
            date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
            status: data.isTutor ? 'active' : data.isTutorPending ? 'en_examen' : 'recu',
            messageAdmin: data.adminMessage || t('tutor.status.admin_message_default', "Votre dossier est actuellement en cours d'analyse par notre équipe pédagogique.")
          });
        }
      } catch (err) {
        console.error("Erreur fetch status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, [userProfile?.uid]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'recu': return { cls: '', label: t('tutor.status.status_recu', 'Reçu') };
      case 'en_examen': return { cls: 'badge--warning', label: t('tutor.status.status_en_examen', 'En examen') };
      case 'test_requis': return { cls: 'badge--brand', label: t('tutor.status.status_test_requis', 'Test requis') };
      case 'valide': return { cls: 'badge--green', label: t('tutor.status.status_valide', 'Validé') };
      case 'active': return { cls: 'badge--green', label: t('tutor.status.status_active', 'Compte Activé') };
      case 'refuse': return { cls: 'badge--error', label: t('tutor.status.status_refuse', 'Refusé') };
      default: return { cls: '', label: t('tutor.status.status_pending', 'En attente') };
    }
  };

  if (isLoading) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="empty-state__icon">⏳</span>
        <p className="empty-state__title">{t('tutor.status.loading', 'Chargement du statut...')}</p>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--srf-page)', padding: 'var(--sp-4)' }}>
        <div className="card animate-in" style={{ maxWidth: '600px', width: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--sp-4)' }}>🔒</span>
          <h1 className="laura-h2" style={{ marginBottom: 'var(--sp-2)' }}>{t('tutor.status.no_application', 'Aucune candidature trouvée')}</h1>
          <p style={{ color: 'var(--txt-secondary)', fontSize: 'var(--tx-sm)', marginBottom: 'var(--sp-6)' }}>{t('tutor.status.no_application_desc', "Vous n'avez pas encore soumis de dossier de candidature pour devenir tuteur.")}</p>
          <Link to="/become-tutor" className="laura-btn laura-btn-primary" style={{ display: 'inline-flex', minHeight: '44px', padding: '0 var(--sp-6)', textDecoration: 'none' }}>{t('tutor.status.apply_btn', 'Postuler maintenant')}</Link>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusColor(applicationData.status);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--srf-page)', padding: 'var(--sp-4)' }}>
      <div className="card animate-in" style={{ maxWidth: '600px', width: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
        
        <h1 className="laura-h2" style={{ marginBottom: 'var(--sp-6)' }}>{t('tutor.status.title', 'Suivi de candidature')}</h1>

        <div className="card card--soft" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-6)', textAlign: 'left' }}>
          <div className="row row--between" style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-3)' }}>
            <span style={{ color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>{t('tutor.status.label_candidate', 'Candidat')}</span>
            <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{applicationData.nom}</span>
          </div>
          <div className="row row--between" style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-3)' }}>
            <span style={{ color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>{t('tutor.status.label_discipline', 'Discipline')}</span>
            <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{applicationData.discipline}</span>
          </div>
          <div className="row row--between" style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--brd-subtle)', paddingBottom: 'var(--sp-3)' }}>
            <span style={{ color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>{t('tutor.status.label_date', 'Date de soumission')}</span>
            <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--txt-primary)', fontSize: 'var(--tx-sm)' }}>{applicationData.date}</span>
          </div>
          <div className="row row--between" style={{ alignItems: 'center' }}>
            <span style={{ color: 'var(--txt-secondary)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--tx-sm)' }}>{t('tutor.status.label_status', 'Statut actuel')}</span>
            <span className={`badge ${statusStyle.cls}`}>
              {statusStyle.label}
            </span>
          </div>
        </div>

        {applicationData.messageAdmin && (
          <div className="card card--tint" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-6)', textAlign: 'left', borderLeft: '4px solid var(--clr-brand)' }}>
            <strong style={{ display: 'block', marginBottom: 'var(--sp-2)', fontSize: 'var(--tx-sm)', color: 'var(--txt-primary)' }}>{t('tutor.status.admin_message_title', "Message de l'administration :")}</strong>
            <p style={{ margin: 0, fontSize: 'var(--tx-xs)', color: 'var(--txt-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{applicationData.messageAdmin}</p>
          </div>
        )}

        <div className="row" style={{ gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {applicationData.status === 'test_requis' && (
            <button className="laura-btn laura-btn-primary" style={{ minHeight: '44px', padding: '0 var(--sp-6)' }}>
              {t('tutor.status.start_test_btn', "Commencer le test d'évaluation")}
            </button>
          )}
          {applicationData.status === 'active' && (
            <Link to="/tutor/dashboard" className="laura-btn laura-btn-primary" style={{ minHeight: '44px', padding: '0 var(--sp-6)', textDecoration: 'none' }}>
              {t('tutor.status.access_space_btn', 'Accéder à mon espace')}
            </Link>
          )}
          <Link to="/" className="laura-btn laura-btn-secondary" style={{ minHeight: '44px', padding: '0 var(--sp-6)', textDecoration: 'none' }}>
            {t('tutor.status.back_home_btn', "Retour à l'accueil")}
          </Link>
        </div>

      </div>
    </div>
  );
}

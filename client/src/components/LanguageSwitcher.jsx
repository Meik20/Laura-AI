import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  const isFr = currentLang.startsWith('fr');

  return (
    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', background: 'var(--srf-raised)', padding: '2px 6px', borderRadius: '20px', border: '1px solid var(--brd-subtle)' }}>
      <button
        onClick={() => i18n.changeLanguage('fr')}
        title="Français"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: isFr ? 1 : 0.35,
          transform: isFr ? 'scale(1.1)' : 'scale(0.9)',
          transition: 'all 0.2s',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="20" height="13" style={{ borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          <rect width="900" height="600" fill="#ED2939"/>
          <rect width="600" height="600" fill="#fff"/>
          <rect width="300" height="600" fill="#002395"/>
        </svg>
      </button>
      <span style={{ color: 'var(--brd-strong)', fontSize: '10px', userSelect: 'none' }}>|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        title="English"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: !isFr ? 1 : 0.35,
          transform: !isFr ? 'scale(1.1)' : 'scale(0.9)',
          transition: 'all 0.2s',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="13" style={{ borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          <rect width="60" height="30" fill="#012169"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </svg>
      </button>
    </div>
  );
}

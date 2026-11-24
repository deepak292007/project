import React, { useState } from 'react';
import { useSession, useUI } from '../../store';
import { AIAssistantModal } from '../shared/AIAssistantModal';
import type { Lang } from '../../types';

// Lucide-like inline SVG icons (no dep needed)
const HeartPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
  </svg>
);

const ROLE_LABELS: Record<string, Record<Lang, string>> = {
  patient:         { en: 'Patient', hi: 'मरीज / नागरिक', mr: 'रुग्ण', te: 'రోగి / పౌరుడు', kn: 'ರೋಗಿ / ನಾಗರಿಕ' },
  asha:            { en: 'ASHA Worker', hi: 'आशा कार्यकर्ता', mr: 'आशा कार्यकर्ती', te: 'ఆశా కార్యకర్త', kn: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ' },
  phc_doctor:      { en: 'PHC Doctor', hi: 'PHC डॉक्टर', mr: 'PHC डॉक्टर', te: 'PHC డాక్టర్', kn: 'PHC ವೈದ್ಯರು' },
  hospital_admin:  { en: 'Hospital Admin', hi: 'अस्पताल प्रशासन', mr: 'रुग्णालय प्रशासक', te: 'ఆసుపత్రి అడ్మిన్', kn: 'ಆಸ್ಪತ್ರೆ ಆಡಳಿತ' },
  hospital_doctor: { en: 'Specialist Doctor', hi: 'विशेषज्ञ डॉक्टर', mr: 'तज्ञ डॉक्टर', te: 'స్పెషలిస్ట్ డాక్టర్', kn: 'ತಜ್ಞ ವೈದ್ಯರು' },
  district_admin:  { en: 'District Admin', hi: 'जिला प्रशासक', mr: 'जिल्हा प्रशासक', te: 'జిల్లా అడ్మిన్', kn: 'ಜಿಲ್ಲಾ ಆಡಳಿತ' },
};

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

export const GovHeader: React.FC = () => {
  const { role, name, lang, setLang, logout } = useSession();
  const { toggleMobileNav } = useUI();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;
  const [showAiAgent, setShowAiAgent] = useState(false);

  const agentBtnText: Record<Lang, string> = {
    te: 'AI క్లినికల్ అసిస్టెంట్',
    kn: 'AI ಕ್ಲಿನಿಕಲ್ ಸಹಾಯಕ',
    mr: 'AI वैद्यकीय सहाय्यक',
    hi: 'AI स्वास्थ्य सहायक',
    en: 'AI Clinical Assistant'
  };

  const trustRibbonText: Record<Lang, string> = {
    te: 'భారత ప్రభుత్వం · జాతీయ ఆరోగ్య మిషన్ (NHM) · ఆరోగ్యలింక్ (ArogyaLink) · SIH 2026',
    kn: 'ಭಾರತ ಸರ್ಕಾರ · ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ (NHM) · ಆರೋಗ್ಯಲಿಂಕ್ · SIH 2026',
    mr: 'महाराष्ट्र शासन · राष्ट्रीय आरोग्य अभियान (NHM) · ArogyaLink · SIH 2026',
    hi: 'भारत सरकार · राष्ट्रीय स्वास्थ्य मिशन (NHM) · ArogyaLink — एकीकृत ग्रामीण स्वास्थ्य मंच · SIH 2026',
    en: 'Government of India · National Health Mission (NHM) · ArogyaLink Digital Health Platform · SIH 2026'
  };

  return (
    <>
      {/* Trust ribbon */}
      <div className="trust-ribbon" role="banner">
        <span>{trustRibbonText[currentLang] || trustRibbonText.en}</span>
      </div>

      {/* Main header */}
      <header className="gov-header" role="navigation" aria-label="Main navigation">
        <button className="mobile-menu-btn" onClick={toggleMobileNav} aria-label="Toggle navigation menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <a href="/" className="header-logo" aria-label="ArogyaLink home">
          <HeartPulse />
          <div className="header-logo-text">
            <span className="logo-name">ArogyaLink</span>
            <span className="logo-sub">
              {currentLang === 'te' ? 'సమగ్ర గ్రామీణ ఆరోగ్య సంరక్షణ వేదిక' : currentLang === 'kn' ? 'ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸಮನ್ವಯ' : 'National Digital Health Platform'}
            </span>
          </div>
        </a>

        <div className="header-spacer" />

        <div className="header-controls">
          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Lang)}
            className="form-control"
            style={{ width: 'auto', minHeight: 36, padding: '4px 32px 4px 10px', fontSize: '0.875rem' }}
            aria-label="Select language"
          >
            {LANG_OPTIONS.map(o => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>

          {/* Role badge */}
          <span className="badge badge-info" style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
            {ROLE_LABELS[role]?.[currentLang] || ROLE_LABELS[role]?.en || role}
          </span>

          {/* Multilingual AI Clinical Assistant Trigger */}
          <button
            onClick={() => setShowAiAgent(true)}
            className="btn btn-sm"
            style={{
              background: 'var(--col-teal)',
              color: '#ffffff',
              border: '1px solid var(--col-teal-dark)',
              borderRadius: 4,
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Open Multilingual AI Clinical Assistant"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
              <rect x="4" y="8" width="16" height="12" rx="2"/>
              <circle cx="9" cy="13" r="1" fill="currentColor"/>
              <circle cx="15" cy="13" r="1" fill="currentColor"/>
              <path d="M9 17h6"/>
            </svg>
            {agentBtnText[currentLang] || agentBtnText.en}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            aria-label="Sign out"
          >
            Sign out · {name}
          </button>
        </div>
      </header>

      {/* AI Health Assistant Conversational Modal */}
      <AIAssistantModal isOpen={showAiAgent} onClose={() => setShowAiAgent(false)} />
    </>
  );
};

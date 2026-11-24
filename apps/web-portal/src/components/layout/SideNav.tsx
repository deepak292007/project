import React from 'react';
import { useSession, useUI } from '../../store';
import type { Role, Lang } from '../../types';

interface NavItem {
  id: string;
  label: { en: string; mr: string; hi: string; te: string; kn: string };
  icon: React.ReactNode;
}

// SVG icon helpers
const Icon = ({ path, d2 }: { path: string; d2?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />{d2 && <path d={d2} />}
  </svg>
);

const NAV_CONFIG: Record<Role, NavItem[]> = {
  patient: [
    { id: 'symptom', label: { en: 'Report Symptoms & Analyse', mr: 'लक्षणे नोंदवा व विश्लेषण', hi: 'लक्षण दर्ज करें एवं विश्लेषण', te: 'లక్షణాలు నమోదు & విశ్లేషణ', kn: 'ಲಕ್ಷಣಗಳ ದಾಖಲೆ & ವಿಶ್ಲೇಷಣೆ' }, icon: <Icon path="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 6v4l3 3" /> },
    { id: 'opd',     label: { en: 'Book OP Token & Queue', mr: 'ओपीडी टोकन व प्रतीक्षा वेळ', hi: 'ओपीडी टोकन एवं कतार', te: 'OP టోకెన్ & క్యూ సమయం', kn: 'OP ಟೋಕನ್ & ಕ್ಯೂ ಸಮಯ' }, icon: <Icon path="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" /> },
    { id: 'facility', label: { en: 'Find Nearest Facility', mr: 'जवळचे रुग्णालय', hi: 'नजदीकी अस्पताल', te: 'సమీప ఆసుపత్రి (AI Ranking)', kn: 'ಸಮೀಪದ ಆಸ್ಪತ್ರೆ (AI Ranking)' }, icon: <Icon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" d2="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /> },
    { id: 'rooms',    label: { en: 'Available Rooms & Tariffs', mr: '?????? ???? ? ??', hi: '?????? ???? ??? ?????', te: '???????? ????? & ????', kn: '???????? & ?????' }, icon: <Icon path="M3 7h18M3 12h18M3 17h18M5 5v14M19 5v14" /> },
    { id: 'transport', label: { en: '108 Transport & Hub Labs', mr: '१०८ वाहतूक व लॅब नेटवर्क', hi: '108 वाहन एवं लैब नेटवर्क', te: '108 వాహనం & ల్యాబ్ నెట్‌వర్క్', kn: '108 ವಾಹನ & ಲ್ಯಾಬ್ ಜಾಲ' }, icon: <Icon path="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1" d2="M7.5 17.5a2.5 2.5 0 1 0 0 .01M17.5 17.5a2.5 2.5 0 1 0 0 .01" /> },
    { id: 'emergency', label: { en: 'Emergency SOS (Offline/Online)', mr: 'आणीबाणी एसओएस (SOS)', hi: 'आपातकालीन एसओएस (SOS)', te: 'ఎమర్జెンసీ SOS (108)', kn: 'ತುರ್ತು SOS (108)' }, icon: <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    { id: 'grievance', label: { en: 'Grievance & Feedback', mr: 'तक्रार व अभिप्राय', hi: 'शिकायत एवं प्रतिक्रिया', te: 'పౌర ఫిర్యాదులు & ఫీడ్‌బ్యాక్', kn: 'ದೂರುಗಳು ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ' }, icon: <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
    { id: 'book',    label: { en: 'Teleconsultation', mr: 'दूरसल्ला (Teleconsult)', hi: 'टेलीपरामर्श', te: 'టెలీకన్సల్టేషన్ (స్పెషలిస్ట్)', kn: 'ಟೆಲಿಕನ್ಸಲ್ಟೇಶನ್ (ತಜ್ಞರು)' }, icon: <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.05 3.4 2 2 0 0 1 3 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9A16 16 0 0 0 15 16.91l1.14-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /> },
    { id: 'record',  label: { en: 'My Health Record', mr: 'आरोग्य रेकॉर्ड (ABHA)', hi: 'स्वास्थ्य रिकॉर्ड', te: 'నా ఆరోగ్య రికార్డు (ABHA)', kn: 'ನನ್ನ ಆರೋಗ್ಯ ದಾಖಲೆ (ABHA)' }, icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" /> },
  ],
  asha: [
    { id: 'home',     label: { en: 'High-Risk Patient List', mr: 'उच्च जोखीम रुग्ण', hi: 'उच्च जोखिम मरीज', te: 'అధిక ప్రమాద రోగుల జాబితా', kn: 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ರೋಗಿಗಳ ಪಟ್ಟಿ' }, icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" d2="M9 22V12h6v10" /> },
    { id: 'intake',   label: { en: 'Record Vitals', mr: 'महत्त्वाच्या नोंदी', hi: 'वाइटल साइन दर्ज करें', te: 'వైటల్స్ నమోదు', kn: 'ವೈಟಲ್ಸ್ ದಾಖಲಿಸಿ' }, icon: <Icon path="M22 12h-4l-3 9L9 3l-3 9H2" /> },
    { id: 'register', label: { en: 'Register Patient', mr: 'रुग्ण नोंदणी', hi: 'मरीज पंजीकरण', te: 'రోగి నమోదు', kn: 'ರೋಗಿ ನೋಂದಣಿ' }, icon: <Icon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" d2="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 0h6m-3-3v6" /> },
    { id: 'teleconsult', label: { en: 'Teleconsult Doctor', mr: 'डॉक्टरांशी दूरसल्ला', hi: 'डॉक्टर टेलीपरामर्श', te: 'డాక్టర్ టెలీకన్సల్ట్', kn: 'ವೈದ್ಯರ ಟೆಲಿಕನ್ಸಲ್ಟ್' }, icon: <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12" /> },
    { id: 'followups', label: { en: 'Follow-up Tasks', mr: 'पाठपुरावा कार्ये', hi: 'फॉलो-अप कार्य', te: 'ఫాలో-అప్ విధులు', kn: 'ಫಾಲೋ-ಅಪ್ ಕಾರ್ಯಗಳು' }, icon: <Icon path="M9 11l3 3L22 4" d2="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
    { id: 'sync',     label: { en: 'Offline Sync Status', mr: 'ऑफलाइन समक्रमण', hi: 'ऑफलाइन सिंक स्थिति', te: 'ఆఫ్‌లైన్ సింక్ స్థితి', kn: 'ಆಫ್‌ಲೈನ್ ಸಿಂಕ್ ಸ್ಥಿತಿ' }, icon: <Icon path="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" d2="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> },
  ],
  phc_doctor: [
    { id: 'queue',  label: { en: 'OPD Queue Board', mr: 'ओपीडी रांग फलक', hi: 'ओपीडी कतार', te: 'OPD క్యూ బోర్డ్', kn: 'OPD ಕ್ಯೂ ಬೋರ್ಡ್' }, icon: <Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
    { id: 'triage', label: { en: 'Clinical Analyse & Referrals', mr: 'क्लिनिकल विश्लेषण व संदर्भ', hi: 'क्लिनिकल विश्लेषण एवं रेफरल', te: 'క్లినికల్ విశ్లేషణ & రిఫరల్స్', kn: 'ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ & ರೆಫರಲ್‌ಗಳು' }, icon: <Icon path="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" d2="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /> },
    { id: 'stock',  label: { en: 'Medicine Stock', mr: 'औषध साठा', hi: 'दवा स्टॉक', te: 'మందుల నిల్వ', kn: 'ಔಷಧಿ ದಾಸ್ತಾನು' }, icon: <Icon path="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h5m-5 0v4m10-15v18" /> },
    { id: 'teleconsult', label: { en: 'Specialist Consult', mr: 'तज्ञ डॉक्टर सल्ला', hi: 'विशेषज्ञ परामर्श', te: 'నిపుణుల సంప్రదింపులు', kn: 'ತಜ್ಞರ ಸಮಾಲೋಚನೆ' }, icon: <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12" /> },
  ],
  hospital_admin: [
    { id: 'capacity',  label: { en: 'Bed & Resource Edit', mr: 'बेड व साधनसामग्री', hi: 'बेड एवं संसाधन', te: 'బెడ్లు & వనరుల నిర్వహణ', kn: 'ಹಾಸಿಗೆ & ಸಂಪನ್ಮೂಲ ನಿರ್ವಹಣೆ' }, icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
    { id: 'referrals', label: { en: 'Inbound Referrals', mr: 'आवक संदर्भ रुग्ण', hi: 'आवक रेफरल', te: 'వచ్చే రిఫరల్స్', kn: 'ಬರುವ ರೆಫರಲ್‌ಗಳು' }, icon: <Icon path="M5 12h14M12 5l7 7-7 7" /> },
    { id: 'opqueue',   label: { en: 'OP Queue Boards', mr: 'ओपीडी रांग फलक', hi: 'ओपीडी कतार बोर्ड', te: 'OP క్యూ బోర్డులు', kn: 'OP ಕ್ಯೂ ಬೋರ್ಡ್‌ಗಳು' }, icon: <Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
    { id: 'emergency', label: { en: 'Emergency Bay', mr: 'आणीबाणी कक्ष', hi: 'आपातकालीन कक्ष', te: 'ఎమర్జెన్సీ బే', kn: 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ಕೊಠಡಿ' }, icon: <Icon path="M22 12h-4l-3 9L9 3l-3 9H2" /> },
    { id: 'diagnostics', label: { en: 'Diagnostics Hub', mr: 'केंद्रीय तपासणी केंद्र', hi: 'जांच केंद्र', te: 'డయాగ్నస్టిక్స్ హబ్', kn: 'ಡಯಾಗ್ನಸ್ಟಿಕ್ಸ್ ಹಬ್' }, icon: <Icon path="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" d2="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /> },
    { id: 'stock',     label: { en: 'Stock Alerts', mr: 'औषध साठा सूचना', hi: 'स्टॉक अलर्ट', te: 'మందుల నిల్వ హెచ్చరికలు', kn: 'ದಾಸ್ತಾನು ಎಚ್ಚರಿಕೆಗಳು' }, icon: <Icon path="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m10-18v18" /> },
    { id: 'beds',      label: { en: 'Bed Allocation (Blue Room)', mr: '??? ???? (Blue Room)', hi: '??? ????? (Blue Room)', te: '???? ????????? (Blue Room)', kn: '?????? ?????? (Blue Room)' }, icon: <Icon path="M3 7h18M3 12h18M3 17h18" /> },
  ],
  hospital_doctor: [
    { id: 'chart',    label: { en: 'Patient Chart', mr: 'रुग्ण तक्ता', hi: 'मरीज चार्ट', te: 'రోగి చార్ట్', kn: 'ರೋಗಿಯ ಚಾರ್ಟ್' }, icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6" /> },
    { id: 'notes',    label: { en: 'Consult Notes', mr: 'सल्ला नोट्स', hi: 'परामर्श नोट्स', te: 'కన్సల్ట్ నోట్స్', kn: 'ಸಮಾಲೋಚನೆ ಟಿಪ್ಪಣಿಗಳು' }, icon: <Icon path="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" d2="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> },
    { id: 'rx',       label: { en: 'e-Prescription', mr: 'ई-प्रिस्क्रिप्शन', hi: 'ई-प्रिस्क्रिप्शन', te: 'ఇ-ప్రిస్క్రిప్షన్', kn: 'ಇ-ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್' }, icon: <Icon path="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /> },
    { id: 'pipeline', label: { en: 'Advance Referral', mr: 'संदर्भ पुढे पाठवा', hi: 'रेफरल आगे बढ़ाएं', te: 'రిఫరల్ పురోగతి', kn: 'ರೆಫರಲ್ ಮುನ್ನಡೆಸಿ' }, icon: <Icon path="M5 12h14M12 5l7 7-7 7" /> },
  ],
  district_admin: [
    { id: 'kpis',      label: { en: 'KPI Dashboard', mr: 'जिल्हा डॅशबोर्ड', hi: 'केपीआई डैशबोर्ड', te: 'జిల్లా KPI డ్యాష్‌బోర్డ్', kn: 'ಜಿಲ್ಲಾ KPI ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' }, icon: <Icon path="M18 20V10M12 20V4M6 20v-6" /> },
    { id: 'network',   label: { en: 'Facility Network', mr: 'आरोग्य सुविधा जाळे', hi: 'अस्पताल नेटवर्क', te: 'ఆరోగ్య కేంద్రాల నెట్‌వర్క్', kn: 'ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ಜಾಲ' }, icon: <Icon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" d2="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /> },
    { id: 'data_mgmt', label: { en: 'Data Management & FHIR', mr: 'डेटा व्यवस्थापन व FHIR', hi: 'डेटा प्रबंधन एवं FHIR', te: 'డేటా మేనేజ్‌మెంట్ & FHIR', kn: 'ಡೇಟಾ ನಿರ್ವಹಣೆ & FHIR' }, icon: <Icon path="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /> },
    { id: 'audit',     label: { en: 'Audit Log', mr: 'ऑडिट लॉग', hi: 'ऑडिट लॉग', te: 'ఆడిట్ లాగ్', kn: 'ಆಡಿಟ್ ಲಾಗ್' }, icon: <Icon path="M9 11l3 3L22 4" d2="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
    { id: 'referrals', label: { en: 'All Referrals', mr: 'सर्व संदर्भ रुग्ण', hi: 'सभी रेफरल', te: 'అన్ని రిఫరల్స్', kn: 'ಎಲ್ಲಾ ರೆಫರಲ್‌ಗಳು' }, icon: <Icon path="M5 12h14M12 5l7 7-7 7" /> },
    { id: 'feedback',  label: { en: 'Patient Feedback', mr: 'रुग्ण अभिप्राय', hi: 'मरीज प्रतिक्रिया', te: 'రోగుల ఫీడ్‌బ్యాక్', kn: 'ರೋಗಿಗಳ ಪ್ರತಿಕ್ರಿಯೆ' }, icon: <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  ],
};

interface SideNavProps {
  onNavigate: (id: string) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ onNavigate }) => {
  const { role, name, facilityName, lang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;
  const { activeNav, setActiveNav } = useUI();
  const items = NAV_CONFIG[role] ?? [];

  function nav(id: string) {
    setActiveNav(id);
    onNavigate(id);
  }

  const signedInText: Record<Lang, string> = {
    en: 'Signed in as',
    mr: 'लॉग इन वापरकर्ता',
    hi: 'लॉग इन उपयोगकर्ता',
    te: 'లాగిన్ అయిన యూజర్',
    kn: 'ಲಾಗಿನ್ ಆದ ಬಳಕೆದಾರ'
  };

  const navSectionText: Record<Lang, string> = {
    en: 'Navigation',
    mr: 'नेव्हिगेशन',
    hi: 'नेविगेशन',
    te: 'నావిగేషన్',
    kn: 'ನ್ಯಾವಿಗೇಷನ್'
  };

  return (
    <nav className="app-nav" aria-label="Side navigation">
      <div className="side-nav">
        {/* Role info */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--col-border)', marginBottom: 8 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {signedInText[currentLang]}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: 2 }}>{name}</div>
          {facilityName && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--col-teal-dark)', marginTop: 2 }}>{facilityName}</div>
          )}
        </div>

        <div className="nav-section-label">{navSectionText[currentLang]}</div>

        {items.map(item => (
          <button
            key={item.id}
            onClick={() => nav(item.id)}
            className={`nav-item${activeNav === item.id ? ' active' : ''}`}
            aria-current={activeNav === item.id ? 'page' : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label[currentLang] || item.label.en}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

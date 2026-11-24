import React, { useState } from 'react';
import { useSession } from './store';
import { speak } from './lib/voice';
import * as api from './lib/api';
import type { Role, Lang } from './types';

interface RoleConfig {
  role: Role;
  title: { en: string; mr: string; hi: string; te?: string; kn?: string };
  desc: { en: string; mr: string; hi: string; te?: string; kn?: string };
  icon: React.ReactNode;
  demoUsers: Array<{
    name: string;
    email: string;
    designation: { en: string; mr: string; hi: string; te?: string; kn?: string };
    facilityId?: string;
    facilityName?: string;
  }>;
}

const ROLES: RoleConfig[] = [
  {
    role: 'patient',
    title: { en: 'Patient', mr: 'रुग्ण', hi: 'मरीज / नागरिक', te: 'రోగి / పౌరుడు', kn: 'ರೋಗಿ / ನಾಗರಿಕ' },
    desc: {
      en: 'Book tokens, view triage, track referrals, emergency SOS, grievances.',
      mr: 'टोकन बुक करा, आरोग्य इतिहास, १०८ रुग्णवाहिका, तक्रार निवारण.',
      hi: 'टोकन बुक करें, स्वास्थ्य इतिहास, 108 एम्बुलेंस, शिकायत निवारण।',
      te: 'OP టోకెన్లు, AI ట్రయాజ్, ఆరోగ్య చరిత్ర, 108 ఎమర్జెన్సీ SOS, ఫిర్యాదులు.',
      kn: 'OP ಟೋಕನ್‌ಗಳು, AI ಟ್ರಯಾಜ್, ಆರೋಗ್ಯ ಇತಿಹಾಸ, 108 ತುರ್ತು SOS, ದೂರುಗಳು.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'Lakshmi Devi',
        email: 'lakshmi.devi@arogyalink.gov.in',
        designation: { en: 'Lakshmi Devi (Citizen, Inavolu Village, Amaravati)', mr: 'लक्ष्मी देवी (नागरिक, इनावोलू)', hi: 'लक्ष्मी देवी (नागरिक, इनावोलू गांव)', te: 'లక్ష్మీ దేవి (పౌరురాలు, ఇనవోలు గ్రామం, అమరావతి)', kn: 'ಲಕ್ಷ್ಮೀ ದೇವಿ (ನಾಗರಿಕ, ಇನವೋಲು)' }
      },
      {
        name: 'Savita Patil',
        email: 'savita.patil@arogyalink.gov.in',
        designation: { en: 'Savita Patil (ANC 28w, Kelwa)', mr: 'सविता पाटील (२८ आठवडे गरोदर, केळवा)', hi: 'सविता पाटिल (28 सप्ताह गर्भवती, केलवा)', te: 'సవితా పాటిల్ (28వ గర్భధారణ వారం, కేల్వా)', kn: 'ಸವಿತಾ ಪಾಟೀಲ್ (28 ವಾರ ಗರ್ಭಿಣಿ, ಕೇಲ್ವಾ)' }
      },
      {
        name: 'Ramakant Bhagat',
        email: 'ramakant.bhagat@arogyalink.gov.in',
        designation: { en: 'Ramakant Bhagat (T2DM + HTN)', mr: 'रामकांत भगत (मधुमेह व रक्तदाब)', hi: 'रामकांत भगत (मधुमेह एवं रक्तचाप)', te: 'రమాకాంత్ భగత్ (షుగర్ & బీపీ)', kn: 'ರಮಾಕಾಂತ್ ಭಗತ್ (ಮಧುಮೇಹ & ರಕ್ತದೊತ್ತಡ)' }
      }
    ]
  },
  {
    role: 'asha',
    title: { en: 'ASHA / CHW', mr: 'आशा / CHW', hi: 'आशा कार्यकर्ता (CHW)', te: 'ఆశా కార్యకర్త (ASHA / CHW)', kn: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ (ASHA / CHW)' },
    desc: {
      en: 'High-risk list, offline vitals entry, follow-up tasks, medicine delivery.',
      mr: 'उच्च जोखीम यादी, ऑफलाइन नोंदी, पाठपुरावा, लॅब नमुना संकलन.',
      hi: 'उच्च जोखिम मरीज सूची, ऑफलाइन वाइटल एंट्री, फॉलो-अप कार्य, दवा वितरण।',
      te: 'అధిక-ప్రమాద రోగుల జాబితా, ఆఫ్‌లైన్ వైటల్స్, ఫాలో-అప్, మందుల పంపిణీ.',
      kn: 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪಟ್ಟಿ, ಆಫ್‌ಲೈನ್ ವೈಟಲ್ಸ್, ಫಾಲೋ-ಅಪ್, ಔಷಧಿ ವಿತರಣೆ.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'Meena Bhoir',
        email: 'meena.bhoir@arogyalink.gov.in',
        facilityId: 'SC-KELWA-01',
        facilityName: 'Sub-Centre Kelwa',
        designation: { en: 'Meena Bhoir (Sub-Centre Kelwa)', mr: 'मीना भोईर (उप-केंद्र केळवा)', hi: 'मीना भोईर (उप-केंद्र केलवा)', te: 'మీనా భోయిర్ (ఉప-కేంద్రం కేల్వా)', kn: 'ಮೀನಾ ಭೋಯಿರ್ (ಉಪ-ಕೇಂದ್ರ ಕೇಲ್ವಾ)' }
      },
      {
        name: 'Rekha Patil',
        email: 'rekha.patil@arogyalink.gov.in',
        facilityId: 'RH-KHED-01',
        facilityName: 'Rural Hospital Khed',
        designation: { en: 'Rekha Patil (Senior CHW Khed)', mr: 'रेखा पाटील (वरिष्ठ आरोग्य सेविका, खेड)', hi: 'रेखा पाटिल (वरिष्ठ स्वास्थ्य कार्यकर्ता)', te: 'రేఖా పాటిల్ (సీనియర్ CHW ఖేడ్)', kn: 'ರೇಖಾ ಪಾಟೀಲ್ (ಹಿರಿಯ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತೆ)' }
      }
    ]
  },
  {
    role: 'phc_doctor',
    title: { en: 'PHC Doctor', mr: 'PHC वैद्यकीय अधिकारी', hi: 'प्राथमिक स्वास्थ्य केंद्र डॉक्टर', te: 'PHC మెడికల్ ఆఫీసర్', kn: 'PHC ವೈದ್ಯಾಧಿಕಾರಿ' },
    desc: {
      en: 'OPD queue, Clinical Analyse, referral initiation, medicine stock, teleconsult spoke.',
      mr: 'ओपीडी रांग, क्लिनिकल विश्लेषण, संदर्भ सेवा, औषध साठा, दूरसल्ला.',
      hi: 'ओपीडी कतार, क्लीनिकल विश्लेषण, रेफरल प्रबंधन, दवा स्टॉक, टेलीपरामर्श।',
      te: 'OPD క్యూ, క్లినికల్ విశ్లేషణ (Analyse), రిఫరల్స్, మందుల నిల్వ.',
      kn: 'OPD ಕ್ಯೂ, ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ (Analyse), ರೆಫರಲ್ಸ್, ಔಷಧಿ ದಾಸ್ತಾನು.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'Dr. Ramesh Patkar',
        email: 'dr.patkar@arogyalink.gov.in',
        facilityId: 'PHC-KELWA-01',
        facilityName: 'PHC Kelwa',
        designation: { en: 'Dr. Ramesh Patkar (MO In-Charge, PHC Kelwa)', mr: 'डॉ. रमेश पाटकर (वैद्यकीय अधिकारी, PHC केळवा)', hi: 'डॉ. रमेश पाटकर (चिकित्सा अधिकारी, PHC केलवा)', te: 'డాక్టర్ రమేష్ పాట్కర్ (PHC కేల్వా)', kn: 'ಡಾ. ರಮೇಶ್ ಪಾಟ್ಕರ್ (PHC ಕೇಲ್ವಾ)' }
      }
    ]
  },
  {
    role: 'hospital_admin',
    title: { en: 'Hospital Staff / Admin', mr: 'रुग्णालय प्रशासक', hi: 'अस्पताल प्रशासन / स्टाफ', te: 'ఆసుపత్రి అడ్మిన్ / సిబ్బంది', kn: 'ಆಸ್ಪತ್ರೆ ಆಡಳಿತ / ಸಿಬ್ಬಂದಿ' },
    desc: {
      en: 'Bed resources, inbound referrals, OP queue board, emergency bay, grievance review.',
      mr: 'बेड व साधनसामग्री, इनबाउंड संदर्भ, आणीबाणी कक्ष, तक्रार निवारण.',
      hi: 'बेड व संसाधन प्रबंधन, इनबाउंड रेफरल, आपातकालीन कक्ष, शिकायत जांच।',
      te: 'బెడ్లు & వనరులు, వచ్చే రిఫరల్స్, OP క్యూ బోర్డు, ఎమర్జెన్సీ బే.',
      kn: 'ಹಾಸಿಗೆ & ಸಂಪನ್ಮೂಲಗಳು, ಬರುವ ರೆಫರಲ್ಸ್, OP ಕ್ಯೂ ಬೋರ್ಡ್, ತುರ್ತು ಕೋಣೆ.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'AIIMS Mangalagiri Admin',
        email: 'admin.mangalagiri@arogyalink.gov.in',
        facilityId: 'AP-GNT-002',
        facilityName: 'AIIMS Mangalagiri',
        designation: { en: 'Hospital Desk (AIIMS Mangalagiri)', mr: 'रुग्णालय कक्ष (AIIMS)', hi: 'अस्पताल डेस्क (AIIMS)', te: 'ఆసుపత్రి డెస్క్ (AIIMS మంగళగిరి)', kn: 'ಆಸ್ಪತ್ರೆ ಡೆಸ್ಕ್ (AIIMS ಮಂಗಳಗಿರಿ)' }
      },
      {
        name: 'RH Khed Hospital Desk',
        email: 'admin.khed@arogyalink.gov.in',
        facilityId: 'RH-KHED-01',
        facilityName: 'Rural Hospital Khed',
        designation: { en: 'Hospital Desk (Rural Hospital Khed)', mr: 'रुग्णालय कक्ष (ग्रामीण रुग्णालय खेड)', hi: 'अस्पताल डेस्क (ग्रामीण अस्पताल खेड)', te: 'హాస్పిటల్ డెస్క్ (ఖేడ్)', kn: 'ಆಸ್ಪತ್ರೆ ಡೆಸ್ಕ್ (ಖೇಡ್)' }
      }
    ]
  },
  {
    role: 'hospital_doctor',
    title: { en: 'Specialist Doctor', mr: 'तज्ञ डॉक्टर (Specialist)', hi: 'विशेषज्ञ डॉक्टर (Specialist)', te: 'స్పెషలిస్ట్ డాక్టర్ (నిపుణుడు)', kn: 'ತಜ್ಞ ವೈದ್ಯರು (Specialist)' },
    desc: {
      en: 'Patient chart, Clinical Analyse confirm, teleconsult hub, e-Prescription, green channel admission.',
      mr: 'रुग्ण तक्ता, क्लिनिकल विश्लेषण पुष्टी, दूरसल्ला हब, ई-प्रिस्क्रिप्शन, ग्रीन चॅनेल प्रवेश.',
      hi: 'मरीज चार्ट, क्लीनिकल विश्लेषण पुष्टि, विशेषज्ञ टेलीपरामर्श हब, ई-प्रिस्क्रिप्शन।',
      te: 'రోగి చార్ట్, క్లినికల్ విశ్లేషణ నిర్ధారణ, టెలీకన్సల్ట్ హబ్, ఇ-ప్రిస్క్రిప్షన్, గ్రీన్ ఛానల్.',
      kn: 'ರೋಗಿಯ ಚಾರ್ಟ್, ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ ದೃಢೀಕರಣ, ಟೆಲಿಕನ್ಸಲ್ಟ್ ಹಬ್, ಇ-ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'Dr. Neeta Kulkarni',
        email: 'dr.kulkarni@arogyalink.gov.in',
        facilityId: 'RH-KHED-01',
        facilityName: 'Rural Hospital Khed',
        designation: { en: 'Dr. Neeta Kulkarni (Consultant OBG, MS)', mr: 'डॉ. नीता कुलकर्णी (स्त्रीरोग व प्रसूतीतज्ञ, MS)', hi: 'डॉ. नीता कुलकर्णी (स्त्री रोग विशेषज्ञ, MS)', te: 'డాక్టర్ నీతా కులకర్ణి (గైనకాలజిస్ట్, MS)', kn: 'ಡಾ. ನೀತಾ ಕುಲಕರ್ಣಿ (ಸ್ತ್ರೀರೋಗ ತಜ್ಞರು, MS)' }
      },
      {
        name: 'Dr. Pradeep Kale',
        email: 'dr.kale@arogyalink.gov.in',
        facilityId: 'AP-GNT-002',
        facilityName: 'AIIMS Mangalagiri',
        designation: { en: 'Dr. Pradeep Kale (Cardiologist, DM)', mr: 'डॉ. प्रदीप काळे (हृदयरोगतज्ञ, DM)', hi: 'डॉ. प्रदीप काले (हृदय रोग विशेषज्ञ, DM)', te: 'డాక్టర్ ప్రదీప్ కాలే (కార్డియాలజిస్ట్, DM)', kn: 'ಡಾ. ಪ್ರದೀಪ್ ಕಾಳೆ (ಹೃದ್ರೋಗ ತಜ್ಞರು, DM)' }
      }
    ]
  },
  {
    role: 'district_admin',
    title: { en: 'District Admin', mr: 'जिल्हा आरोग्य अधिकारी', hi: 'जिला स्वास्थ्य अधिकारी (DHO)', te: 'జిల్లా వైద్యాధికారి (DMHO / DHO)', kn: 'ಜಿಲ್ಲಾ ಆರೋಗ್ಯಾಧಿಕಾರಿ (DHO)' },
    desc: {
      en: 'District KPI dashboard, facility network, citizen grievance audit, gap analysis.',
      mr: 'जिल्हा डॅशबोर्ड, सुविधा नेटवर्क, नागरिक तक्रार ऑडिट, त्रुटी विश्लेषण.',
      hi: 'जिला केपीआई डैशबोर्ड, अस्पताल नेटवर्क, नागरिक शिकायत ऑडिट।',
      te: 'జిల్లా KPI డ్యాష్‌బోర్డ్, ఆసుపత్రుల నెట్‌వర్క్, పౌర ఫిర్యాదుల ఆడిట్.',
      kn: 'ಜಿಲ್ಲಾ KPI ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಆಸ್ಪತ್ರೆಗಳ ಜಾಲ, ಸಾರ್ವಜನಿಕ ದೂರುಗಳ ಆಡಿಟ್.'
    },
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    demoUsers: [
      {
        name: 'Dr. D. S. Chavan',
        email: 'dho.palghar@arogyalink.gov.in',
        facilityId: 'DH-PALGHAR-01',
        facilityName: 'District Hospital Palghar',
        designation: { en: 'Dr. D. S. Chavan (District Health Officer)', mr: 'डॉ. डी. एस. चव्हाण (जिल्हा आरोग्य अधिकारी)', hi: 'डॉ. डी. एस. चव्हाण (जिला स्वास्थ्य अधिकारी)', te: 'డాక్టర్ డి.ఎస్. చవాన్ (జిల్లా వైద్యాధికారి)', kn: 'ಡಾ. ಡಿ. ಎಸ್. ಚವಾಣ್ (ಜಿಲ್ಲಾ ಆರೋಗ್ಯಾಧಿಕಾರಿ)' }
      }
    ]
  }
];

export const LoginGateway: React.FC = () => {
  const { login } = useSession();
  const [selectedRole, setSelectedRole] = useState<Role | null>('patient');
  const [lang, setLang] = useState<Lang>(() => (typeof window !== 'undefined' && localStorage.getItem('al_lang') as Lang) || 'te');
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  // Login Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'demo_select' | 'email_login' | 'register'>('demo_select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Patient Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('Password@123');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('Inavolu Village');
  const [regAge, setRegAge] = useState('26');
  const [regGender, setRegGender] = useState('F');

  const activeRoleConfig = ROLES.find(r => r.role === selectedRole) || ROLES[0];

  function openLoginModal(role: Role) {
    setSelectedRole(role);
    setLoginError('');
    setShowAuthModal(true);
    const rConfig = ROLES.find(r => r.role === role);
    if (rConfig?.demoUsers?.[0]) {
      setEmail(rConfig.demoUsers[0].email);
      setPassword('Password@123');
    }
  }

  async function handleDirectLogin(user: typeof activeRoleConfig.demoUsers[0]) {
    setLoading(true);
    try {
      try {
        const res = await api.post<{ ok: boolean; user: { name: string; role: Role; facilityId?: string; facilityName?: string }; accessToken?: string }>('/api/auth/login', {
          email: user.email,
          password: 'Password@123',
          role: selectedRole
        });
        if (res?.accessToken && typeof localStorage !== 'undefined') {
          localStorage.setItem('al_token', res.accessToken);
        }
      } catch (authErr) {
        console.warn('API login call failed, proceeding with local session:', authErr);
      }
      login(selectedRole || 'patient', user.name, currentLang, user.facilityId, user.facilityName);
      const welcomeMsg = currentLang === 'te'
        ? `${user.name} గా ఆరోగ్యలింక్‌కు స్వాగతం.`
        : currentLang === 'kn'
        ? `${user.name} ರಾಗಿ ಆರೋಗ್ಯಲಿಂಕ್‌ಗೆ ಸುಸ್ವಾಗತ.`
        : currentLang === 'mr'
        ? `${user.name} म्हणून ArogyaLink मध्ये आपले स्वागत आहे.`
        : currentLang === 'hi'
        ? `${user.name} के रूप में ArogyaLink में आपका स्वागत है।`
        : `Welcome to ArogyaLink as ${user.name}.`;
      speak(welcomeMsg, currentLang);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await api.post<{ ok: boolean; user: { name: string; role: Role; facilityId?: string; facilityName?: string }; accessToken?: string }>('/api/auth/login', {
        email,
        password,
        role: selectedRole
      });
      if (res?.accessToken && typeof localStorage !== 'undefined') {
        localStorage.setItem('al_token', res.accessToken);
      }
      if (res?.user) {
        login(res.user.role || selectedRole || 'patient', res.user.name, currentLang, res.user.facilityId, res.user.facilityName);
        speak(
          currentLang === 'te' ? `${res.user.name} లాగిన్ అయ్యారు.` : currentLang === 'mr' ? `${res.user.name} म्हणून लॉग इन झाले.` : `Logged in as ${res.user.name}.`,
          currentLang
        );
      } else {
        setLoginError('Invalid credentials. Use Password@123 for official demo accounts.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setLoginError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const res = await api.post<{ ok: boolean; user: { name: string; role: Role } }>('/api/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        village: regVillage,
        age: regAge,
        gender: regGender
      });
      if (res?.user) {
        login('patient', res.user.name, currentLang);
        speak(
          currentLang === 'te' ? `రోగి నమోదు విజయవంతమైంది. స్వాగతం ${res.user.name}.` : `Patient registration successful. Welcome ${res.user.name}.`,
          currentLang
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  }

  const UI_TEXT: Record<Lang, {
    govBar: string;
    subTitle: string;
    headline: string;
    intro: string;
    langLabel: string;
    clickToLogin: string;
    modalTitle: string;
    tabQuick: string;
    tabEmail: string;
    tabRegister: string;
    emailPlaceholder: string;
    passPlaceholder: string;
    loginBtn: string;
    cancelBtn: string;
    demoCredNotice: string;
    disclaimer: string;
  }> = {
    en: {
      govBar: 'National Health Mission · ArogyaLink — SIH 2026 · Problem 26133',
      subTitle: 'Smart Rural Healthcare Access & Integrated Care Platform',
      headline: 'Select your role to access your workspace',
      intro: 'ArogyaLink coordinates care across Sub-Centres, PHCs, Area Hospitals, and Medical Colleges. Choose your role to sign in or register.',
      langLabel: 'Language / భాష:',
      clickToLogin: 'Click to Sign In',
      modalTitle: 'Government Identity & Access Gateway',
      tabQuick: 'Demo Accounts (1-Click)',
      tabEmail: 'Email & Password',
      tabRegister: 'Register New Patient',
      emailPlaceholder: 'Official email ID',
      passPlaceholder: 'Password',
      loginBtn: 'Sign In Securely',
      cancelBtn: 'Back',
      demoCredNotice: 'Official Demo Password for all accounts is: Password@123',
      disclaimer: 'Demonstration environment under Government Digital Health Guidelines (SIH 2026). All data is protected.'
    },
    te: {
      govBar: 'జాతీయ ఆరోగ్య మిషన్ (NHM) · ఆరోగ్యలింక్ — SIH 2026 · సమస్య 26133',
      subTitle: 'స్మార్ట్ గ్రామీణ ఆరోగ్య సంరక్షణ & సమగ్ర కేర్ ప్లాట్‌ఫారమ్',
      headline: 'మీ వర్క్‌స్పేస్‌ను తెరవడానికి మీ పాత్రను ఎంచుకోండి',
      intro: 'ఆరోగ్యలింక్ ఉప-కేంద్రాలు, PHCలు, ఏరియా ఆసుపత్రులు మరియు మెడికల్ కాలేజీల మధ్య సంరక్షణను సమన్వయం చేస్తుంది. లాగిన్ చేయడానికి మీ పాత్రను ఎంచుకోండి.',
      langLabel: 'భాష / Language:',
      clickToLogin: 'లాగిన్ చేయడానికి క్లిక్ చేయండి',
      modalTitle: 'ప్రభుత్వ గుర్తింపు & యాక్సెస్ గేట్‌వే',
      tabQuick: 'డెమో ఖాతాలు (1-క్లిక్ ప్రవేశం)',
      tabEmail: 'ఇమెయిల్ & పాస్‌వర్డ్',
      tabRegister: 'కొత్త రోగి నమోదు',
      emailPlaceholder: 'అధికారిక ఇమెయిల్ ఐడి',
      passPlaceholder: 'పాస్‌వర్డ్',
      loginBtn: 'సురక్షితంగా ప్రవేశించండి',
      cancelBtn: 'వెనుకకు',
      demoCredNotice: 'అన్ని ఖాతాల కోసం అధికారిక డెమో పాస్‌వర్డ్: Password@123',
      disclaimer: 'ప్రభుత్వ డిజిటల్ హెల్త్ మార్గదర్శకాల కింద నడుస్తున్న వ్యవస్థ. డేటా సురక్షితం.'
    },
    kn: {
      govBar: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ (NHM) · ಆರೋಗ್ಯಲಿಂಕ್ — SIH 2026 · ಸಮಸ್ಯೆ 26133',
      subTitle: 'ಸ್ಮಾರ್ಟ್ ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ವೇದಿಕೆ ಮತ್ತು ಸಮನ್ವಯ ವ್ಯವಸ್ಥೆ',
      headline: 'ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷೇತ್ರ ಪ್ರವೇಶಿಸಲು ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      intro: 'ಆರೋಗ್ಯಲಿಂಕ್ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳ ನಡುವೆ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ.',
      langLabel: 'ಭಾಷೆ / Language:',
      clickToLogin: 'ಲಾಗಿನ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
      modalTitle: 'ಸರ್ಕಾರಿ ಗುರುತು ಮತ್ತು ಲಾಗಿನ್ ಪೋರ್ಟಲ್',
      tabQuick: 'ಡೆಮೊ ಖಾತೆಗಳು (1-ಕ್ಲಿಕ್ ಪ್ರವೇಶ)',
      tabEmail: 'ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್',
      tabRegister: 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ',
      emailPlaceholder: 'ಅಧಿಕೃತ ಇಮೇಲ್ ಐಡಿ',
      passPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್',
      loginBtn: 'ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಆಗಿ',
      cancelBtn: 'ಹಿಂದಕ್ಕೆ',
      demoCredNotice: 'ಎಲ್ಲಾ ಖಾತೆಗಳ ಅಧಿಕೃತ ಡೆಮೊ ಪಾಸ್‌ವರ್ಡ್: Password@123',
      disclaimer: 'ಸರ್ಕಾರಿ ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಮಾರ್ಗಸೂಚಿಗಳ ಅಡಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ವ್ಯವಸ್ಥೆ.'
    },
    hi: {
      govBar: 'राष्ट्रीय स्वास्थ्य मिशन (NHM) · ArogyaLink — SIH 2026 · समस्या 26133',
      subTitle: 'स्मार्ट ग्रामीण स्वास्थ्य पहुंच एवं समन्वय मंच',
      headline: 'कार्यक्षेत्र में प्रवेश हेतु अपनी भूमिका चुनें',
      intro: 'ArogyaLink उप-स्वास्थ्य केंद्रों, प्राथमिक स्वास्थ्य केंद्रों, ग्रामीण और जिला अस्पतालों के बीच समन्वय स्थापित करता है।',
      langLabel: 'भाषा / Language:',
      clickToLogin: 'लॉग इन करने के लिए क्लिक करें',
      modalTitle: 'शासकीय पहचान एवं लॉगिन पोर्टल',
      tabQuick: 'डेमो खाते (1-क्लिक प्रवेश)',
      tabEmail: 'ईमेल एवं पासवर्ड',
      tabRegister: 'नया मरीज पंजीकरण',
      emailPlaceholder: 'आधिकारिक ईमेल आईडी',
      passPlaceholder: 'पासवर्ड',
      loginBtn: 'सुरक्षित प्रवेश करें',
      cancelBtn: 'वापस जाएं',
      demoCredNotice: 'सभी खातों के लिए आधिकारिक डेमो पासवर्ड: Password@123',
      disclaimer: 'राष्ट्रीय स्वास्थ्य मिशन SIH 2026 दिशा-निर्देशों के तहत संचालित प्रणाली।'
    },
    mr: {
      govBar: 'राष्ट्रीय आरोग्य अभियान (NHM) · ArogyaLink — SIH 2026 · समस्या २६१३३',
      subTitle: 'स्मार्ट ग्रामीण आरोग्य समन्वय प्रणाली',
      headline: 'आपल्या कार्यक्षेत्रात प्रवेश करण्यासाठी भूमिका निवडा',
      intro: 'ArogyaLink उप-केंद्र, प्राथमिक आरोग्य केंद्र, ग्रामीण रुग्णालय व जिल्हा रुग्णालय या सर्व स्तरांवर आरोग्य समन्वय साधते.',
      langLabel: 'भाषा / Language:',
      clickToLogin: 'लॉग इन करण्यासाठी येथे क्लिक करा',
      modalTitle: 'शासकीय ओळख व लॉगिन पोर्टल',
      tabQuick: 'डेमो खाती (१-क्लिक प्रवेश)',
      tabEmail: 'ईमेल व पासवर्ड',
      tabRegister: 'नवीन रुग्ण नोंदणी',
      emailPlaceholder: 'शासकीय ईमेल आयडी',
      passPlaceholder: 'पासवर्ड',
      loginBtn: 'सुरक्षित लॉगिन करा',
      cancelBtn: 'मागे जा',
      demoCredNotice: 'सर्व खात्यांसाठी अधिकृत डेमो पासवर्ड: Password@123',
      disclaimer: 'राष्ट्रीय आरोग्य अभियान SIH २०२६ अंतर्गत प्रात्यक्षिक प्रणाली।'
    }
  };

  const ui = UI_TEXT[currentLang] || UI_TEXT.en;

  return (
    <div className="login-screen">
      {/* Government Trust Ribbon */}
      <div className="login-gov-bar">
        {ui.govBar}
      </div>

      <header className="login-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--col-teal)" strokeWidth="2" width="44" height="44">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
        </svg>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--col-teal-dark)' }}>
            ArogyaLink
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--col-ink-muted)' }}>
            {ui.subTitle}
          </div>
        </div>
      </header>

      <main className="login-body">
        <div className="login-intro" style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--col-teal-dark)', margin: '0 0 8px' }}>
            {ui.headline}
          </h1>
          <p style={{ maxWidth: 680, margin: '0 auto', color: 'var(--col-ink-light)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {ui.intro}
          </p>

          {/* Multilingual Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 18, background: 'var(--col-paper)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--col-border)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--col-ink-muted)' }}>{ui.langLabel}</span>
            {(['te', 'kn', 'mr', 'hi', 'en'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`btn btn-sm ${lang === l ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 14, padding: '3px 12px', fontSize: '0.8125rem' }}
              >
                {l === 'te' ? 'తెలుగు' : l === 'kn' ? 'ಕನ್ನಡ' : l === 'mr' ? 'मराठी' : l === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="role-grid" role="listbox" aria-label="Select role">
          {ROLES.map(r => (
            <button
              key={r.role}
              className={`role-card${selectedRole === r.role ? ' selected' : ''}`}
              onClick={() => openLoginModal(r.role)}
              role="option"
              aria-selected={selectedRole === r.role}
              style={{ textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <div className="role-icon">{r.icon}</div>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1.05rem', color: 'var(--col-ink)' }}>
                {r.title[currentLang] || r.title.en}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--col-ink-light)', lineHeight: 1.4 }}>
                {r.desc[currentLang] || r.desc.en}
              </p>
              <div style={{ marginTop: 12, fontSize: '0.75rem', fontWeight: 700, color: 'var(--col-teal)' }}>
                ➔ {ui.clickToLogin}
              </div>
            </button>
          ))}
        </div>

        {/* Auth & Credential Selection Modal */}
        {showAuthModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(13, 59, 53, 0.65)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
          }}>
            <div className="card" style={{ maxWidth: 540, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="card-header" style={{ background: 'var(--col-teal-dark)', color: '#ffffff', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ color: '#ffffff' }}>{activeRoleConfig.icon}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff' }}>
                      {activeRoleConfig.title[currentLang] || activeRoleConfig.title.en} — {ui.modalTitle}
                    </h3>
                  </div>
                </div>
                <button onClick={() => setShowAuthModal(false)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff', minWidth: 32 }}>✕</button>
              </div>

              {/* Modal Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--col-border)', background: 'var(--col-paper)' }}>
                <button
                  onClick={() => { setAuthMode('demo_select'); setLoginError(''); }}
                  style={{
                    flex: 1, padding: '10px 8px', border: 'none', background: authMode === 'demo_select' ? 'var(--col-surface)' : 'transparent',
                    fontWeight: authMode === 'demo_select' ? 700 : 500,
                    borderBottom: authMode === 'demo_select' ? '3px solid var(--col-teal)' : 'none',
                    cursor: 'pointer', fontSize: '0.8125rem'
                  }}
                >
                  {ui.tabQuick}
                </button>
                <button
                  onClick={() => { setAuthMode('email_login'); setLoginError(''); }}
                  style={{
                    flex: 1, padding: '10px 8px', border: 'none', background: authMode === 'email_login' ? 'var(--col-surface)' : 'transparent',
                    fontWeight: authMode === 'email_login' ? 700 : 500,
                    borderBottom: authMode === 'email_login' ? '3px solid var(--col-teal)' : 'none',
                    cursor: 'pointer', fontSize: '0.8125rem'
                  }}
                >
                  {ui.tabEmail}
                </button>
                {selectedRole === 'patient' && (
                  <button
                    onClick={() => { setAuthMode('register'); setLoginError(''); }}
                    style={{
                      flex: 1, padding: '10px 8px', border: 'none', background: authMode === 'register' ? 'var(--col-surface)' : 'transparent',
                      fontWeight: authMode === 'register' ? 700 : 500,
                      borderBottom: authMode === 'register' ? '3px solid var(--col-teal)' : 'none',
                      cursor: 'pointer', fontSize: '0.8125rem'
                    }}
                  >
                    {ui.tabRegister}
                  </button>
                )}
              </div>

              <div className="card-body" style={{ padding: '20px' }}>
                {loginError && (
                  <div className="alert alert-error" style={{ marginBottom: 16, fontSize: '0.8125rem' }}>
                    ⚠ {loginError}
                  </div>
                )}

                {/* Mode 1: Quick 1-Click Demo Accounts */}
                {authMode === 'demo_select' && (
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)', marginBottom: 12 }}>
                      {currentLang === 'te'
                        ? 'కింది ఏదైనా నమోదిత ఖాతాపై 1-క్లిక్ చేసి నేరుగా లాగిన్ అవ్వండి:'
                        : currentLang === 'kn'
                        ? 'ಕೆಳಗಿನ ಯಾವುದೇ ಖಾತೆಯ ಮೇಲೆ 1-ಕ್ಲಿಕ್ ಮಾಡಿ ನೇರವಾಗಿ ಪ್ರವೇಶಿಸಿ:'
                        : currentLang === 'mr'
                        ? 'खालीलपैकी कोणत्याही नोंदणीकृत खात्यावर १-क्लिक करून थेट प्रवेश करा:'
                        : currentLang === 'hi'
                        ? 'निम्नलिखित किसी भी पंजीकृत खाते पर 1-क्लिक करके प्रवेश करें:'
                        : 'Select any pre-configured registered account to sign in directly:'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeRoleConfig.demoUsers.map(user => (
                        <div
                          key={user.email}
                          onClick={() => handleDirectLogin(user)}
                          style={{
                            padding: '12px 14px', border: '1.5px solid var(--col-border)', borderRadius: 6,
                            cursor: 'pointer', transition: 'background 0.15s ease', background: 'var(--col-paper)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--col-teal)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--col-border)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.9375rem', color: 'var(--col-teal-dark)' }}>
                              {user.name}
                            </strong>
                            <span className="badge badge-routine" style={{ fontSize: '0.6875rem' }}>
                              ➔ {currentLang === 'te' ? 'లాగిన్' : currentLang === 'kn' ? 'ಪ್ರವೇಶಿಸಿ' : currentLang === 'mr' ? 'प्रवेश करा' : currentLang === 'hi' ? 'प्रवेश करें' : 'Sign In'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)', marginTop: 2 }}>
                            {user.designation[currentLang] || user.designation.en}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                            📧 {user.email} · 🔑 Password@123
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 16, padding: '8px 12px', background: '#eff6ff', borderRadius: 4, border: '1px solid var(--col-blue-border)', fontSize: '0.75rem', color: 'var(--col-ink-light)' }}>
                      ℹ️ {ui.demoCredNotice}
                    </div>
                  </div>
                )}

                {/* Mode 2: Email & Password Form */}
                {authMode === 'email_login' && (
                  <form onSubmit={handleEmailPasswordSubmit}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">{ui.emailPlaceholder}</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. savita.patil@arogyalink.gov.in"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">{ui.passPlaceholder}</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Password@123"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginBottom: 16 }}>
                      💡 Demo credentials: <code style={{ background: '#eee', padding: '2px 4px', borderRadius: 3 }}>Password@123</code>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                        {loading ? 'Authenticating…' : ui.loginBtn}
                      </button>
                      <button type="button" onClick={() => setShowAuthModal(false)} className="btn btn-ghost">
                        {ui.cancelBtn}
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode 3: Patient Registration */}
                {authMode === 'register' && (
                  <form onSubmit={handleRegisterSubmit}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Full Name / పూర్తి పేరు</label>
                      <input type="text" className="form-control" placeholder="e.g. Lakshmi Devi" value={regName} onChange={e => setRegName(e.target.value)} required />
                    </div>
                    <div className="grid-2" style={{ gap: 10, marginBottom: 10 }}>
                      <div>
                        <label className="form-label">Age / వయస్సు</label>
                        <input type="number" className="form-control" value={regAge} onChange={e => setRegAge(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Gender / లింగం</label>
                        <select className="form-control" value={regGender} onChange={e => setRegGender(e.target.value)}>
                          <option value="F">Female / స్త్రీ</option>
                          <option value="M">Male / పురుషుడు</option>
                          <option value="O">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Village / గ్రామం</label>
                      <input type="text" className="form-control" placeholder="e.g. Inavolu Village" value={regVillage} onChange={e => setRegVillage(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">Email ID</label>
                      <input type="email" className="form-control" placeholder="e.g. lakshmi.devi@arogyalink.gov.in" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                      <div>
                        <label className="form-label">Phone / ఫోన్</label>
                        <input type="tel" className="form-control" placeholder="98XXXXXXXX" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                        {loading ? 'Registering…' : 'Complete Registration & Sign In'}
                      </button>
                      <button type="button" onClick={() => setShowAuthModal(false)} className="btn btn-ghost">
                        {ui.cancelBtn}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: 36, textAlign: 'center', fontSize: '0.8125rem', color: 'var(--col-ink-muted)' }}>
          {ui.disclaimer}
        </footer>
      </main>
    </div>
  );
};

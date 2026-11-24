/**
 * ArogyaLink — Voice Assistant
 * Female voice, multilingual: mr-IN (Marathi), hi-IN (Hindi), en-IN (English)
 * Uses Web Speech API with graceful fallback
 */

export type Lang = 'en' | 'hi' | 'mr' | 'te' | 'kn';

const LANG_BCP47: Record<Lang, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US'],
  hi: ['hi-IN', 'hi'],
  mr: ['mr-IN', 'mr'],
  te: ['te-IN', 'te'],
  kn: ['kn-IN', 'kn'],
};

// ─── Clinical scripts ─────────────────────────────────────────────────────────
export const VOICE_SCRIPTS: Record<string, Record<Lang, string>> = {
  welcome: {
    en: 'Welcome to ArogyaLink. This is an integrated public health coordination service.',
    hi: 'ArogyaLink में आपका स्वागत है। यह सरकारी स्वास्थ्य समन्वय सेवा है।',
    mr: 'ArogyaLink मध्ये आपले स्वागत आहे. हे ग्रामीण आरोग्य समन्वय सेवा आहे.',
    te: 'ఆరోగ్యలింక్‌కి స్వాగతం. ఇది ప్రభుత్వ ఆరోగ్య సమన్వయ వేదిక.',
    kn: 'ಆರೋಗ್ಯಲಿಂಕ್‌ಗೆ ಸುಸ್ವಾಗತ. ಇದು ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಸಮನ್ವಯ ವೇದಿಕೆ.',
  },
  triage_emergency: {
    en: 'Emergency alert. This patient needs immediate hospital care. Please call 108 now or take them to the nearest emergency hospital immediately.',
    hi: 'आपातकालीन चेतावनी। इस मरीज़ को तुरंत अस्पताल की ज़रूरत है। अभी 108 पर कॉल करें।',
    mr: 'आणीबाणी सूचना. या रुग्णाला त्वरित रुग्णालयात नेणे आवश्यक आहे. कृपया आत्ताच 108 वर कॉल करा.',
    te: 'అత్యవసర హెచ్చరిక. ఈ రోగికి తక్షణ ఆసుపత్రి చికిత్స అవసరం. దయచేసి వెంటనే 108 కి కాల్ చేయండి.',
    kn: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ. ಈ ರೋಗಿಗೆ ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಯ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ.',
  },
  triage_urgent: {
    en: 'This patient needs urgent care today. Please arrange transport to the health centre or hospital as soon as possible.',
    hi: 'इस मरीज़ को आज तत्काल देखभाल की ज़रूरत है। कृपया जल्द से जल्द स्वास्थ्य केंद्र ले जाएं।',
    mr: 'या रुग्णाला आज तातडीची काळजी घेणे आवश्यक आहे. कृपया लवकरात लवकर आरोग्य केंद्रात न्या.',
    te: 'ఈ రోగికి ఈరోజే అత్యవసర వైద్య సంరక్షణ అవసరం. దయచేసి వీలైనంత త్వరగా ఆసుపత్రికి తీసుకెళ్లండి.',
    kn: 'ಈ ರೋಗಿಗೆ ಇಂದೇ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಆದಷ್ಟು ಬೇಗ ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯಿರಿ.',
  },
  triage_routine: {
    en: 'Routine care recommended. The patient can visit the PHC or health clinic at the next available slot.',
    hi: 'नियमित देखभाल की सिफारिश की जाती है। मरीज़ अगली उपलब्ध नियुक्ति में PHC जा सकते हैं।',
    mr: 'नियमित काळजी सुचवली जाते. रुग्ण पुढील उपलब्ध वेळेत PHC ला भेट देऊ शकतात.',
    te: 'సాధారణ సంరక్షణ సూచించబడింది. రోగి అందుబాటులో ఉన్న సమయంలో PHC ని సందర్శించవచ్చు.',
    kn: 'ಸಾಮಾನ್ಯ ಆರೈಕೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ. ರೋಗಿಯು ಲಭ್ಯವಿರುವ ಸಮಯದಲ್ಲಿ PHC ಗೆ ಭೇಟಿ ನೀಡಬಹುದು.',
  },
  token_booked: {
    en: 'Your token has been registered. Please remember your token number and arrive on time.',
    hi: 'आपका टोकन रजिस्टर हो गया है। कृपया अपना टोकन नंबर याद रखें।',
    mr: 'तुमचा टोकन नोंदणी झाला आहे. कृपया टोकन क्रमांक लक्षात ठेवा.',
    te: 'మీ టోకెన్ విజయవంతంగా నమోదు చేయబడింది. దయచేసి సమయానికి హాజరుకండి.',
    kn: 'ನಿಮ್ಮ ಟೋಕನ್ ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಸಮಯಕ್ಕೆ ಹಾಜರಾಗಿ.',
  },
  referral_initiated: {
    en: 'Referral created. The receiving facility has been notified and transport is being arranged.',
    hi: 'रेफरल बना दिया गया है। प्राप्त करने वाली सुविधा को सूचित किया गया है।',
    mr: 'रेफरल तयार केले आहे. स्वीकारणाऱ्या सुविधेला सूचित केले आहे.',
    te: 'రిఫరల్ సృష్టించబడింది. స్వీకరించే ఆసుపత్రికి సమాచారం అందించబడింది.',
    kn: 'ರೆಫರಲ್ ರಚಿಸಲಾಗಿದೆ. ಸ್ವೀಕರಿಸುವ ಆಸ್ಪತ್ರೆಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.',
  },
  followup_reminder: {
    en: 'You have pending follow-up visits today. Please complete them as scheduled.',
    hi: 'आज आपके लंबित फॉलो-अप विज़िट हैं। कृपया उन्हें समय पर पूरा करें।',
    mr: 'आज तुमच्याकडे प्रलंबित पाठपुरावा भेटी आहेत. कृपया त्या वेळेवर पूर्ण करा.',
    te: 'ఈరోజు మీకు ఫాలో-అప్ సందర్శనలు ఉన్నాయి. దయచేసి పూర్తి చేయండి.',
    kn: 'ಇಂದು ಬಾಕಿ ಇರುವ ಫಾಲೋ-ಅಪ್ ಭೇಟಿಗಳಿವೆ. ದಯವಿಟ್ಟು ಪೂರ್ಣಗೊಳಿಸಿ.',
  },
  offline_sync: {
    en: 'You are now online. Syncing your offline records to the server.',
    hi: 'आप अब ऑनलाइन हैं। रिकॉर्ड सर्वर पर सिंक किए जा रहे हैं।',
    mr: 'तुम्ही आता ऑनलाइन आहात. तुमचे रेकॉर्ड सर्व्हरवर समक्रमित होत आहेत.',
    te: 'మీరు ఇప్పుడు ఆన్‌లైన్‌లో ఉన్నారు. రికార్డులు సమకాలీకరించబడుతున్నాయి.',
    kn: 'ನೀವು ಈಗ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ದಾಖಲೆಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
  },
  teleconsult_started: {
    en: 'Teleconsult session started. The doctor will join shortly.',
    hi: 'टेलीपरामर्श सत्र शुरू हो गया है। डॉक्टर जल्द ही जुड़ेंगे।',
    mr: 'दूरसल्ला सत्र सुरू झाले. डॉक्टर लवकरच सामील होतील.',
    te: 'టెలీకన్సల్ట్ ప్రారంభమైంది. డాక్టర్ త్వరలో జాయిన్ అవుతారు.',
    kn: 'ಟೆಲಿಕನ್ಸಲ್ಟ್ ಪ್ರಾರಂಭವಾಗಿದೆ. ವೈದ್ಯರು ಶೀಘ್ರದಲ್ಲೇ ಸೇರುತ್ತಾರೆ.',
  },
  vitals_saved: {
    en: 'Vital signs recorded and saved successfully.',
    hi: 'वाइटल साइन सफलतापूर्वक रिकॉर्ड हो गए।',
    mr: 'व्हायटल्स यशस्वीरीत्या नोंदवले आणि जतन केले.',
    te: 'వైటల్స్ విజయవంతంగా నమోదు చేయబడ్డాయి.',
    kn: 'ವೈಟಲ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.',
  },
  high_risk_alert: {
    en: 'High-risk patient alert. Immediate attention required.',
    hi: 'उच्च जोखिम रोगी चेतावनी। तत्काल ध्यान आवश्यक है।',
    mr: 'उच्च जोखीम रुग्ण सूचना. त्वरित लक्ष आवश्यक आहे.',
    te: 'అధిక ప్రమాదకర రోగి హెచ్చరిక. తక్షణ శ్రద్ధ అవసరం.',
    kn: 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ರೋಗಿಯ ಎಚ್ಚರಿಕೆ. ತಕ್ಷಣದ ಗಮನ ಅಗತ್ಯವಿದೆ.',
  },
};

// ─── State ────────────────────────────────────────────────────────────────────
let _voices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;
let _speaking = false;
let _transcript = '';
let _listeners: Array<(t: string, s: boolean) => void> = [];

function notify() {
  _listeners.forEach(fn => fn(_transcript, _speaking));
}

/** Load voices — must be called after user interaction on Chrome */
export function loadVoices(): void {
  if (!('speechSynthesis' in window)) return;
  const load = () => {
    _voices = window.speechSynthesis.getVoices();
    _voicesLoaded = _voices.length > 0;
  };
  load();
  if (!_voicesLoaded) {
    window.speechSynthesis.onvoiceschanged = () => { load(); };
  }
}

function ensureVoices(): SpeechSynthesisVoice[] {
  if (!_voicesLoaded || !_voices.length) {
    _voices = window.speechSynthesis?.getVoices() || [];
    _voicesLoaded = _voices.length > 0;
  }
  return _voices;
}

function findFemaleVoice(lang: Lang): SpeechSynthesisVoice | null {
  const voices = ensureVoices();
  const preferred = LANG_BCP47[lang];
  for (const langCode of preferred) {
    const base = langCode.split('-')[0];
    // 1. Female voice for this language
    const f = voices.find(v => v.lang.startsWith(base) && v.name.toLowerCase().includes('female'));
    if (f) return f;
    // 2. Heera (MS female for Indian English), Google हिंदी, Google मराठी
    const named = voices.find(v => v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('google') && v.lang.startsWith(base));
    if (named) return named;
    // 3. Any voice for this language
    const any = voices.find(v => v.lang.startsWith(base));
    if (any) return any;
  }
  // Fallback to any voice
  return voices[0] || null;
}

export function speak(text: string, lang: Lang = 'mr'): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  ensureVoices(); // refresh voice list each time

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findFemaleVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.lang = LANG_BCP47[lang][0];
  utterance.rate  = 0.90;  // slightly slow for clinical clarity
  utterance.pitch = 1.08;  // warm female pitch
  utterance.volume = 1;

  utterance.onstart = () => { _speaking = true; _transcript = text; notify(); };
  utterance.onend   = () => { _speaking = false; notify(); };
  utterance.onerror = () => { _speaking = false; notify(); };

  // Chrome quirk: speech sometimes silently fails unless paused first
  window.speechSynthesis.cancel();
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
}

export function speakScript(key: string, lang: Lang): void {
  const script = VOICE_SCRIPTS[key]?.[lang] ?? VOICE_SCRIPTS[key]?.['en'];
  if (script) speak(script, lang);
}

/** Speak a triage result with patient name */
export function speakTriage(urgency: 'emergency' | 'urgent' | 'routine' | 'elective', lang: Lang, patientName?: string): void {
  const key = urgency === 'emergency' ? 'triage_emergency'
    : urgency === 'urgent' ? 'triage_urgent'
    : 'triage_routine';
  const base = VOICE_SCRIPTS[key]?.[lang] ?? VOICE_SCRIPTS[key]?.['en'] ?? '';
  const prefixed = patientName ? (lang === 'mr' ? `${patientName} साठी: ` : lang === 'hi' ? `${patientName} के लिए: ` : `For ${patientName}: `) + base : base;
  speak(prefixed, lang);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _speaking = false; _transcript = ''; notify();
}

export function getSpeakingState() { return { speaking: _speaking, transcript: _transcript }; }

export function onVoiceChange(fn: (transcript: string, speaking: boolean) => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function isSupported(): boolean { return 'speechSynthesis' in window; }

// Initialize
if (typeof window !== 'undefined') {
  loadVoices();
}

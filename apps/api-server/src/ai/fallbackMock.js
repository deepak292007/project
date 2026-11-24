/**
 * @file fallbackMock.js — Deterministic offline fallback for lnkling
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Returns a valid LnklingTriageResult using lightweight symptom rules
 * when the model is offline, times out, or returns invalid JSON.
 *
 * Contract: same schema as the real model response. UI never knows
 * which path fired — it always receives a well-formed object.
 *
 * Rules:
 *   pregnancy + (fever | high temp | pain)  → high urgency, Obs & Gynae
 *   chest pain | unconscious | seizure       → high urgency, Emergency
 *   fever | breathlessness | spo2 low        → moderate, General OPD / Chest
 *   everything else                          → low, General OPD
 */

const DISCLAIMER = 'AI support — confirm with health worker / doctor';

/**
 * Multilingual patient messages per urgency level.
 * @type {Record<string, Record<string, string>>}
 */
/**
 * Multilingual patient messages per urgency level.
 * @type {Record<string, Record<string, string>>}
 */
const PATIENT_MSG = {
  high: {
    en: 'Please go to the hospital right away. Ask someone to help you now.',
    hi: 'कृपया अभी अस्पताल जाएं। किसी से मदद मांगें।',
    mr: 'कृपया आत्ताच रुग्णालयात जा. कोणाची मदत घ्या.',
    te: 'దయచేసి వెంటనే ఆసుపత్రికి వెళ్లండి. ఎవరినైనా సహాయం అడగండి.',
    kn: 'ದಯವಿಟ್ಟು ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ. ಯಾರಾದರೂ ಸಹಾಯ ಕೇಳಿ.',
  },
  moderate: {
    en: 'Visit the PHC or health centre today. Tell the doctor your symptoms.',
    hi: 'आज PHC या स्वास्थ्य केंद्र जाएं। डॉक्टर को अपनी तकलीफ बताएं।',
    mr: 'आज PHC किंवा आरोग्य केंद्राला भेट द्या. डॉक्टरांना आपले त्रास सांगा.',
    te: 'ఈరోజు PHC లేదా ఆరోగ్య కేంద్రానికి వెళ్ళండి. డాక్టర్‌కి మీ లక్షణాలు చెప్పండి.',
    kn: 'ಇಂದೇ PHC ಅಥವಾ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ. ವೈದ್ಯರಿಗೆ ನಿಮ್ಮ ಸಮಸ್ಯೆ ತಿಳಿಸಿ.',
  },
  low: {
    en: 'You can visit the PHC at the next available time. Rest and drink water.',
    hi: 'आप अगली उपलब्ध समय पर PHC जा सकते हैं। आराम करें और पानी पिएं।',
    mr: 'पुढील वेळेत PHC ला जाऊ शकता. विश्रांती घ्या आणि पाणी प्या.',
    te: 'మీరు వీలైనప్పుడు PHC ని సందర్శించవచ్చు. విశ్రాంతి తీసుకోండి మరియు నీరు త్రాగండి.',
    kn: 'ಮುಂದಿನ ಅನುಕೂಲಕರ ಸಮಯದಲ್ಲಿ PHC ಗೆ ಭೇಟಿ ನೀಡಬಹುದು. ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ನೀರು ಕುಡಿಯಿರಿ.',
  },
};

/**
 * Multilingual ASHA checklists per urgency level.
 * @type {Record<string, Record<string, string>>}
 */
const ASHA_MSG = {
  high: {
    en: '• Call 108 immediately\n• Stay with patient\n• Note pulse and breathing\n• Inform PHC doctor now',
    hi: '• तुरंत 108 पर कॉल करें\n• मरीज़ के साथ रहें\n• नाड़ी और श्वास नोट करें\n• PHC डॉक्टर को अभी सूचित करें',
    mr: '• लगेच 108 वर कॉल करा\n• रुग्णाजवळ थांबा\n• नाडी व श्वास नोंदवा\n• PHC डॉक्टरांना आत्ताच कळवा',
    te: '• వెంటనే 108 కి కాల్ చేయండి\n• రోగి వద్దే ఉండండి\n• నాడి మరియు శ్వాసను గమనించండి\n• PHC డాక్టర్‌కి ఇప్పుడే సమాచారం ఇవ్వండి',
    kn: '• ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ\n• ರೋಗಿಯ ಜೊತೆಯೇ ಇರಿ\n• ನಾಡಿ ಮತ್ತು ಉಸಿರಾಟವನ್ನು ಗಮನಿಸಿ\n• PHC ವೈದ್ಯರಿಗೆ ತಕ್ಷಣ ಮಾಹಿತಿ ನೀಡಿ',
  },
  moderate: {
    en: '• Arrange transport to PHC today\n• Record vitals (BP, temp, pulse)\n• Check pregnancy status\n• Log visit in ASHA diary',
    hi: '• आज PHC जाने की व्यवस्था करें\n• वाइटल्स रिकॉर्ड करें (BP, तापमान, नाड़ी)\n• गर्भावस्था जांचें\n• ASHA डायरी में नोट करें',
    mr: '• आज PHC ला जाण्याची सोय करा\n• व्हायटल्स नोंदवा (BP, तापमान, नाडी)\n• गर्भावस्था तपासा\n• ASHA डायरीत नोंद करा',
    te: '• ఈరోజు PHC కి రవాణా ఏర్పాటు చేయండి\n• వైటల్స్ (BP, ఉష్ణోగ్రత, పల్స్) నమోదు చేయండి\n• గర్భధారణ స్థితిని తనిఖీ చేయండి\n• ఆశా డైరీలో నమోదు చేయండి',
    kn: '• ಇಂದೇ PHC ಗೆ ವಾಹನ ವ್ಯವಸ್ಥೆ ಮಾಡಿ\n• ವೈಟಲ್ಸ್ (BP, ಉಷ್ಣಾಂಶ, ನಾಡಿ) ದಾಖಲಿಸಿ\n• ಗರ್ಭಾವಸ್ಥೆ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ\n• ಆಶಾ ಡೈರಿಯಲ್ಲಿ ನಮೂದಿಸಿ',
  },
  low: {
    en: '• Schedule next PHC visit\n• Advise rest and fluids\n• Monitor for 48 hours\n• Revisit if worsens',
    hi: '• अगली PHC यात्रा निर्धारित करें\n• आराम और पानी की सलाह दें\n• 48 घंटे निगरानी रखें\n• बिगड़ने पर दोबारा जाएं',
    mr: '• पुढील PHC भेट ठरवा\n• विश्रांती व पाणी पिण्याचा सल्ला द्या\n• ४८ तास निरीक्षण करा\n• स्थिती बिघडल्यास पुन्हा भेट द्या',
    te: '• తదుపరి PHC సందర్శనను షెడ్యూల్ చేయండి\n• విశ్రాంతి మరియు ద్రవాలు తీసుకోవాలని సూచించండి\n• 48 గంటలు పర్యవేక్షించండి\n• తీవ్రమైతే మళ్లీ రండి',
    kn: '• ಮುಂದಿನ PHC ಭೇಟಿ ನಿಗದಿಪಡಿಸಿ\n• ವಿಶ್ರಾಂತಿ ಮತ್ತು ದ್ರವಾಹಾರ ಸೇವಿಸಲು ಸಲಹೆ ನೀಡಿ\n• 48 ಗಂಟೆಗಳ ಕಾಲ ಗಮನಿಸಿ\n• ಸಮಸ್ಯೆ ಹೆಚ್ಚಾದರೆ ಮರುಭೇಟಿ ನೀಡಿ',
  },
};

/**
 * Match keywords in a lower-cased combined string.
 * @param {string} text
 * @param {string[]} keywords
 * @returns {boolean}
 */
function hasKeyword(text, keywords) {
  return keywords.some(k => text.includes(k));
}

/**
 * Deterministic triage fallback — same schema as real lnkling response.
 *
 * @param {import('./types.js').LnklingInput} input
 * @returns {import('./types.js').LnklingTriageResult}
 */
export function fallbackMock(input) {
  const lang = ['en', 'hi', 'mr', 'te', 'kn'].includes(input.language) ? input.language : 'en';
  const text = [input.chiefComplaint || '', input.notes || ''].join(' ').toLowerCase();
  const temp = Number(input.temperature) || 0;
  const pregnant = Boolean(input.pregnant);

  // ─── Rule 1: Pregnancy escalation ────────────────────────────────
  if (pregnant && hasKeyword(text, [
      'fever', 'pain', 'bleeding', 'swelling', 'headache', 'dizzy',
      'बुखार', 'दर्द', 'रक्तस्राव', 'सूजन', 'ताप', 'दुखणे', 'सूज', 'रक्तस्त्राव',
      'జ్వరం', 'నొప్పి', 'రక్తస్రావం', 'వాపు', 'తలనొప్పి', 'గర్భవతి',
      'ಜ್ವರ', 'ನೋವು', 'ರಕ್ತಸ್ರಾವ', 'ಊತ', 'ತಲೆನೋವು', 'ಗರ್ಭಿಣಿ'
    ]) || (pregnant && temp >= 38)) {
    return {
      urgency: 'high',
      opDepartment: 'Obstetrics & Gynaecology',
      priority: 'emergency',
      specialty: 'Obstetrics & Gynaecology',
      reasons: ['Pregnancy with fever, elevated BP or pain requires immediate evaluation', 'Risk of pre-eclampsia or maternal infection'],
      suggestedDiagnostics: ['BP measurement', 'Urine protein dipstick', 'Fetal Doppler', 'CBC test'],
      patientMessage: PATIENT_MSG.high[lang] || PATIENT_MSG.high.en,
      ashaMessage: ASHA_MSG.high[lang] || ASHA_MSG.high.en,
      language: lang,
      model: 'lnkling',
      disclaimer: DISCLAIMER,
      offline: true,
    };
  }

  // ─── Rule 2: Emergency red-flag symptoms ─────────────────────────
  if (hasKeyword(text, [
      'chest pain', 'unconscious', 'seizure', 'convulsion', 'paralysis', 'severe bleeding',
      'छातीत दुखणे', 'सीने में दर्द', 'बेहोश', 'अपस्मार', 'बेशुद्ध', 'आकडी',
      'గుండె నొప్పి', 'ఛాతీ నొప్పి', 'స్పృహ తప్పడం', 'ఫిట్స్', 'పక్షవాతం',
      'ಎದೆ ನೋವು', 'ಪ್ರಜ್ಞಾಹೀನತೆ', 'ಫಿಟ್ಸ್', 'ಪಾರ್ಶ್ವವಾಯು'
    ])) {
    return {
      urgency: 'high',
      opDepartment: 'Emergency',
      priority: 'emergency',
      specialty: 'Emergency Medicine',
      reasons: ['Emergency red-flag symptom reported', 'Requires immediate hospital stabilization and ICU bed'],
      suggestedDiagnostics: ['12-lead ECG', 'Blood glucose', 'Continuous vitals monitoring', 'Cardiac enzymes'],
      patientMessage: PATIENT_MSG.high[lang] || PATIENT_MSG.high.en,
      ashaMessage: ASHA_MSG.high[lang] || ASHA_MSG.high.en,
      language: lang,
      model: 'lnkling',
      disclaimer: DISCLAIMER,
      offline: true,
    };
  }

  // ─── Rule 3: Moderate — fever / respiratory / spo2 ───────────────
  if (hasKeyword(text, [
      'fever', 'breathless', 'cough', 'difficulty breathing', 'malaria', 'dengue',
      'ताप', 'बुखार', 'खोकला', 'श्वास', 'सांस',
      'జ్వరం', 'దగ్గు', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'మలేరియా', 'డెంగ్యూ',
      'ಜ್ವರ', 'ಕೆಮ್ಮು', 'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಮಲೇರಿಯಾ', 'ಡೆಂಗ್ಯೂ'
    ]) || temp >= 38) {
    return {
      urgency: 'moderate',
      opDepartment: 'General OPD & Diagnostic Lab',
      priority: 'priority',
      specialty: 'General Medicine',
      reasons: ['Fever or respiratory symptoms present', 'Lab tests recommended to rule out endemic infections'],
      suggestedDiagnostics: ['Malaria rapid test', 'Dengue NS1 antigen', 'CBC analyzer', 'Temperature monitoring'],
      patientMessage: PATIENT_MSG.moderate[lang] || PATIENT_MSG.moderate.en,
      ashaMessage: ASHA_MSG.moderate[lang] || ASHA_MSG.moderate.en,
      language: lang,
      model: 'lnkling',
      disclaimer: DISCLAIMER,
      offline: true,
    };
  }

  // ─── Rule 4: Low — routine / default ─────────────────────────────
  return {
    urgency: 'low',
    opDepartment: 'General OPD',
    priority: 'normal',
    specialty: 'General Medicine',
    reasons: ['Symptoms appear routine', 'PHC visit recommended'],
    suggestedDiagnostics: ['BP check', 'Blood glucose'],
    patientMessage: PATIENT_MSG.low[lang] || PATIENT_MSG.low.en,
    ashaMessage: ASHA_MSG.low[lang] || ASHA_MSG.low.en,
    language: lang,
    model: 'lnkling',
    disclaimer: DISCLAIMER,
    offline: true,
  };
}

/**
 * @file fallbackMock.js — Deterministic offline fallback for lnkling
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Returns a valid LnklingTriageResult using consolidated clinical rules.
 * Enforces:
 *   - Consistent urgency levels: 'emergency', 'urgent', 'routine', 'home_care'
 *   - Negation filtering
 *   - Cough alone does not trigger emergency
 *   - Safety floor protection
 *   - Explicit non-diagnostic disclaimer
 */

import { buildClinicalDecision } from '../services/clinicalDecisionSupport.js';

const DISCLAIMER = 'Clinical Decision Support: Algorithmic assessment for healthcare workers. Strictly non-diagnostic; all clinical actions require clinician confirmation.';

const PATIENT_MSG = {
  emergency: {
    en: 'Please go to the hospital emergency bay immediately. 108 ambulance transit recommended.',
    hi: 'कृपया तुरंत अस्पताल के आपातकालीन कक्ष में जाएं। 108 एम्बुलेंस की सहायता लें।',
    mr: 'कृपया तातडीने रुग्णालयातील आणीबाणी कक्षात जा. १०८ रुग्णवाहिकेची मदत घ्या.',
    te: 'దయచేసి వెంటనే ఆసుపత్రి ఎమర్జెన్సీ విభాగానికి వెళ్లండి. 108 అంబులెన్స్ సహాయం తీసుకోండి.',
    kn: 'ದಯವಿಟ್ಟು ತಕ್ಷಣ ಆಸ್ಪತ್ರೆಯ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ. 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಹಾಯ ಪಡೆಯಿರಿ.',
  },
  urgent: {
    en: 'Visit the PHC or Community Health Centre today. A medical officer should evaluate you promptly.',
    hi: 'आज ही PHC या सामुदायिक स्वास्थ्य केंद्र जाएं। चिकित्सा अधिकारी से शीघ्र जांच कराएं।',
    mr: 'आजच प्राथमिक आरोग्य केंद्र किंवा ग्रामीण रुग्णालयाला भेट द्या. वैद्यकीय अधिकाऱ्यांकडून त्वरित तपासणी करून घ्या.',
    te: 'ఈరోజే PHC లేదా ఆరోగ్య కేంద్రానికి వెళ్లండి. వైద్యుడిని సంప్రదించండి.',
    kn: 'ಇಂದೇ PHC ಅಥವಾ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ. ವೈದ್ಯರಿಂದ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.',
  },
  routine: {
    en: 'You can visit the PHC at the next outpatient clinic hours. Rest and maintain hydration.',
    hi: 'आप अगले ओपीडी समय में PHC जा सकते हैं। आराम करें और पर्याप्त पानी पिएं।',
    mr: 'पुढील ओपीडी वेळेत प्राथमिक आरोग्य केंद्राला भेट देऊ शकता. विश्रांती घ्या आणि भरपूर पाणी प्या.',
    te: 'మీరు తదుపరి OPD సమయంలో PHC ని సందర్శించవచ్చు. విశ్రాంతి తీసుకోండి మరియు నీరు త్రాగండి.',
    kn: 'ಮುಂದಿನ OPD ಸಮಯದಲ್ಲಿ ನೀವು PHC ಗೆ ಭೇಟಿ ನೀಡಬಹುದು. ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ನೀರು ಕುಡಿಯಿರಿ.',
  },
  home_care: {
    en: 'Self-limiting symptoms observed. Follow home care advice, rest, and follow up if symptoms worsen.',
    hi: 'सामान्य लक्षण हैं। घरेलू देखभाल के उपायों का पालन करें और लक्षण बढ़ने पर जांच कराएं।',
    mr: 'सामान्य व सौम्य लक्षणे आहेत. घरगुती काळजी घ्या आणि त्रास वाढल्यास आरोग्य केंद्रात या.',
    te: 'సాధారణ లక్షణాలు మాత్రమే ఉన్నాయి. ఇంటి వద్ద విశ్రాంతి తీసుకోండి, ఇబ్బంది పెరిగితే సంప్రదించండి.',
    kn: 'ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳು. ಮನೆಯಲ್ಲೇ ಕಾಳಜಿ ವಹಿಸಿ, ಸಮಸ್ಯೆ ಉಲ್ಬಣಿಸಿದರೆ ಸಂಪರ್ಕಿಸಿ.',
  }
};

const ASHA_MSG = {
  emergency: {
    en: '• Call 108 immediately\n• Stay with patient and monitor vitals\n• Green channel transfer to District Hospital\n• Inform PHC Medical Officer',
    hi: '• तुरंत 108 पर कॉल करें\n• मरीज के साथ रहें और वाइटल चेक करें\n• जिला अस्पताल के लिए ग्रीन चैनल रेफरल\n• PHC डॉक्टर को सूचित करें',
    mr: '• लगेच १०८ रुग्णवाहिका बोलवा\n• रुग्णासोबत रहा व नाडी/श्वास तपासा\n• जिल्हा रुग्णालयात तातडीने हलवा\n• वैद्यकीय अधिकाऱ्यांना कळवा',
    te: '• వెంటనే 108 కి కాల్ చేయండి\n• రోగి వద్ద ఉండి వైటల్స్ గమనించండి\n• జిల్లా ఆసుపత్రికి తక్షణ బదిలీ\n• వైద్యాధికారికి తెలియజేయండి',
    kn: '• ತಕ್ಷಣ 108 ಕರೆ ಮಾಡಿ\n• ರೋಗಿಯ ಜೊತೆಗಿದ್ದು ವೈಟಲ್ಸ್ ಗಮನಿಸಿ\n• ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗೆ ತುರ್ತು ವರ್ಗಾವಣೆ\n• ವೈದ್ಯಾಧಿಕಾರಿಗೆ ಮಾಹಿತಿ ನೀಡಿ',
  },
  urgent: {
    en: '• Escort to PHC for same-day evaluation\n• Check BP, temperature and SpO2\n• Ensure maternal danger sign protocol if pregnant',
    hi: '• आज ही जांच के लिए PHC ले जाएं\n• बीपी, तापमान और SpO2 चेक करें\n• गर्भवती होने पर खतरे के संकेतों पर नजर रखें',
    mr: '• आजच तपासणीसाठी प्राथमिक आरोग्य केंद्रात आणा\n• रक्तदाब, तापमान आणि SpO2 तपासा\n• गरोदर माता असल्यास धोक्याच्या लक्षणांवर लक्ष ठेवा',
    te: '• ఈరోజే PHC కి తీసుకువెళ్లండి\n• BP, జ్వరం మరియు SpO2 పరీక్షించండి\n• గర్భిణీ అయితే అప్రమత్తంగా ఉండండి',
    kn: '• ಇಂದೇ PHC ಗೆ ಕರೆದೊಯ್ಯಿರಿ\n• BP, ತಾಪಮಾನ ಮತ್ತು SpO2 ಪರಿಶೀಲಿಸಿ\n• ಗರ್ಭಿಣಿಯಾಗಿದ್ದರೆ ಎಚ್ಚರಿಕೆ ವಹಿಸಿ',
  },
  routine: {
    en: '• Schedule routine OPD visit\n• Follow-up within 48-72 hours if no improvement\n• Counsel on hydration and hygiene',
    hi: '• नियमित ओपीडी का समय निर्धारित करें\n• सुधार न होने पर 48-72 घंटे में फॉलो-अप\n• स्वच्छता और खानपान की सलाह दें',
    mr: '• नियमित ओपीडी भेट नोंदवा\n• गुण न आल्यास ४८-७२ तासांत पाठपुरावा करा\n• आहाराबाबत मार्गदर्शन करा',
    te: '• సాధారణ OPD సందర్శన నిర్ణయించండి\n• ఉపశమనం లేకపోతే 48-72 గంటల్లో ఫాలో-అప్ చేయండి',
    kn: '• ವಾಡಿಕೆಯ OPD ಭೇಟಿ ನಿಗದಿಪಡಿಸಿ\n• ಸುಧಾರಣೆ ಇಲ್ಲದಿದ್ದರೆ 48-72 ಗಂಟೆಗಳಲ್ಲಿ ಫಾಲೋ-ಅಪ್ ಮಾಡಿ',
  },
  home_care: {
    en: '• Educate on home hydration and rest\n• Alert family to red flags (high fever, breathlessness)\n• Routine community visit check next week',
    hi: '• पर्याप्त पानी पीने और आराम की सलाह दें\n• खतरे के संकेतों के प्रति सचेत करें\n• अगले सप्ताह रूटीन फॉलो-अप',
    mr: '• घरगुती विश्रांती व द्रव पदार्थांचा सल्ला द्या\n• धोक्याची लक्षणे आढळल्यास लगेच केंद्रात येण्यास सांगा\n• पुढील आठवड्यात आढावा घ्या',
    te: '• విశ్రాంతి మరియు ఆహార జాగ్రత్తలు తెలపండి\n• లక్షణాలు ఎక్కువైతే వెంటనే రమ్మని చెప్పండి',
    kn: '• ಮನೆಯಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ತಿಳಿಸಿ\n• ತುರ್ತು ಲಕ್ಷಣಗಳಿದ್ದರೆ ತಕ್ಷಣ ತಿಳಿಸಲು ಸೂಚಿಸಿ',
  }
};

/**
 * Deterministic triage fallback — conforms to unified urgency schema.
 */
export function fallbackMock(input) {
  const lang = ['en', 'hi', 'mr', 'te', 'kn'].includes(input.language) ? input.language : 'en';
  const chiefComplaint = input.chiefComplaint || '';
  const notes = input.notes || '';
  const symptoms = chiefComplaint.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  const vitals = {
    temp: input.temperature || (notes.match(/temp[:\s]+([\d.]+)/i)?.[1]),
    spo2: notes.match(/spo2[:\s]+([\d.]+)/i)?.[1],
    bp: notes.match(/bp[:\s]+([\d/]+)/i)?.[1]
  };

  const patient = {
    age: input.age,
    isPregnant: Boolean(input.pregnant)
  };

  const decision = buildClinicalDecision({
    symptoms,
    symptomNarrative: notes,
    vitals,
    patient
  });

  const urgency = decision.urgency; // 'emergency' | 'urgent' | 'routine' | 'home_care'
  const priority = urgency === 'emergency' ? 'emergency' : urgency === 'urgent' ? 'priority' : 'normal';

  return {
    urgency,
    opDepartment: decision.department,
    priority,
    specialty: decision.department,
    reasons: decision.redFlags.length ? decision.redFlags : [decision.summary],
    suggestedDiagnostics: decision.recommendations.map(r => r.name),
    patientMessage: PATIENT_MSG[urgency]?.[lang] || PATIENT_MSG[urgency]?.en || PATIENT_MSG.routine.en,
    ashaMessage: ASHA_MSG[urgency]?.[lang] || ASHA_MSG[urgency]?.en || ASHA_MSG.routine.en,
    language: lang,
    model: 'lnkling',
    disclaimer: DISCLAIMER,
    offline: true,
    safetyFloorTriggered: decision.safetyFloorTriggered
  };
}

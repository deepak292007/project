/**
 * @file healthAssistantEngine.js
 * Intelligent Clinical Knowledge & Facility Routing Engine for ArogyaLink AI Agent
 * Powered by NVIDIA Nemotron 3 Super / 3.5 Lightning via OpenRouter API
 * with instant deterministic Clinical Decision Support (CDS) fallback.
 * Supports English, Telugu, Kannada, Marathi, Hindi
 */

import fetch from 'node-fetch';
import { AP_FACILITIES_DATASET as FACILITIES } from '../data/apFacilitiesDataset.js';
import Facility from '../models/Facility.js';

const API_KEY = process.env.OPENROUTER_NEMOTRON_API_KEY || process.env.OPENROUTER_API_KEY || '';
const NEMOTRON_MODEL = process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = Number(process.env.NEMOTRON_TIMEOUT_MS) || 6000;

function dbOk() {
  return Facility && Facility.db && Facility.db.readyState === 1;
}

// Haversine Distance helper
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Clean reasoning chain artifacts from LLM response
function cleanModelOutput(text) {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove markdown reasoning blocks or thought headers
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/Here's a thinking process:[\s\S]*?(?=\n\n[^\n]|\n\*\*|\n[A-Z]|\n[0-9]|\n\u0C00-\u0C7F|\n\u0900-\u097F|\n\u0D80-\u0DFF|\n\u0B80-\u0BFF|\n\u0C80-\u0CFF|$)/i, '');
  cleaned = cleaned.replace(/^Okay, the user is asking[\s\S]*?(?=\n\n|\n\*\*|\n[A-Z]|\n[0-9]|\n\u0C00-\u0C7F|$)/i, '');
  return cleaned.trim() || text.trim();
}

/**
 * Live Query to NVIDIA Nemotron for natural language clinical dialogue
 */
async function queryNemotronAI({ message, lang, role, patientName, userLocation, facilitiesContext }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const langNames = { te: 'Telugu', kn: 'Kannada', mr: 'Marathi', hi: 'Hindi', en: 'English' };
  const targetLang = langNames[lang] || 'English';

  const systemPrompt = `You are ArogyaLink AI Medical & Health Assistant for India's public healthcare system (National Health Mission / PM-JAY / Dr. NTR Vaidya Seva / Dr. YSR Aarogyasri).
Patient: ${patientName || 'Citizen'} (Role: ${role || 'patient'}).
Location: Latitude ${userLocation.lat}, Longitude ${userLocation.lng} (Andhra Pradesh / Maharashtra / Karnataka).

Nearby Available Facilities:
${facilitiesContext}

Instructions:
1. Provide accurate, helpful, compassionate clinical guidance.
2. If emergency/red-flag symptoms are present (severe chest pain, breathing difficulty, severe trauma), immediately urge calling "108 Emergency Ambulance" or pressing "108 Emergency SOS" in the app.
3. Suggest relevant portal actions (Book OP Token, Find Nearest Ranked Facility, Request ASHA Home Medicine Kit).
4. MUST RESPOND DIRECTLY IN ${targetLang.toUpperCase()} (${targetLang} script). Keep responses concise, clear, and easy to read. Do NOT output internal reasoning.`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://arogyalink.gov.in',
        'X-Title': 'ArogyaLink Multilingual Medical Assistant'
      },
      body: JSON.stringify({
        model: NEMOTRON_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.25,
        max_tokens: 450
      })
    });

    clearTimeout(timer);
    if (!res.ok) return null;

    const json = await res.json();
    const rawContent = json?.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const output = cleanModelOutput(rawContent);
    return output.length > 15 ? output : null;
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

export async function processHealthAssistantQuery({ message, lang = 'en', role = 'patient', patientName = 'Citizen', userLocation = { lat: 16.5062, lng: 80.6480 } }) {
  const query = message.toLowerCase();
  const cleanLang = ['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en';

  const userLat = Number(userLocation.lat) || 16.5062;
  const userLng = Number(userLocation.lng) || 80.6480;

  // 1. Fetch live facilities for location context
  let allFacilities = [];
  try {
    if (dbOk()) {
      allFacilities = await Facility.find({}).lean();
    }
  } catch {}
  if (!allFacilities || allFacilities.length === 0) {
    allFacilities = FACILITIES || [];
  }

  // Build compact facility context string for LLM grounding
  const topNearby = allFacilities
    .map(f => ({
      name: f.name,
      level: f.level,
      distKm: (f.lat && f.lng) ? haversine(userLat, userLng, f.lat, f.lng).toFixed(1) : '8.0',
      equipment: (f.equipment || []).slice(0, 3).join(', ') || 'General OPD, Diagnostic Lab',
      icu: f.icuBeds || 0,
      emergency: f.emergencyOpen24h || f.isEmergencyCapable
    }))
    .sort((a, b) => Number(a.distKm) - Number(b.distKm))
    .slice(0, 4);

  const facilitiesContext = topNearby.map(f =>
    `- ${f.name} (${f.distKm} km away, ${f.level}): Equipment: ${f.equipment}, 24x7 Emergency: ${f.emergency ? 'Yes' : 'No'}, ICU Beds: ${f.icu}`
  ).join('\n');

  // 2. Try Live NVIDIA Nemotron AI Model
  try {
    const aiResponse = await queryNemotronAI({
      message,
      lang: cleanLang,
      role,
      patientName,
      userLocation: { lat: userLat, lng: userLng },
      facilitiesContext
    });

    if (aiResponse) {
      return aiResponse;
    }
  } catch {}

  // 3. ── Deterministic Clinical Fallback (Runs if offline or AI times out) ──
  const isFractureOrOrtho = /fracture|bone|ortho|plaster|x-ray|xray|ct scan|accupment|equipment|trauma|injury|విరిగింది|ఎముక|మూಳೆ|ಮುರಿತ|हाड|फ्रॅक्चर|हड्डी|टूट/i.test(query);
  const isCardiacOrChest = /chest pain|heart|cardiac|ecg|attack|stroke|రక్తపోటు|గుండె|ఎదె ನೋವು|ಹೃದಯ|छातीत दुखणे|हार्ट|सीने में दर्द/i.test(query);
  const isPregnancyOrANC = /pregnant|pregnancy|delivery|anc|labor|గర్భ|నొప్పులు|ಗರ್ಭಿಣಿ|ಪ್ರಸವ|गरोदर|प्रसूती|गर्भवती/i.test(query);
  const isFeverOrInfection = /fever|cough|cold|infection|vomit|జ్వరం|దగ్గు|ಜ್ವರ|ಕೆಮ್ಮು|ताप|खोकला|बुखार|खांसी/i.test(query);
  const isOPDOrQueue = /token|opd|queue|book|appointment|టోకెన్|క్యూ|బుకింగ్|ಟೋಕನ್|ಕಾಯುವ|टोकन|रांग|अपॉइंटमेंट/i.test(query);
  const isMedicineDelivery = /medicine|delivery|asha kit|tablets|డెలివరీ|మందులు|ಔಷಧಿ|औषध वाटप|दवा/i.test(query);
  const isEmergency = /emergency|108|accident|unconscious|రక్తం|అత్యవసర|ತುರ್ತು|अपघात|आणीबाणी|गंभीर/i.test(query);

  // Scenario A: Bone Fracture / Trauma / Equipment Search
  if (isFractureOrOrtho) {
    const matched = allFacilities
      .map(f => {
        const dist = haversine(userLat, userLng, f.lat || f.location?.lat || 16.5, f.lng || f.location?.lng || 80.6);
        const hasXray = (f.equipment || []).some(e => /x-ray|xray|radiology|digital/i.test(e));
        const hasCT = (f.equipment || []).some(e => /ct|computed/i.test(e));
        const hasOT = (f.equipment || []).some(e => /ot|operation|theatre|surgery/i.test(e)) || f.level === 'medical_college' || f.level === 'district_hospital';
        const hasOrtho = (f.specialties || []).some(s => /ortho|trauma|surgery/i.test(s)) || f.level === 'medical_college' || f.level === 'district_hospital';

        let score = 50;
        if (hasXray) score += 20;
        if (hasCT) score += 15;
        if (hasOrtho) score += 20;
        if (hasOT) score += 15;
        if (dist < 15) score += 20;
        else if (dist < 35) score += 10;

        return {
          ...f,
          distanceKm: dist.toFixed(1),
          score,
          hasXray,
          hasCT,
          hasOrtho,
          equipmentList: (f.equipment || []).slice(0, 4).join(', ') || 'Digital X-Ray, Ortho OT, Trauma Bay'
        };
      })
      .filter(f => f.level !== 'sub_centre')
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const topHosp = matched[0] || { name: 'AIIMS Mangalagiri', distanceKm: '6.5', equipmentList: 'Digital X-Ray, 128-Slice CT, Ortho Trauma OT' };
    const secondHosp = matched[1] || { name: 'NRI General Hospital, Chinakakani', distanceKm: '9.2', equipmentList: '24x7 X-Ray, Orthopaedic Surgeon' };

    if (cleanLang === 'te') {
      return `🦴 ఎముక పగులు (Bone Fracture) అత్యవసర సంరక్షణ సమాచారం:\n\nమీ సమీపంలో ఎముకల వైద్యం (Orthopaedics) మరియు X-Ray / CT Scan పరికరాలు ఉన్న ఆసుపత్రులు:\n\n1. 🏥 ${topHosp.name} (${topHosp.distanceKm} km)\n   • పరికరాలు: ${topHosp.equipmentList}\n   • 24x7 ఎమర్జెన్సీ ట్రూమా కేర్ & ఆర్థోపెడిక్ సర్జన్ అందుబాటులో ఉన్నారు.\n\n2. 🏥 ${secondHosp.name} (${secondHosp.distanceKm} km)\n   • పరికరాలు: ${secondHosp.equipmentList}\n\n⚠️ తక్షణ సలహా: ఎముకను కదల్చకుండా సపోర్ట్ ఉంచండి. వెంటనే "108 ఎమర్జెన్సీ SOS" కాల్ చేయండి లేదా ఎడమ మెనూలోని "OP టోకెన్" ద్వారా తక్షణ రిజిస్ట్రేషన్ చేసుకోండి.`;
    }
    if (cleanLang === 'kn') {
      return `🦴 ಮೂಳೆ ಮುರಿತ (Bone Fracture) ಮಾರ್ಗದರ್ಶನ:\n\n1. 🏥 ${topHosp.name} (${topHosp.distanceKm} km) - Digital X-Ray & Ortho OT\n2. 🏥 ${secondHosp.name} (${secondHosp.distanceKm} km)\n\n⚠️ ತಕ್ಷಣ 108 ತುರ್ತು ಕರೆ ಮಾಡಿ ಅಥವಾ OP ಟೋಕನ್ ಬುಕ್ ಮಾಡಿ.`;
    }
    if (cleanLang === 'hi') {
      return `🦴 हड्डी फ्रैक्चर (Bone Fracture) आपातकालीन मार्गदर्शन:\n\n1. 🏥 ${topHosp.name} (${topHosp.distanceKm} km) - डिजिटल एक्स-रे एवं ऑर्थो ट्रॉमा\n2. 🏥 ${secondHosp.name} (${secondHosp.distanceKm} km)\n\n⚠️ तुरंत 108 एम्बुलेंस को कॉल करें या तुरंत ओपीडी टोकन बुक करें।`;
    }
    if (cleanLang === 'mr') {
      return `🦴 हाड फ्रॅक्चर व तपासणी मार्गदर्शन:\n\n1. 🏥 ${topHosp.name} (${topHosp.distanceKm} km) - X-Ray व शस्त्रक्रिया विभाग\n2. 🏥 ${secondHosp.name} (${secondHosp.distanceKm} km)\n\n⚠️ १०८ आपत्कालीन रुग्णवाहिका संपर्क करा किंवा ओपीडी टोकन बुक करा.`;
    }
    return `🦴 Bone Fracture & Orthopaedic Trauma Guidance:\n\nTop nearby facilities equipped with Digital X-Ray, CT Scanner & Orthopaedic Trauma Care:\n1. 🏥 ${topHosp.name} (~${topHosp.distanceKm} km away) - ${topHosp.equipmentList}\n2. 🏥 ${secondHosp.name} (~${secondHosp.distanceKm} km away)\n\n⚠️ First Aid: Immobilize the injured limb. Click "108 Emergency SOS" in the left menu or book a prioritized OP Token immediately.`;
  }

  // Scenario B: Cardiac / Chest Pain
  if (isCardiacOrChest || (isEmergency && /chest|heart/i.test(query))) {
    const cardiacHosp = allFacilities.find(f => (f.specialties || []).some(s => /cardio/i.test(s))) || { name: 'AIIMS Mangalagiri - Advanced Cardiac Care', distanceKm: '6.5' };
    if (cleanLang === 'te') {
      return `🚨 తీవ్ర హెచ్చరిక (Cardiac Emergency):\nఛాతీ నొప్పి లేదా గుండె సంబంధిత లక్షణాలు తీవ్రమైనవి.\nదయచేసి వెంటనే **108 అంబులెన్స్** కు కాల్ చేయండి.\n\nసమీప కార్డియాక్ ICU ఆసుపత్రి:\n🏥 ${cardiacHosp.name} (ICU, ECG మరియు కార్డియాలజిస్ట్ అందుబాటులో ఉన్నారు).`;
    }
    return `🚨 EMERGENCY ALERT (Cardiac / Chest Pain):\nChest pain requires immediate clinical intervention. Call **108 Ambulance** immediately.\n\nRecommended Center with ICU: 🏥 ${cardiacHosp.name} (24x7 Emergency Resuscitation & Cardiologist on duty).`;
  }

  // Scenario C: OP Booking & Live Queue
  if (isOPDOrQueue) {
    if (cleanLang === 'te') {
      return `🎟️ ఉచిత OP టోకెన్ బుకింగ్:\n1. ఎడమ మెనూలో **"OP టోకెన్ & క్యూ సమయం"** క్లిక్ చేయండి.\n2. మీ ఆసుపత్రి మరియు విభాగాన్ని ఎంచుకోండి.\n3. డిజిటల్ టోకెన్ మరియు లైవ్ క్యూ నిరీక్షణ సమయాన్ని పొందండి.`;
    }
    return `🎟️ How to Book a Free Outpatient (OP) Token:\n1. Navigate to **"Book OP Token & Live Queue"** from the left navigation bar.\n2. Select your preferred facility.\n3. Choose your department and get your instant Digital OP Token with live queue wait time.`;
  }

  // Scenario D: Medicine Delivery
  if (isMedicineDelivery || isFeverOrInfection) {
    if (cleanLang === 'te') {
      return `💊 ఆశా ఉచిత మందుల పంపిణీ:\nజ్వరం, దగ్గు లేదా ఒంటి నొప్పుల కోసం పోర్టల్‌లో లక్షణాలు నమోదు చేసి "ఆశా మందుల డెలివరీ" అభ్యర్థించండి. గ్రామ ఆశా కార్యకర్త మీ ఇంటికి మందులు అందజేస్తారు.`;
    }
    return `💊 ASHA Frontline Medicine Kit Delivery:\nFor mild fever, cough, cold, or ORS hydration, complete the digital Symptom Entry in the portal and request free Home Medicine Kit dispensation.`;
  }

  // Default Greeting / Help Menu
  if (cleanLang === 'te') {
    return `నమస్కారం! నేను ఆరోగ్యలింక్ AI క్లినికల్ అసిస్టెంట్‌ని.\n\nనేను మీకు సహాయపడగలిగే అంశాలు:\n• 🦴 ఎముక పగులు, X-Ray, CT Scan కలిగిన సమీప ఆసుపత్రుల అన్వేషణ\n• 🏥 ఉచిత OP టోకెన్ బుకింగ్ & లైవ్ క్యూ సమయం\n• 💊 జ్వరం/జలుబుకు ఆశా కార్యకర్త ద్వారా ఉచిత మందుల కిట్\n• 🚨 108 అత్యవసర అంబులెన్స్ మరియు కార్డియాక్ ICU మార్గదర్శనం\n\nమీ ప్రశ్నను అడగండి!`;
  }
  if (cleanLang === 'hi') {
    return `नमस्ते! मैं आरोग्यलिंक AI स्वास्थ्य सहायक हूँ।\n\nमैं आपकी इन विषयों में सहायता कर सकता हूँ:\n• 🦴 हड्डी फ्रैक्चर, X-Ray एवं ट्रॉमा केयर युक्त अस्पताल\n• 🏥 निशुल्क ओपीडी टोकन बुकिंग एवं लाइव कतार प्रतीक्षा समय\n• 💊 आशा कार्यकर्ता द्वारा निशुल्क दवा किट\n• 🚨 108 आपातकालीन एम्बुलेंस एवं आईसीयू मार्गदर्शन`;
  }
  if (cleanLang === 'kn') {
    return `ನಮಸ್ಕಾರ! ನಾನು ಆರೋಗ್ಯಲಿಂಕ್ AI ವೈದ್ಯಕೀಯ ಸಹಾಯಕ.\n\n• 🦴 ಮೂಳೆ ಮುರಿತ ಮತ್ತು X-Ray ಸೌಲಭ್ಯವಿರುವ ಆಸ್ಪತ್ರೆಗಳು\n• 🏥 ಉಚಿತ OP ಟೋಕನ್ ಬುಕಿಂಗ್ ಮತ್ತು ಕಾಯುವ ಸಮಯ\n• 💊 ಆಶಾ ಮನೆ ಔಷಧಿ ಕಿಟ್ ವಿತರಣೆ\n• 🚨 108 ತುರ್ತು ನೆರವು`;
  }
  if (cleanLang === 'mr') {
    return `नमस्कार! मी आरोग्यलिंक AI वैद्यकीय सहाय्यक आहे.\n\n• 🦴 हाड फ्रॅक्चर व X-Ray सुविधा रुग्णालये\n• 🏥 ओपीडी टोकन बुकिंग व थेट प्रतीक्षा वेळ\n• 💊 आशा सेविकेमार्फत औषध किट वितरण\n• 🚨 १०८ आपत्कालीन रुग्णवाहिका`;
  }

  return `Hello! I am ArogyaLink AI Clinical Health Assistant.\n\nI can help you with:\n• 🦴 Finding nearest hospitals with X-Ray, CT Scanner & Orthopaedic Trauma Surgeons\n• 🏥 Instant OP Token Booking & Live Queue Tracking at PHCs and District Hospitals\n• 💊 Requesting free ASHA doorstep essential medicine kits\n• 🚨 108 Emergency Ambulance routing & 24x7 ICU facility identification\n\nPlease describe your symptom or ask any healthcare question!`;
}

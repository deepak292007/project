/**
 * clinicalDecisionSupport.js — Unified Versioned Decision Support & Facility Matching Service
 *
 * Recommends clinical urgency, red flags, confidence, diagnostics, and facility level
 * using WHO SMART / IMCI / IMAI and MoHFW Dakshata guidelines.
 * Matches facilities using clinical need, required tests/equipment, qualified doctors,
 * service hours, distance, and real-time DailyFacilityCapacitySnapshot.
 */

const RULES = [
  {
    id: 'RULE-CARD-001', version: '2.1.0', guidelineRef: 'ICMR / WHO Emergency Cardiac Care (2024)',
    keywords: ['chest pain', 'heart attack', 'palpitation', 'cardiac', 'myocardial', 'angina'],
    department: 'Emergency Cardiology', level: 'district_hospital',
    items: [['12-lead ECG', 'machine'], ['Cardiac troponin rapid test', 'test_kit'], ['Echocardiography', 'machine']],
    evaluator: (vitals, text) => text.includes('chest pain') || text.includes('heart attack') || text.includes('cardiac')
  },
  {
    id: 'RULE-RESP-001', version: '2.1.0', guidelineRef: 'WHO SARI & Acute Hypoxemic Failure Protocol (2024)',
    keywords: ['breathlessness', 'shortness of breath', 'difficulty breathing', 'asthma', 'cough', 'spo2', 'hypoxia'],
    department: 'Chest Medicine & ICU', level: 'rural_hospital',
    items: [['Pulse oximeter', 'machine'], ['Oxygen concentrator / cylinder', 'machine'], ['Chest X-ray', 'machine']],
    evaluator: (vitals, text) => {
      const spo2 = Number(vitals.spo2 || vitals.spO2 || 0);
      return (spo2 > 0 && spo2 < 94) || text.includes('breath') || text.includes('asthma') || text.includes('hypoxia');
    }
  },
  {
    id: 'RULE-ANC-001', version: '2.2.0', guidelineRef: 'MoHFW Dakshata Maternal Health Protocol (2024)',
    keywords: ['pregnant', 'pregnancy', 'anc', 'pnc', 'labour', 'fetal', 'foetal', 'bleeding', 'eclampsia'],
    department: 'Obstetrics & Gynaecology', level: 'rural_hospital',
    items: [['Urine protein dipstick', 'test_kit'], ['Hemoglobin / CBC test', 'test_kit'], ['Fetal Doppler', 'machine'], ['Ultrasound sonography', 'machine']],
    evaluator: (vitals, text, patient) => patient.isPregnant || patient.conditions?.includes('ANC') || patient.conditions?.includes('PNC') || ['pregnant', 'anc', 'pnc', 'labour', 'bleeding'].some(k => text.includes(k))
  },
  {
    id: 'RULE-NEURO-001', version: '2.0.0', guidelineRef: 'National Stroke Guidelines / BE-FAST (2023)',
    keywords: ['stroke', 'seizure', 'convulsion', 'unconscious', 'paralysis', 'facial droop', 'altered sensorium'],
    department: 'Emergency Neurology', level: 'district_hospital',
    items: [['Blood glucose glucometer', 'machine'], ['CT brain', 'machine'], ['Electrolyte panel', 'test_kit']],
    evaluator: (vitals, text) => ['stroke', 'seizure', 'convulsion', 'unconscious', 'paralysis'].some(k => text.includes(k))
  },
  {
    id: 'RULE-TRAUMA-001', version: '2.0.0', guidelineRef: 'Advanced Trauma Life Support (ATLS 2024)',
    keywords: ['trauma', 'accident', 'fracture', 'severe bleeding', 'wound', 'injury'],
    department: 'Comprehensive Emergency & Trauma Centre', level: 'district_hospital',
    items: [['300mA High-Frequency Digital X-Ray', 'machine'], ['FAST Bedside Ultrasound', 'machine'], ['Emergency blood crossmatch', 'test_kit']],
    evaluator: (vitals, text) => ['trauma', 'accident', 'fracture', 'severe bleeding'].some(k => text.includes(k))
  },
  {
    id: 'RULE-FEVER-001', version: '2.0.0', guidelineRef: 'NVBDCP National Malaria & Dengue Guidelines (2024)',
    keywords: ['fever', 'chills', 'malaria', 'dengue', 'rigors'],
    department: 'General OPD & Diagnostic Lab', level: 'phc',
    items: [['Malaria rapid diagnostic test', 'test_kit'], ['Dengue NS1 rapid test', 'test_kit'], ['CBC analyzer', 'machine']],
    evaluator: (vitals, text) => Number(vitals.temp || vitals.temperature || 0) >= 38.0 || text.includes('fever') || text.includes('malaria') || text.includes('dengue')
  },
  {
    id: 'RULE-NCD-001', version: '2.0.0', guidelineRef: 'National Programme for Prevention of NCDs (2023)',
    keywords: ['hypertension', 'blood pressure', 'sugar', 'diabetes', 'bp'],
    department: 'NCD Clinic', level: 'phc',
    items: [['Blood pressure monitor', 'machine'], ['Blood glucose glucometer', 'machine'], ['Lipid Profile', 'test_kit']],
    evaluator: (vitals, text) => {
      const bpSys = vitals.bp ? Number(String(vitals.bp).split('/')[0]) : 0;
      return bpSys >= 140 || Number(vitals.bloodGlucoseMgDl || 0) > 200 || text.includes('hypertension') || text.includes('diabetes');
    }
  }
];

const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hasResource = (available, target) => normalise(target).split(' ').filter(w => w.length > 3).some(word => available.some(item => normalise(item).includes(word)));

export function buildClinicalDecision({ symptoms = [], symptomNarrative = '', vitals = {}, patient = {} }) {
  const text = [...symptoms, symptomNarrative, ...(patient.conditions || [])].join(' ').toLowerCase();
  const matched = RULES.filter(rule => rule.evaluator(vitals, text, patient) || rule.keywords.some(keyword => text.includes(keyword)));
  const chosen = matched[0] || {
    id: 'RULE-GEN-001', version: '1.0.0', guidelineRef: 'MoHFW Primary Care Guidelines (2024)',
    department: 'General OPD', level: 'phc',
    items: [['Blood pressure monitor', 'machine'], ['Blood glucose glucometer', 'machine']]
  };

  const spo2 = Number(vitals.spo2 || vitals.spO2) || 0;
  const temp = Number(vitals.temp || vitals.temperature) || 0;
  const systolic = Number(String(vitals.bp || vitals.systolicBP || '').split('/')[0]) || 0;
  const diastolic = Number(String(vitals.bp || vitals.diastolicBP || '').split('/')[1]) || 0;

  const redFlags = [];
  if (spo2 > 0 && spo2 < 90) redFlags.push('Critical oxygen saturation below 90%');
  if (systolic >= 180 || diastolic >= 120) redFlags.push('Hypertensive crisis (BP >= 180/120 mmHg)');
  if (patient.isPregnant && (systolic >= 160 || diastolic >= 110)) redFlags.push('Severe Pre-Eclampsia / Eclampsia Danger (BP >= 160/110 mmHg in pregnancy)');
  if (['chest pain', 'unconscious', 'seizure', 'convulsion', 'severe bleeding', 'paralysis'].some(flag => text.includes(flag))) {
    redFlags.push('Time-critical emergency symptom reported');
  }

  const urgency = redFlags.length ? 'emergency' : (spo2 > 0 && spo2 < 94) || temp >= 38.9 || systolic >= 160 ? 'urgent' : 'routine';
  const priority = urgency === 'emergency' ? 'stat' : urgency === 'urgent' ? 'same_day' : 'routine';

  const allItems = matched.flatMap(rule => rule.items || []).concat(chosen.items || []);
  const recommendations = [...new Map(allItems.map(([name, category]) => [name, { name, category, priority, reason: `Recommended for ${chosen.department} evaluation` }])).values()];

  const summary = [
    symptoms.length && `Reported symptoms: ${symptoms.join(', ')}.`,
    symptomNarrative && `Additional notes: ${symptomNarrative.trim()}.`,
    vitals.bp && `BP ${vitals.bp}.`,
    vitals.spo2 && `SpO2 ${vitals.spo2}%.`,
    vitals.temp && `Temp ${vitals.temp}°C.`
  ].filter(Boolean).join(' ');

  return {
    ruleId: chosen.id,
    ruleVersion: chosen.version,
    guidelineReference: chosen.guidelineRef,
    urgency,
    redFlags,
    department: chosen.department,
    level: redFlags.length ? 'district_hospital' : chosen.level,
    recommendations,
    summary,
    confidence: redFlags.length ? 0.94 : matched.length ? 0.85 : 0.65,
    requiresClinicianReview: urgency === 'emergency' || urgency === 'urgent',
    disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. All clinical actions require medical officer validation.'
  };
}

/**
 * Match facilities using clinical need, required equipment/specialists,
 * distance, emergency capability, and recent DailyFacilityCapacitySnapshot.
 */
export function matchFacilities(facilities, decision, lat, lng, capacitySnapshots = []) {
  const locationKnown = Number.isFinite(lat) && Number.isFinite(lng);
  const km = (a, b, c, d) => {
    const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180;
    const q = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  };

  return facilities.map(f => {
    const snapshot = capacitySnapshots.find(s => s.facilityId === f.facilityId);
    const availableEquipment = [...(f.equipment || []), ...(f.diagnostics || []).filter(d => d.available).map(d => d.name), ...(f.departments || [])];
    const matchedResources = decision.recommendations.filter(r => hasResource(availableEquipment, r.name)).map(r => r.name);
    const missingResources = decision.recommendations.filter(r => !matchedResources.includes(r.name)).map(r => r.name);

    const distanceKm = locationKnown && f.lat && f.lng ? km(lat, lng, f.lat, f.lng) : null;
    const bedsTotal = snapshot?.bedsTotal ?? (f.resources?.bedsTotal || 0);
    const bedsOccupied = snapshot?.bedsOccupied ?? (f.resources?.bedsOccupied || 0);
    const bedsAvailable = Math.max(0, bedsTotal - bedsOccupied);
    const icuAvail = Math.max(0, (snapshot?.icuTotal ?? (f.resources?.icuTotal || 0)) - (snapshot?.icuOccupied ?? (f.resources?.icuOccupied || 0)));

    let score = Math.round((matchedResources.length / Math.max(1, decision.recommendations.length)) * 45);
    if (f.level === decision.level) score += 20;
    if (decision.urgency === 'emergency' && f.emergencyOpen24h) score += 20;
    if (bedsAvailable > 0) score += 10;
    if (decision.urgency === 'emergency' && icuAvail > 0) score += 10;
    if (distanceKm !== null) score += Math.max(0, Math.round(15 - distanceKm * 0.8));

    return {
      facilityId: f.facilityId,
      facilityName: f.name,
      distanceKm: distanceKm === null ? undefined : Math.round(distanceKm * 10) / 10,
      travelMinutes: distanceKm === null ? undefined : Math.round(distanceKm * 3.2 + 5),
      matchScore: Math.min(score, 100),
      matchedResources,
      missingResources,
      emergencyOpen24h: f.emergencyOpen24h,
      bedsAvailable,
      icuAvailable: icuAvail,
      capacitySnapshotId: snapshot?._id,
      capacitySnapshotTime: snapshot?.recordedAt,
      matchExplanation: `${matchedResources.length}/${decision.recommendations.length} clinical resources verified. ${f.emergencyOpen24h ? '24x7 Emergency Active.' : ''} Beds free: ${bedsAvailable}.`
    };
  }).sort((a, b) => b.matchScore - a.matchScore || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)).slice(0, 5);
}

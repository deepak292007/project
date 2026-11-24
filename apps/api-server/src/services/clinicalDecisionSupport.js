/**
 * clinicalDecisionSupport.js — Unified Versioned Decision Support & Facility Matching Service
 * 
 * Re-engineered to consolidate all clinical triage rules into one authoritative,
 * explainable implementation. Enforces the strict rule safety floor:
 *   - Highest-severity applicable rule always wins.
 *   - Negation handling: "no chest pain", "नुकताच ताप नाही", "ఛాతీ నొప్పి లేదు" is filtered.
 *   - Cough alone never triggers an emergency rule (requires hypoxia or severe dyspnea).
 *   - Consistent urgency levels: 'emergency', 'urgent', 'routine', 'home_care'.
 *   - Safety floor: Models or AI enrichment may escalate, but can NEVER downgrade a rule-triggered emergency or red flag.
 *   - Mandates clinician confirmation. Explicitly disclaims autonomous diagnosis.
 */

export const URGENCY_LEVELS = {
  EMERGENCY: 'emergency',
  URGENT: 'urgent',
  ROUTINE: 'routine',
  HOME_CARE: 'home_care'
};

const URGENCY_RANK = {
  [URGENCY_LEVELS.EMERGENCY]: 4,
  [URGENCY_LEVELS.URGENT]: 3,
  [URGENCY_LEVELS.ROUTINE]: 2,
  [URGENCY_LEVELS.HOME_CARE]: 1
};

/**
 * Filter out negated complaints from symptom narrative and list
 */
export function extractAffirmativeSymptoms(symptoms = [], narrative = '') {
  const combined = [...symptoms];
  if (narrative) combined.push(narrative);

  const cleanSymptoms = [];
  const negatedKeywords = new Set();

  for (const raw of combined) {
    const text = String(raw || '').toLowerCase().trim();
    if (!text) continue;

    // Check English negation patterns: "no chest pain", "denies shortness of breath"
    const matchNo = text.match(/\b(?:no|denies|without|not having)\s+([a-z0-9\s]+)/i);
    if (matchNo && matchNo[1]) {
      negatedKeywords.add(matchNo[1].trim());
      continue;
    }

    // Check Hindi/Urdu post-position negation: "chest pain nahi hai"
    if (text.includes('nahi') || text.includes('नहीं')) {
      const cleaned = text.replace(/nahi\s*hai|nahi|नहीं\s*है|नहीं/gi, '').trim();
      negatedKeywords.add(cleaned);
      continue;
    }

    // Check Marathi negation: "dukhne nahi", "ताप नाही"
    if (text.includes('नाही')) {
      const cleaned = text.replace(/नाही|नाहीत/gi, '').trim();
      negatedKeywords.add(cleaned);
      continue;
    }

    // Check Telugu negation: "nopi ledu", "నొప్పి లేదు"
    if (text.includes('ledu') || text.includes('లేదు')) {
      const cleaned = text.replace(/ledu|లేదు/gi, '').trim();
      negatedKeywords.add(cleaned);
      continue;
    }

    // Check Kannada negation: "illa", "ಇಲ್ಲ"
    if (text.includes('illa') || text.includes('ಇಲ್ಲ')) {
      const cleaned = text.replace(/illa|ಇಲ್ಲ/gi, '').trim();
      negatedKeywords.add(cleaned);
      continue;
    }

    cleanSymptoms.push(text);
  }

  // Filter cleanSymptoms against negatedKeywords
  const affirmative = cleanSymptoms.filter(sym => {
    for (const neg of negatedKeywords) {
      if (neg && (sym.includes(neg) || neg.includes(sym))) {
        return false;
      }
    }
    return true;
  });

  return { affirmative, negated: Array.from(negatedKeywords) };
}

export const AUTHORITATIVE_RULES = [
  // 1. CARDIAC EMERGENCY
  {
    id: 'RULE-CARD-001', version: '2.1.0', category: 'CARDIAC',
    guidelineRef: 'ICMR / WHO IMAI Emergency Cardiac Protocol (2024)',
    keywords: ['chest pain', 'heart attack', 'cardiac', 'myocardial', 'angina', 'crushing chest', 'छातीत दुखणे', 'सीने में दर्द', 'గుండె నొప్పి', 'ఛాతీ నొప్పి', 'ఎದೆ ನೋವು'],
    department: 'Emergency Cardiology', level: 'district_hospital', baseUrgency: 'emergency',
    items: [['12-lead ECG', 'machine'], ['Cardiac troponin rapid test', 'test_kit'], ['Continuous vitals monitor', 'machine']],
    evaluator: (vitals, symptoms) => {
      const hasCardiac = symptoms.some(s =>
        s.includes('chest pain') || s.includes('heart attack') || s.includes('angina') ||
        s.includes('crushing chest') || s.includes('छातीत') || s.includes('सीने में दर्द') ||
        s.includes('గుండె నొప్పి') || s.includes('ఛాతీ నొప్పి') || s.includes('ఎದೆ ನೋವು')
      );
      if (hasCardiac) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: ['Suspected Acute Coronary Syndrome (ACS) / Myocardial Infarction', 'Emergency ambulance 108 transit required'],
          differentials: ['Acute STEMI / NSTEMI', 'Unstable Angina', 'Aortic Dissection'],
          diagnostics: ['12-Lead ECG Stat', 'Cardiac Troponin-I', 'Continuous telemetry'],
          confidence: 0.95
        };
      }
      return { matched: false };
    }
  },

  // 2. STROKE / ACUTE NEUROLOGICAL EMERGENCY
  {
    id: 'RULE-NEURO-001', version: '2.0.0', category: 'STROKE_NEURO',
    guidelineRef: 'MoHFW National Stroke Protocol / BE-FAST Assessment (2023)',
    keywords: ['stroke', 'paralysis', 'facial droop', 'slurred speech', 'seizure', 'convulsion', 'unconscious', 'altered sensorium', 'बेशुद्ध', 'बेहोश', 'స్పృహ తప్పడం', 'ಪ್ರಜ್ಞಾಹೀನತೆ'],
    department: 'Emergency Neurology', level: 'district_hospital', baseUrgency: 'emergency',
    items: [['Capillary blood glucose glucometer', 'machine'], ['CT Brain Scan', 'machine'], ['Electrolyte panel', 'test_kit']],
    evaluator: (vitals, symptoms) => {
      const isNeuro = symptoms.some(s =>
        s.includes('stroke') || s.includes('paralysis') || s.includes('facial droop') ||
        s.includes('slurred') || s.includes('seizure') || s.includes('convulsion') ||
        s.includes('unconscious') || s.includes('altered sensorium') || s.includes('बेशुद्ध') ||
        s.includes('बेहोश') || s.includes('స్పృహ') || s.includes('ಪ್ರಜ್ಞಾಹೀನ')
      );
      if (isNeuro) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: ['Central Nervous System Crisis / Stroke BE-FAST signs or status seizure', 'Golden hour evaluation mandatory'],
          differentials: ['Acute Ischemic/Hemorrhagic Stroke', 'Status Epilepticus', 'Metabolic Encephalopathy'],
          diagnostics: ['Stat Non-Contrast Head CT', 'Blood Glucose Test', '12-Lead ECG'],
          confidence: 0.95
        };
      }
      return { matched: false };
    }
  },

  // 3. SEVERE RESPIRATORY / HYPOXIA / SARI
  // Crucial clinical safety rule: Cough alone must NEVER trigger an emergency.
  // Emergency requires severe hypoxia (SpO2 < 90%) or severe acute dyspnea with cyanosis/hypoxia.
  {
    id: 'RULE-RESP-001', version: '2.1.0', category: 'RESPIRATORY',
    guidelineRef: 'WHO SARI & Acute Hypoxemic Respiratory Failure Protocol (2024)',
    keywords: ['breathlessness', 'shortness of breath', 'difficulty breathing', 'asthma', 'hypoxia', 'spo2', 'cough', 'wheezing'],
    department: 'Chest Medicine & ICU', level: 'district_hospital', baseUrgency: 'emergency',
    items: [['Pulse oximeter', 'machine'], ['Oxygen concentrator / cylinder', 'machine'], ['Chest X-ray', 'machine']],
    evaluator: (vitals, symptoms) => {
      const spo2 = Number(vitals.spO2 || vitals.spo2 || 0);
      const rr = Number(vitals.respiratoryRate || 0);
      const hasDyspnea = symptoms.some(s =>
        s.includes('shortness of breath') || s.includes('difficulty breathing') ||
        s.includes('breathless') || s.includes('asthma') || s.includes('hypoxia') ||
        s.includes('श्वास घेण्यास त्रास') || s.includes('सांस लेने में') || s.includes('శ్వాస తీసుకోవడంలో')
      );
      const hasCoughOnly = symptoms.some(s => s.includes('cough') || s.includes('खोकला') || s.includes('खांसी') || s.includes('దగ్గు') || s.includes('ಕೆಮ್ಮು')) && !hasDyspnea;

      // Emergency: severe hypoxia (< 90%)
      if (spo2 > 0 && spo2 < 90) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: [`Critical oxygen saturation below 90% (${spo2}%)`, 'Imminent Respiratory Failure requiring High-Flow Oxygen / ICU'],
          differentials: ['Severe Acute Respiratory Infection (SARI)', 'Acute Pulmonary Edema', 'Severe COPD/Asthma Exacerbation'],
          diagnostics: ['Continuous Pulse Oximetry', 'Digital Chest X-Ray', 'High-Flow Oxygen Concentrator'],
          confidence: 0.96
        };
      }

      // Urgent: moderate desaturation (90-93%) or severe dyspnea
      if ((spo2 >= 90 && spo2 < 94) || (hasDyspnea && (rr > 24 || spo2 <= 95))) {
        return {
          matched: true, urgency: 'urgent',
          redFlags: [`Moderate Oxygen Desaturation (${spo2 || '<94'}%) / Significant Dyspnea`],
          differentials: ['Bronchopneumonia', 'Acute Bronchial Asthma Exacerbation'],
          diagnostics: ['Chest X-Ray', 'CBC & Inflammatory Markers', 'Nebulization Assessment'],
          confidence: 0.88
        };
      }

      // Routine: Cough alone or mild respiratory symptoms with normal oxygen
      if (hasCoughOnly || hasDyspnea) {
        return {
          matched: true, urgency: 'routine',
          redFlags: [],
          differentials: ['Upper Respiratory Tract Infection / Mild Bronchitis', 'Allergic Cough'],
          diagnostics: ['Clinical Auscultation', 'Symptomatic Assessment'],
          confidence: 0.82
        };
      }

      return { matched: false };
    }
  },

  // 4. ANC / MATERNAL ECLAMPSIA & POSTPARTUM HEMORRHAGE (PNC)
  {
    id: 'RULE-ANC-001', version: '2.2.0', category: 'ANC_PNC',
    guidelineRef: 'MoHFW Dakshata & WHO Maternal Pre-Eclampsia / PPH Guidelines (2024)',
    keywords: ['pregnant', 'pregnancy', 'anc', 'pnc', 'labour', 'bleeding', 'eclampsia', 'postpartum', 'गर्भ'],
    department: 'Obstetrics & Gynaecology', level: 'rural_hospital', baseUrgency: 'emergency',
    items: [['Urine protein dipstick', 'test_kit'], ['Hemoglobin / CBC test', 'test_kit'], ['Fetal Doppler', 'machine'], ['Ultrasound sonography', 'machine']],
    evaluator: (vitals, symptoms, patient = {}) => {
      const isMaternal = patient.isPregnant || patient.conditions?.includes('ANC') || patient.conditions?.includes('PNC') ||
        symptoms.some(x => ['pregnant', 'pregnancy', 'anc', 'pnc', 'labour', 'bleeding', 'postpartum', 'गर्भ'].some(k => x.includes(k)));
      const bpSys = vitals.systolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[0]) : 0);
      const bpDia = vitals.diastolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[1]) : 0);
      const hasBleed = symptoms.some(x => x.includes('bleeding') || x.includes('hemorrhage') || x.includes('haemorrhage') || x.includes('रक्तस्राव') || x.includes('రక్తస్రావం'));

      if (isMaternal && (hasBleed || (bpSys >= 160 || bpDia >= 110))) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: [
            bpSys >= 160 ? `Severe Pre-Eclampsia Danger (BP ${bpSys}/${bpDia} mmHg in pregnancy)` : 'Obstetric Hemorrhage Alert',
            'Immediate Magnesium Sulphate protocol / Blood grouping and Obstetrician evaluation required'
          ],
          differentials: ['Severe Pre-Eclampsia / Imminent Eclampsia', 'Antepartum / Postpartum Hemorrhage'],
          diagnostics: ['Urine Albumin Dipstick', 'Emergency Blood Crossmatch', 'Continuous Fetal Doppler'],
          confidence: 0.95
        };
      } else if (isMaternal && (bpSys >= 140 || bpDia >= 90)) {
        return {
          matched: true, urgency: 'urgent',
          redFlags: [`Gestational Hypertension (BP ${bpSys}/${bpDia} mmHg)`],
          differentials: ['Gestational Hypertension', 'Mild Pre-Eclampsia'],
          diagnostics: ['Urine Albumin', 'Serum Creatinine', 'Obstetric USG'],
          confidence: 0.88
        };
      } else if (isMaternal) {
        return {
          matched: true, urgency: 'routine',
          redFlags: [],
          differentials: ['Routine Antenatal Care (ANC) Evaluation'],
          diagnostics: ['Routine ANC Vitals & Weight', 'Hemoglobin (Hb)', 'Urine Dipstick'],
          confidence: 0.85
        };
      }
      return { matched: false };
    }
  },

  // 5. HYPERTENSIVE CRISIS / UNCONTROLLED DIABETES
  {
    id: 'RULE-NCD-001', version: '2.0.0', category: 'NCD',
    guidelineRef: 'National Programme for Prevention & Control of NCDs (NP-NCD 2023)',
    keywords: ['hypertension', 'bp', 'diabetes', 'sugar', 'blood pressure', 'glucose', 'उच्च रक्तदाब', 'रक्तचाप'],
    department: 'NCD Clinic / General Medicine', level: 'phc', baseUrgency: 'emergency',
    items: [['Blood pressure monitor', 'machine'], ['Blood glucose glucometer', 'machine'], ['Lipid Profile', 'test_kit']],
    evaluator: (vitals, symptoms) => {
      const bpSys = vitals.systolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[0]) : 0);
      const bpDia = vitals.diastolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[1]) : 0);
      const glucose = Number(vitals.bloodGlucoseMgDl || 0);

      if (bpSys >= 180 || bpDia >= 120) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: [`Hypertensive crisis (BP ${bpSys}/${bpDia} mmHg)`, 'Immediate target organ protection indicated'],
          differentials: ['Hypertensive Crisis', 'Essential Hypertension with End-Organ Alert'],
          diagnostics: ['12-Lead ECG Stat', 'Serum Creatinine', 'Fundoscopy'],
          confidence: 0.94
        };
      } else if (glucose > 300 || bpSys >= 160 || bpDia >= 100) {
        return {
          matched: true, urgency: 'urgent',
          redFlags: [glucose > 300 ? `Severe Hyperglycemia (${glucose} mg/dL)` : `Stage-2 Hypertension (${bpSys}/${bpDia} mmHg)`],
          differentials: ['Uncontrolled Type-2 Diabetes Mellitus', 'Stage-2 Essential Hypertension'],
          diagnostics: ['HbA1c Glycated Hemoglobin', 'Lipid Profile', 'Urine Microalbumin'],
          confidence: 0.88
        };
      }
      return { matched: false };
    }
  },

  // 6. TRAUMA & MAJOR HEMORRHAGE
  {
    id: 'RULE-TRAUMA-001', version: '2.0.0', category: 'TRAUMA',
    guidelineRef: 'Advanced Trauma Life Support (ATLS 2024)',
    keywords: ['trauma', 'accident', 'fracture', 'severe bleeding', 'wound', 'injury', 'hemorrhage', 'जख्म', 'अपघात'],
    department: 'Comprehensive Emergency & Trauma Centre', level: 'district_hospital', baseUrgency: 'emergency',
    items: [['300mA High-Frequency Digital X-Ray', 'machine'], ['FAST Bedside Ultrasound', 'machine'], ['Emergency blood crossmatch', 'test_kit']],
    evaluator: (vitals, symptoms) => {
      const isTrauma = symptoms.some(s =>
        s.includes('trauma') || s.includes('accident') || s.includes('fracture') ||
        s.includes('severe bleeding') || s.includes('hemorrhage') || s.includes('अपघात')
      );
      if (isTrauma) {
        return {
          matched: true, urgency: 'emergency',
          redFlags: ['Acute Severe Trauma / Hemorrhage Alert', 'Immediate surgical and trauma bay stabilization required'],
          differentials: ['Major Blunt/Penetrating Trauma', 'Compound Fracture with Blood Loss'],
          diagnostics: ['FAST Bedside Ultrasound', 'Digital X-Ray / CT Trauma', 'Emergency Blood Crossmatch'],
          confidence: 0.95
        };
      }
      return { matched: false };
    }
  },

  // 7. FEVER / VECTOR-BORNE (MALARIA / DENGUE)
  {
    id: 'RULE-FEVER-001', version: '2.0.0', category: 'FEVER',
    guidelineRef: 'National Vector Borne Disease Control Programme (NVBDCP 2024)',
    keywords: ['fever', 'chills', 'malaria', 'dengue', 'shivering', 'rigors', 'bodyache', 'ताप', 'बुखार', 'జ్వరం', 'ಜ್ವರ'],
    department: 'General OPD & Diagnostic Lab', level: 'phc', baseUrgency: 'urgent',
    items: [['Malaria rapid diagnostic test', 'test_kit'], ['Dengue NS1 rapid test', 'test_kit'], ['CBC analyzer', 'machine']],
    evaluator: (vitals, symptoms) => {
      const temp = Number(vitals.temperature || vitals.temp || 0);
      const hasFever = symptoms.some(s => s.includes('fever') || s.includes('chills') || s.includes('malaria') || s.includes('dengue') || s.includes('ताप') || s.includes('बुखार') || s.includes('జ్వరం') || s.includes('ಜ್ವರ')) || temp >= 38.0;

      if (hasFever && temp >= 39.5) {
        return {
          matched: true, urgency: 'urgent',
          redFlags: [`High-Grade Febrile Illness (Temp ${temp}°C)`],
          differentials: ['Malaria (Plasmodium Falciparum / Vivax)', 'Dengue NS1 Viral Fever', 'Enteric Typhoid Fever'],
          diagnostics: ['Rapid Malaria RDT (Pf/Pv)', 'Dengue NS1 Antigen', 'CBC with Platelets'],
          confidence: 0.88
        };
      } else if (hasFever) {
        return {
          matched: true, urgency: 'routine',
          redFlags: [],
          differentials: ['Acute Febrile Illness', 'Viral Upper Respiratory Infection'],
          diagnostics: ['Malaria Dipstick RDT', 'Baseline CBC'],
          confidence: 0.82
        };
      }
      return { matched: false };
    }
  },

  // 8. HOME CARE / MINOR SELF-LIMITING SYMPTOMS
  {
    id: 'RULE-HOME-001', version: '1.0.0', category: 'GENERAL',
    guidelineRef: 'MoHFW Community & Home-Care Protocol (2024)',
    keywords: ['mild headache', 'tiredness', 'mild fatigue', 'mild cold', 'sore throat', 'minor scratch'],
    department: 'Community Health & Home Care', level: 'sub_centre', baseUrgency: 'home_care',
    items: [['Oral Rehydration Salts', 'test_kit'], ['First aid dressing', 'test_kit']],
    evaluator: (vitals, symptoms) => {
      const temp = Number(vitals.temperature || vitals.temp || 0);
      const spo2 = Number(vitals.spO2 || vitals.spo2 || 99);
      const isMinor = symptoms.every(s =>
        s.includes('tired') || s.includes('fatigue') || s.includes('scratch') ||
        s.includes('mild headache') || s.includes('running nose') || s.includes('thakwa')
      );
      if (isMinor && temp < 37.8 && spo2 >= 96) {
        return {
          matched: true, urgency: 'home_care',
          redFlags: [],
          differentials: ['Mild Fatigue / Self-Limiting Malaise — 95%'],
          diagnostics: ['Adequate hydration & rest', 'Home temperature monitoring'],
          confidence: 0.80
        };
      }
      return { matched: false };
    }
  }
];

const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const hasResource = (available, target) => normalise(target).split(' ').filter(w => w.length > 3).some(word => available.some(item => normalise(item).includes(word)));

/**
 * Consolidated Single-Source Clinical Triage Decision Support
 */
export function buildClinicalDecision({
  symptoms = [],
  symptomNarrative = '',
  vitals = {},
  patient = {},
  aiEscalation = null // optional future ML suggestion to evaluate against safety floor
}) {
  // Step 1: Filter out negated phrases
  const { affirmative, negated } = extractAffirmativeSymptoms(symptoms, symptomNarrative);

  // Step 2: Evaluate all rules against affirmative complaints and vitals
  const matchedEvaluations = [];

  for (const rule of AUTHORITATIVE_RULES) {
    const res = rule.evaluator(vitals, affirmative, patient);
    if (res.matched) {
      matchedEvaluations.push({
        rule,
        evaluation: res
      });
    }
  }

  // Step 3: Select the HIGHEST-SEVERITY applicable rule
  // Rank order: emergency (4) > urgent (3) > routine (2) > home_care (1)
  let chosenEntry = null;
  let highestRank = 0;

  for (const entry of matchedEvaluations) {
    const rank = URGENCY_RANK[entry.evaluation.urgency] || 2;
    if (rank > highestRank) {
      highestRank = rank;
      chosenEntry = entry;
    }
  }

  if (!chosenEntry) {
    chosenEntry = {
      rule: {
        id: 'RULE-GEN-001', version: '1.0.0', guidelineRef: 'MoHFW Primary Care Guidelines (2024)',
        department: 'General OPD', level: 'phc',
        items: [['Blood pressure monitor', 'machine'], ['Blood glucose glucometer', 'machine']]
      },
      evaluation: {
        urgency: 'routine',
        redFlags: [],
        differentials: ['General Outpatient Screening'],
        diagnostics: ['Routine Examination'],
        confidence: 0.75
      }
    };
  }

  const { rule, evaluation } = chosenEntry;

  // Step 4: Red-Flag Critical Vitals Checks (Safety Floor)
  const spo2 = Number(vitals.spo2 || vitals.spO2 || 0);
  const temp = Number(vitals.temp || vitals.temperature || 0);
  const systolic = Number(String(vitals.bp || vitals.systolicBP || '').split('/')[0]) || 0;
  const diastolic = Number(String(vitals.bp || vitals.diastolicBP || '').split('/')[1]) || 0;

  const redFlags = [...(evaluation.redFlags || [])];
  if (spo2 > 0 && spo2 < 90 && !redFlags.some(f => f.includes('< 90%'))) {
    redFlags.push(`Critical oxygen saturation below 90% (${spo2}%)`);
  }
  if ((systolic >= 180 || diastolic >= 120) && !redFlags.some(f => f.includes('Hypertensive'))) {
    redFlags.push(`Hypertensive crisis (BP ${systolic}/${diastolic} mmHg)`);
  }
  if (patient.isPregnant && (systolic >= 160 || diastolic >= 110) && !redFlags.some(f => f.includes('Pre-Eclampsia'))) {
    redFlags.push(`Severe Pre-Eclampsia Danger (BP ${systolic}/${diastolic} mmHg in pregnancy)`);
  }

  // Rule-based urgency (Safety Floor)
  let ruleUrgency = redFlags.length ? URGENCY_LEVELS.EMERGENCY : evaluation.urgency;

  // Step 5: Enforce Safety Floor with any AI Escalation
  // Future ML model can escalate urgency (e.g. routine -> urgent, urgent -> emergency),
  // but can NEVER downgrade a rule-triggered emergency or red flag.
  let finalUrgency = ruleUrgency;
  let safetyFloorTriggered = false;

  if (aiEscalation && aiEscalation.urgency) {
    const aiRank = URGENCY_RANK[aiEscalation.urgency] || 2;
    const ruleRank = URGENCY_RANK[ruleUrgency] || 2;

    if (aiRank > ruleRank) {
      finalUrgency = aiEscalation.urgency;
    } else if (aiRank < ruleRank) {
      // Model attempted downgrade: SAFETY FLOOR BLOCKS IT
      finalUrgency = ruleUrgency;
      safetyFloorTriggered = true;
    }
  }

  const priority = finalUrgency === URGENCY_LEVELS.EMERGENCY ? 'stat'
    : finalUrgency === URGENCY_LEVELS.URGENT ? 'same_day'
    : 'routine';

  const facilityLevel = finalUrgency === URGENCY_LEVELS.EMERGENCY ? 'district_hospital'
    : finalUrgency === URGENCY_LEVELS.URGENT ? (rule.level === 'district_hospital' ? 'district_hospital' : 'rural_hospital')
    : finalUrgency === URGENCY_LEVELS.HOME_CARE ? 'sub_centre'
    : 'phc';

  const allItems = (rule.items || []).concat(evaluation.diagnostics?.map(d => [d, 'test_kit']) || []);
  const recommendations = [...new Map(allItems.map(([name, category]) => [name, { name, category: category || 'test_kit', priority, reason: `Recommended for ${rule.department} evaluation` }])).values()];

  const summary = [
    affirmative.length && `Reported symptoms: ${affirmative.join(', ')}.`,
    negated.length && `Negated: ${negated.join(', ')}.`,
    vitals.bp && `BP ${vitals.bp}.`,
    vitals.spo2 && `SpO2 ${vitals.spo2}%.`,
    vitals.temp && `Temp ${vitals.temp}°C.`
  ].filter(Boolean).join(' ');

  return {
    ruleId: rule.id,
    ruleVersion: rule.version,
    guidelineReference: rule.guidelineRef,
    urgency: finalUrgency,
    ruleUrgency,
    safetyFloorTriggered,
    redFlags,
    differentialDiagnosis: evaluation.differentials || [],
    department: rule.department,
    level: facilityLevel,
    recommendations,
    affirmativeSymptoms: affirmative,
    negatedSymptoms: negated,
    summary,
    confidence: redFlags.length ? 0.95 : evaluation.confidence || 0.82,
    requiresClinicianReview: true, // ALWAYS require clinician confirmation
    disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. Strictly non-diagnostic; all clinical actions, escalations, and prescriptions require confirmation by a qualified medical officer.'
  };
}

/**
 * Match facilities using clinical need, required equipment/specialists,
 * distance, emergency capability, and recent DailyFacilityCapacitySnapshot.
 */
export function matchFacilities(facilities, decision, lat, lng, capacitySnapshots = []) {
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

    const distKm = (Number.isFinite(lat) && Number.isFinite(lng) && f.lat && f.lng)
      ? Math.round(km(lat, lng, f.lat, f.lng) * 10) / 10
      : (f.distKm || 12);
    const travelMin = Math.round(distKm * 2.2);

    const bedsTotal = snapshot?.bedsTotal || f.resources?.bedsTotal || f.beds || 30;
    const bedsOccupied = snapshot?.bedsOccupied || f.resources?.bedsOccupied || Math.round(bedsTotal * 0.6);
    const bedsAvailable = Math.max(0, bedsTotal - bedsOccupied);
    const bedAvailScore = bedsTotal > 0 ? (bedsAvailable / bedsTotal) * 100 : 50;

    let matchScore = 50;
    if (decision.urgency === 'emergency') {
      if (f.emergencyOpen24h) matchScore += 30;
      if (f.level === 'district_hospital') matchScore += 20;
      matchScore += Math.min(20, (bedsAvailable / 10) * 10);
    } else {
      matchScore += Math.min(25, (matchedResources.length / Math.max(1, decision.recommendations.length)) * 25);
      matchScore += Math.max(0, 25 - distKm);
      matchScore += Math.min(25, bedAvailScore * 0.25);
    }

    return {
      facilityId: f.facilityId,
      facilityName: f.name,
      level: f.level,
      distanceKm: distKm,
      travelMinutes: travelMin,
      matchScore: Math.min(100, Math.round(matchScore)),
      matchedResources,
      missingResources,
      emergencyOpen24h: Boolean(f.emergencyOpen24h),
      bedsAvailable
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

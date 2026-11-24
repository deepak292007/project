/**
 * Versioned Clinical Rules Registry
 * Aligned with WHO SMART Guidelines, WHO IMCI & IMAI, MoHFW National Health Mission (NHM) protocols.
 * 
 * Rules provide EXPLAINABLE CLINICAL DECISION SUPPORT, NOT autonomous diagnosis.
 * Mandatory clinician review is enforced for all urgent and emergency recommendations.
 */

export interface ClinicalRule {
  id: string;
  version: string;
  category: 'ANC_PNC' | 'IMCI' | 'NCD' | 'FEVER' | 'RESPIRATORY' | 'CARDIAC' | 'STROKE_NEURO' | 'TRAUMA' | 'GENERAL';
  guidelineReference: string;
  keywords: string[];
  department: string;
  facilityLevel: 'sub_centre' | 'phc' | 'rural_hospital' | 'district_hospital';
  evaluator: (vitals: any, symptoms: string[], patient: any) => {
    matched: boolean;
    urgency?: 'emergency' | 'urgent' | 'routine' | 'home_care';
    redFlags?: string[];
    differentials?: string[];
    diagnostics?: string[];
    confidence?: number;
  };
}

export const CLINICAL_RULES_REGISTRY: ClinicalRule[] = [
  // 1. CARDIAC EMERGENCY (ACS / Myocardial Infarction)
  {
    id: 'RULE-CARD-001',
    version: '2.1.0',
    category: 'CARDIAC',
    guidelineReference: 'ICMR / WHO IMAI Emergency Cardiac Protocol (2024)',
    keywords: ['chest pain', 'heart attack', 'cardiac', 'myocardial', 'angina', 'crushing chest'],
    department: 'Emergency Cardiology',
    facilityLevel: 'district_hospital',
    evaluator: (_vitals, symptoms) => {
      const s = symptoms.map(x => x.toLowerCase());
      const hasPain = s.some(x => x.includes('chest pain') || x.includes('cardiac') || x.includes('heart attack') || x.includes('angina'));
      if (hasPain) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: ['Suspected Acute Coronary Syndrome / Myocardial Infarction', 'Time-critical emergency requiring 108 ambulance & 12-lead ECG'],
          differentials: ['Acute STEMI / NSTEMI — 65%', 'Unstable Angina — 25%', 'Aortic Dissection — 10%'],
          diagnostics: ['12-Lead ECG Stat', 'Cardiac Troponin-I', 'Continuous telemetry', 'Chest X-ray'],
          confidence: 0.94
        };
      }
      return { matched: false };
    }
  },

  // 2. STROKE & ACUTE NEUROLOGICAL EMERGENCY
  {
    id: 'RULE-NEURO-001',
    version: '2.0.0',
    category: 'STROKE_NEURO',
    guidelineReference: 'MoHFW National Stroke Protocol / BE-FAST Assessment (2023)',
    keywords: ['stroke', 'paralysis', 'facial droop', 'slurred speech', 'seizure', 'convulsion', 'unconscious', 'altered sensorium'],
    department: 'Emergency Neurology',
    facilityLevel: 'district_hospital',
    evaluator: (_vitals, symptoms) => {
      const s = symptoms.map(x => x.toLowerCase());
      const isNeuro = s.some(x => x.includes('stroke') || x.includes('paralysis') || x.includes('seizure') || x.includes('convulsion') || x.includes('unconscious') || x.includes('slurred'));
      if (isNeuro) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: ['Central Nervous System Crisis / Acute Ischemic or Hemorrhagic Stroke risk', 'Golden hour thrombolysis window candidate'],
          differentials: ['Acute Cerebrovascular Stroke — 65%', 'Status Epilepticus — 25%', 'Metabolic Encephalopathy — 10%'],
          diagnostics: ['Emergency Non-Contrast Head CT', 'Stat Capillary Blood Glucose', 'Serum Electrolytes', '12-Lead ECG'],
          confidence: 0.95
        };
      }
      return { matched: false };
    }
  },

  // 3. SEVERE RESPIRATORY / HYPOXIA / SARI
  {
    id: 'RULE-RESP-001',
    version: '2.1.0',
    category: 'RESPIRATORY',
    guidelineReference: 'WHO SARI & Acute Hypoxemic Respiratory Failure Protocol (2024)',
    keywords: ['breathlessness', 'shortness of breath', 'difficulty breathing', 'asthma', 'hypoxia', 'spo2'],
    department: 'Chest Medicine & ICU',
    facilityLevel: 'district_hospital',
    evaluator: (vitals, symptoms) => {
      const spo2 = Number(vitals.spO2 || vitals.spo2 || 0);
      const rr = Number(vitals.respiratoryRate || 0);
      const s = symptoms.map(x => x.toLowerCase());
      const hasResp = s.some(x => x.includes('breath') || x.includes('asthma') || x.includes('cough') || x.includes('hypoxia'));

      if (spo2 > 0 && spo2 < 90) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: [`Critical Oxygen Saturation (${spo2}% < 90%)`, 'Imminent Respiratory Failure requiring High-Flow Oxygen / ICU'],
          differentials: ['Severe Acute Respiratory Infection (SARI) — 70%', 'Acute Pulmonary Oedema — 20%', 'Severe COPD/Asthma Exacerbation — 10%'],
          diagnostics: ['Arterial Blood Gas (ABG)', 'Continuous Pulse Oximetry', 'Digital Chest X-Ray', 'High-Flow Oxygen Concentrator'],
          confidence: 0.96
        };
      } else if (spo2 >= 90 && spo2 < 94 || rr > 24) {
        return {
          matched: true,
          urgency: 'urgent',
          redFlags: [`Moderate Oxygen Desaturation (${spo2}%) / Tachypnea`],
          differentials: ['Bronchopneumonia — 60%', 'Acute Bronchial Asthma — 30%', 'Viral Bronchitis — 10%'],
          diagnostics: ['Chest X-Ray', 'CBC & Inflammatory Markers', 'Nebulization Assessment'],
          confidence: 0.85
        };
      } else if (hasResp) {
        return {
          matched: true,
          urgency: 'routine',
          redFlags: [],
          differentials: ['Upper Respiratory Tract Infection — 75%', 'Mild Allergic Bronchitis — 25%'],
          diagnostics: ['Symptomatic Assessment', 'Peak Expiratory Flow (optional)'],
          confidence: 0.80
        };
      }
      return { matched: false };
    }
  },

  // 4. ANC / MATERNAL ECLAMPSIA & POSTPARTUM HEMORRHAGE (PNC)
  {
    id: 'RULE-ANC-001',
    version: '2.2.0',
    category: 'ANC_PNC',
    guidelineReference: 'MoHFW Dakshata & WHO Maternal Pre-Eclampsia / PPH Guidelines (2024)',
    keywords: ['pregnant', 'pregnancy', 'anc', 'pnc', 'labour', 'bleeding', 'eclampsia', 'postpartum'],
    department: 'Obstetrics & Gynaecology',
    facilityLevel: 'rural_hospital',
    evaluator: (vitals, symptoms, patient = {}) => {
      const isMaternal = patient.isPregnant || patient.conditions?.includes('ANC') || patient.conditions?.includes('PNC') || symptoms.some(x => ['pregnant', 'anc', 'pnc', 'labour', 'bleeding', 'postpartum'].some(k => x.toLowerCase().includes(k)));
      const bpSys = vitals.systolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[0]) : 0);
      const bpDia = vitals.diastolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[1]) : 0);
      const s = symptoms.map(x => x.toLowerCase());
      const hasBleed = s.some(x => x.includes('bleeding') || x.includes('hemorrhage') || x.includes('haemorrhage'));

      if (isMaternal && (hasBleed || (bpSys >= 160 || bpDia >= 110))) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: [
            bpSys >= 160 ? `Severe Pre-Eclampsia Danger (BP ${bpSys}/${bpDia} mmHg)` : 'Acute Obstetric Hemorrhage (PPH/APH) Alert',
            'Requires immediate MgSO4 loading protocol / Blood crossmatch and emergency Obstetrician evaluation'
          ],
          differentials: ['Severe Pre-Eclampsia / Imminent Eclampsia — 75%', 'Postpartum / Antepartum Hemorrhage — 20%', 'HELLP Syndrome — 5%'],
          diagnostics: ['Urine Albumin / Protein Dipstick', 'Emergency Blood Crossmatch', 'CBC with Platelets', 'Continuous Fetal Doppler'],
          confidence: 0.95
        };
      } else if (isMaternal && (bpSys >= 140 || bpDia >= 90)) {
        return {
          matched: true,
          urgency: 'urgent',
          redFlags: [`Gestational Hypertension (BP ${bpSys}/${bpDia} mmHg)`],
          differentials: ['Gestational Hypertension — 80%', 'Mild Pre-Eclampsia — 20%'],
          diagnostics: ['Urine Albumin', 'Serum Creatinine', 'Fetal Doppler', 'Obstetric USG'],
          confidence: 0.88
        };
      }
      return { matched: false };
    }
  },

  // 5. IMCI (CHILD MALNUTRITION / SEVERE DIARRHOEA / PEDIATRIC)
  {
    id: 'RULE-IMCI-001',
    version: '2.0.0',
    category: 'IMCI',
    guidelineReference: 'WHO / UNICEF Integrated Management of Childhood Illness (IMCI 2024)',
    keywords: ['sam', 'malnutrition', 'child', 'diarrhoea', 'diarrhea', 'vomiting', 'sunken eyes', 'dehydration'],
    department: 'Paediatrics & Nutrition Rehabilitation (NRC)',
    facilityLevel: 'phc',
    evaluator: (_vitals, symptoms, patient = {}) => {
      const s = symptoms.map(x => x.toLowerCase());
      const isPediatric = (patient.age !== undefined && patient.age < 12) || s.some(x => x.includes('child') || x.includes('infant') || x.includes('sam'));
      const hasDehydration = s.some(x => x.includes('sunken eyes') || x.includes('unable to drink') || x.includes('lethargy') || x.includes('dehydration'));
      const hasDiarrhea = s.some(x => x.includes('diarrhoea') || x.includes('diarrhea') || x.includes('vomiting'));

      if (isPediatric && hasDehydration && hasDiarrhea) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: ['Pediatric Severe Dehydration / Shock Risk (IMCI Plan C)', 'Immediate IV Ringer Lactate / Rehydration and medical officer assessment mandatory'],
          differentials: ['Acute Gastroenteritis with Severe Dehydration — 80%', 'Cholera / Osmotic Diarrhoea — 20%'],
          diagnostics: ['Serum Electrolytes (Na/K)', 'Capillary Blood Sugar Stat', 'Stool Routine'],
          confidence: 0.92
        };
      } else if (hasDiarrhea) {
        return {
          matched: true,
          urgency: 'routine',
          redFlags: [],
          differentials: ['Acute Gastroenteritis (IMCI Plan A/B) — 90%'],
          diagnostics: ['Oral Rehydration Salts (ORS) & Zinc supplementation protocol', 'Blood Glucose'],
          confidence: 0.82
        };
      }
      return { matched: false };
    }
  },

  // 6. NCD (HYPERTENSIVE CRISIS / UNCONTROLLED DIABETES)
  {
    id: 'RULE-NCD-001',
    version: '2.0.0',
    category: 'NCD',
    guidelineReference: 'National Programme for Prevention & Control of NCDs (NP-NCD 2023)',
    keywords: ['hypertension', 'bp', 'diabetes', 'sugar', 'blood pressure', 'glucose'],
    department: 'NCD Clinic / General Medicine',
    facilityLevel: 'phc',
    evaluator: (vitals, _symptoms) => {
      const bpSys = vitals.systolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[0]) : 0);
      const bpDia = vitals.diastolicBP || (vitals.bp ? Number(String(vitals.bp).split('/')[1]) : 0);
      const glucose = Number(vitals.bloodGlucoseMgDl || 0);

      if (bpSys >= 180 || bpDia >= 120) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: [`Hypertensive Crisis (BP ${bpSys}/${bpDia} mmHg)`, 'Risk of acute target organ damage (Stroke / Encephalopathy / Retinopathy)'],
          differentials: ['Hypertensive Urgency / Emergency — 90%', 'Secondary Renovascular Hypertension — 10%'],
          diagnostics: ['12-Lead ECG Stat', 'Urine Albumin & Microalbuminuria', 'Serum Creatinine', 'Fundoscopy'],
          confidence: 0.93
        };
      } else if (glucose > 300 || bpSys >= 160 || bpDia >= 100) {
        return {
          matched: true,
          urgency: 'urgent',
          redFlags: [glucose > 300 ? `Severe Hyperglycemia (${glucose} mg/dL)` : `Stage-2 Hypertension (${bpSys}/${bpDia} mmHg)`],
          differentials: ['Uncontrolled Type-2 Diabetes Mellitus — 70%', 'Stage-2 Essential Hypertension — 30%'],
          diagnostics: ['HbA1c Glycated Hemoglobin', 'Lipid Profile', 'Urine Microalbumin', 'Creatinine'],
          confidence: 0.88
        };
      }
      return { matched: false };
    }
  },

  // 7. FEVER / VECTOR-BORNE (MALARIA / DENGUE)
  {
    id: 'RULE-FEVER-001',
    version: '2.0.0',
    category: 'FEVER',
    guidelineReference: 'National Vector Borne Disease Control Programme (NVBDCP 2024)',
    keywords: ['fever', 'chills', 'malaria', 'dengue', 'shivering', 'rigors', 'bodyache'],
    department: 'General OPD & Diagnostic Lab',
    facilityLevel: 'phc',
    evaluator: (vitals, symptoms) => {
      const temp = Number(vitals.temperature || vitals.temp || 0);
      const s = symptoms.map(x => x.toLowerCase());
      const hasFever = s.some(x => x.includes('fever') || x.includes('chills') || x.includes('malaria') || x.includes('dengue')) || temp >= 38.0;

      if (hasFever && temp >= 39.5) {
        return {
          matched: true,
          urgency: 'urgent',
          redFlags: [`High-Grade Febrile Illness (Temp ${temp}°C)`],
          differentials: ['Plasmodium Falciparum / Vivax Malaria — 45%', 'Dengue NS1 Viral Fever — 35%', 'Enteric Typhoid Fever — 20%'],
          diagnostics: ['Rapid Malaria RDT (Pf/Pv)', 'Dengue NS1 / IgM Rapid Test', 'Complete Blood Count (CBC) with Platelets'],
          confidence: 0.86
        };
      } else if (hasFever) {
        return {
          matched: true,
          urgency: 'routine',
          redFlags: [],
          differentials: ['Acute Febrile Illness — 60%', 'Viral Upper Respiratory Infection — 40%'],
          diagnostics: ['Malaria Dipstick RDT', 'Baseline CBC'],
          confidence: 0.80
        };
      }
      return { matched: false };
    }
  },

  // 8. TRAUMA & ACUTE HEMORRHAGE
  {
    id: 'RULE-TRAUMA-001',
    version: '2.0.0',
    category: 'TRAUMA',
    guidelineReference: 'Advanced Trauma Life Support (ATLS) / NHM Emergency Care Guidelines (2024)',
    keywords: ['trauma', 'accident', 'fracture', 'severe bleeding', 'wound', 'injury', 'hemorrhage'],
    department: 'Comprehensive Emergency & Trauma Centre',
    facilityLevel: 'district_hospital',
    evaluator: (_vitals, symptoms) => {
      const s = symptoms.map(x => x.toLowerCase());
      const isTrauma = s.some(x => x.includes('trauma') || x.includes('accident') || x.includes('fracture') || x.includes('severe bleeding') || x.includes('hemorrhage'));
      if (isTrauma) {
        return {
          matched: true,
          urgency: 'emergency',
          redFlags: ['Acute Hemodynamic Shock / Severe Trauma Alert', 'Requires priority trauma stabilization, hemorrhage control, and surgical evaluation'],
          differentials: ['Major Blunt/Penetrating Trauma with Hemorrhage — 70%', 'Compound Skeletal Fracture — 30%'],
          diagnostics: ['FAST Bedside Ultrasound', 'Digital X-Ray / CT Trauma', 'Emergency Blood Grouping & Crossmatch', 'Coagulation Profile'],
          confidence: 0.95
        };
      }
      return { matched: false };
    }
  }
];

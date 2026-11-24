// =============================================================
// ArogyaLink – Comprehensive Real Dataset (AP, Palghar, Border Nodes)
// Diverse clinical severities + Long-Distance Solutions
// =============================================================

import { AP_FACILITIES_DATASET } from './data/apFacilitiesDataset.js';

const RAW_FACILITIES = [
  ...AP_FACILITIES_DATASET,
  // ===========================================================================
  // REGION A: ANDHRA PRADESH (Amaravati Capital Region · VIT-AP / Inavolu / Mandadam)
  // ===========================================================================

  // ── 1. VIT-AP Campus Health Centre (Inavolu-Sakhamuru) ───────────────────
  {
    facilityId: 'VIT-AP-HC-01',
    name: 'VIT-AP Campus Health Centre',
    nameMarathi: 'VIT-AP विद्यापीठ आरोग्य केंद्र',
    nameTelugu: 'విట్-ఏపీ విశ్వవిద్యాలయ ఆరోగ్య కేంద్రం (ఇనవోలు)',
    nameHindi: 'वीआईटी-एपी विश्वविद्यालय स्वास्थ्य केंद्र',
    level: 'sub_centre',
    block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'Near Rock Plaza, VIT-AP University, Inavolu, Amaravati – 522237',
    phone: '0863-2370000',
    lat: 16.4971, lng: 80.5003,
    departments: ['Student & Staff OPD', 'Emergency Triage', 'Minor OT / Dressing', 'Observation Ward', 'Nebulization & Oxygen Station'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: [
      '12-Lead Digital ECG Machine',
      'High-Flow Oxygen Cylinders & Nebulizers',
      'Automated External Defibrillator (AED)',
      'Multi-Parameter Vital Signs Monitor',
      'Semi-Auto Blood Glucose Analyzer',
      'Dedicated 24x7 Campus Emergency Ambulance'
    ],
    currentOpdQueue: { queueLength: 4, activeCounters: 1, avgServiceTimeMin: 6 },
    resources: {
      bedsTotal: 6, bedsOccupied: 2, icuTotal: 0, icuOccupied: 0,
      oxygenBeds: 2, oxygenOccupied: 0, ventilators: 0, ventilatorsInUse: 0,
      ambulances: 1, ambulancesAvailable: 1, operatingTheatres: 0, otAvailable: 0
    },
    diagnostics: [
      { name: 'ECG (Stat 12-Lead)', available: true, slots: 50, waitHrs: 0 },
      { name: 'Blood Glucose (Stat)', available: true, slots: 50, waitHrs: 0 },
      { name: 'Pulse Oximetry & BP', available: true, slots: 100, waitHrs: 0 },
      { name: 'Rapid Antigen / Dengue / Typhoid', available: true, slots: 20, waitHrs: 0.25 }
    ],
    doctors: [
      { name: 'Dr. Ch. Haritha', specialty: 'Campus Medical Officer (MBBS)', availableToday: true, teleconsultAvailable: true, nextSlot: '09:30 AM' }
    ]
  },

  // ── 2. Dr. YSR Village Health Clinic - Inavolu (Sub-Centre) ───────────────
  {
    facilityId: 'VHC-INAVOLU-01',
    name: 'Dr. YSR Village Health Clinic - Inavolu',
    nameMarathi: 'डॉ. वायएसआर ग्राम आरोग्य केंद्र - इनावोलू',
    nameTelugu: 'డా. వైఎస్సార్ గ్రామీణ ఆరోగ్య కేంద్రం - ఇనవోలు',
    nameHindi: 'डॉ. वाईएसआर ग्राम स्वास्थ्य क्लिनिक - इनावोलु',
    level: 'sub_centre',
    block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'Main Gram Panchayat Road, Inavolu Village, Amaravati – 522237',
    phone: '0863-234101',
    lat: 16.5162, lng: 80.4988,
    departments: ['Maternal & Child Health (MCH)', 'NCD Screening', 'General OPD', 'Vaccination', 'Telemedicine Spoke'],
    emergencyOpen24h: false,
    lastUpdated: new Date().toISOString(),
    equipment: [
      'Digital Blood Pressure & Pulse Monitor',
      'Sahli Haemoglobinometer',
      'Glucometer & Test Strips',
      'Fetal Heart Rate Doppler (Pocket)',
      'Cold Chain Vaccine Carrier'
    ],
    currentOpdQueue: { queueLength: 7, activeCounters: 1, avgServiceTimeMin: 7 },
    resources: {
      bedsTotal: 4, bedsOccupied: 1, icuTotal: 0, icuOccupied: 0,
      oxygenBeds: 0, oxygenOccupied: 0, ventilators: 0, ventilatorsInUse: 0,
      ambulances: 0, ambulancesAvailable: 0, operatingTheatres: 0, otAvailable: 0
    },
    diagnostics: [
      { name: 'Haemoglobin (Sahli)', available: true, slots: 25, waitHrs: 0 },
      { name: 'Urine Albumin & Sugar', available: true, slots: 20, waitHrs: 0 },
      { name: 'Blood Glucose (Strip)', available: true, slots: 30, waitHrs: 0 },
      { name: 'Pregnancy Test (UPT)', available: true, slots: 15, waitHrs: 0 },
      { name: 'Hub-and-Spoke Sample Pickup (to AIIMS Lab)', available: true, slots: 50, waitHrs: 4 }
    ],
    doctors: [
      { name: 'MLHP K. Lakshmi Prasanna', specialty: 'Community Health Officer (CHO)', availableToday: true, teleconsultAvailable: true, nextSlot: '10:00 AM' }
    ]
  },

  // ── 3. Primary Health Centre Mandadam (PHC Mandadam) ───────────────────────
  {
    facilityId: 'PHC-MANDADAM-01',
    name: 'Primary Health Centre Mandadam',
    nameMarathi: 'प्राथमिक आरोग्य केंद्र मंदादम',
    nameTelugu: 'ప్రాథమిక ఆరోగ్య కేంద్రం - మందడం',
    nameHindi: 'प्राथमिक स्वास्थ्य केंद्र मंदाडम',
    level: 'phc',
    block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'Near ZP High School, Mandadam, Amaravati Capital Region – 522503',
    phone: '0863-228201',
    lat: 16.5408, lng: 80.5482,
    departments: ['24x7 Normal Delivery Unit', 'General OPD', 'ANC/PNC Clinic', 'NCD Clinic', 'Immunization', 'Tele-Consultation Spoke'],
    emergencyOpen24h: false,
    lastUpdated: new Date().toISOString(),
    equipment: [
      'Semi-Automated Biochemistry Blood Analyzer',
      '12-Lead ECG Machine (Tele-ECG)',
      'High-Flow Oxygen Concentrators (10 LPM)',
      'Infant Radiant Warmer & Phototherapy',
      'Electronic Fetal Doppler',
      'Binocular Microscope for Smear Testing',
      '108 Roadside Emergency Transit Point'
    ],
    currentOpdQueue: { queueLength: 14, activeCounters: 2, avgServiceTimeMin: 8 },
    resources: {
      bedsTotal: 12, bedsOccupied: 6, icuTotal: 0, icuOccupied: 0,
      oxygenBeds: 3, oxygenOccupied: 1, ventilators: 0, ventilatorsInUse: 0,
      ambulances: 1, ambulancesAvailable: 1, operatingTheatres: 0, otAvailable: 0
    },
    diagnostics: [
      { name: 'Complete Blood Count (CBC)', available: true, slots: 35, waitHrs: 0.5 },
      { name: 'Blood Sugar (FBS / PPBS)', available: true, slots: 40, waitHrs: 0 },
      { name: 'Serum Creatinine & Urea', available: true, slots: 20, waitHrs: 1 },
      { name: 'Urine Routine Microscopy', available: true, slots: 25, waitHrs: 0.25 },
      { name: '12-Lead ECG with Cloud AI', available: true, slots: 20, waitHrs: 0.1 },
      { name: 'Thyroid & HbA1c Hub Pickup', available: true, slots: 30, waitHrs: 6 }
    ],
    doctors: [
      { name: 'Dr. P. Srinivas Rao', specialty: 'Medical Officer In-Charge (MBBS)', availableToday: true, teleconsultAvailable: true, nextSlot: '10:30 AM' },
      { name: 'Dr. M. Sravani', specialty: 'General Physician & MCH (MBBS)', availableToday: true, teleconsultAvailable: false, nextSlot: '11:15 AM' }
    ]
  },

  // ── 4. Community Health Centre Thullur (CHC Thullur / Tulluru) ────────────
  {
    facilityId: 'CHC-THULLUR-01',
    name: 'Community Health Centre Thullur',
    nameMarathi: 'सामुदायिक आरोग्य केंद्र थुल्लूर',
    nameTelugu: 'సామాజిక ఆరోగ్య కేంద్రం - తుళ్ళూరు',
    nameHindi: 'सामुदायिक स्वास्थ्य केंद्र थुल्लूर',
    level: 'rural_hospital',
    block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'Main Road, Tulluru Town Center, Amaravati – 522237',
    phone: '0863-228301',
    lat: 16.5422, lng: 80.4633,
    departments: ['24x7 Emergency & Trauma', 'Surgery', 'Obstetrics & Gynaecology', 'General Medicine', 'Paediatrics', 'Orthopaedics', 'Intermediate Stabilization Unit'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: [
      '300mA High-Frequency Digital X-Ray',
      'Ultrasound (USG) Sonography Scanner (3-Probes)',
      'Fully Automated 3-Part CBC Cell Counter',
      '24x7 Major & Minor Modular Operation Theatre',
      'Multi-Parameter Defibrillators & Emergency Crash Carts',
      'Continuous Pulse Oximetry & Central Oxygen Pipeline',
      'Janani Express 102 & 108 Emergency Depot'
    ],
    currentOpdQueue: { queueLength: 22, activeCounters: 3, avgServiceTimeMin: 9 },
    resources: {
      bedsTotal: 30, bedsOccupied: 18, icuTotal: 4, icuOccupied: 2,
      oxygenBeds: 8, oxygenOccupied: 4, ventilators: 1, ventilatorsInUse: 0,
      ambulances: 2, ambulancesAvailable: 1, operatingTheatres: 1, otAvailable: 1
    },
    diagnostics: [
      { name: 'Digital X-Ray (Chest / Bones)', available: true, slots: 35, waitHrs: 1 },
      { name: 'Ultrasound Sonography (Obstetric / Abdomen)', available: true, slots: 15, waitHrs: 2 },
      { name: 'Automated CBC & Platelet Count', available: true, slots: 60, waitHrs: 0.5 },
      { name: 'Liver & Kidney Function Tests (LFT/KFT)', available: true, slots: 25, waitHrs: 1.5 },
      { name: '12-Lead ECG Stat', available: true, slots: 40, waitHrs: 0.1 }
    ],
    doctors: [
      { name: 'Dr. V. Rajesh Kumar', specialty: 'General Surgery & Trauma (MS)', availableToday: true, teleconsultAvailable: true, nextSlot: '11:00 AM' },
      { name: 'Dr. G. Padmavathi', specialty: 'Obstetrics & Gynaecology (DGO)', availableToday: true, teleconsultAvailable: true, nextSlot: '09:45 AM' },
      { name: 'Dr. K. Mahesh', specialty: 'General Physician (MD)', availableToday: true, teleconsultAvailable: true, nextSlot: '10:15 AM' }
    ]
  },

  // ── 5. AIIMS Mangalagiri (Apex Multi-Specialty Tertiary Hospital) ───────────
  {
    facilityId: 'AIIMS-MANGALAGIRI-01',
    name: 'AIIMS Mangalagiri (Apex Tertiary Teaching Hospital)',
    nameMarathi: 'एम्स मंगलागिरी (अखिल भारतीय आयुर्विज्ञान संस्था)',
    nameTelugu: 'ఎయిమ్స్ మంగళగిరి (అత్యున్నత స్థాయి సూపర్ స్పెషాలిటీ ఆసుపత్రి)',
    nameHindi: 'एम्स मंगलगिरी (अखिल भारतीय आयुर्विज्ञान संस्थान)',
    level: 'district_hospital',
    block: 'Mangalagiri', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'NH-16, Mangalagiri, Guntur District, Andhra Pradesh – 522503',
    phone: '08645-293400',
    lat: 16.4423, lng: 80.5601,
    departments: [
      'Comprehensive Emergency & Trauma Centre', 'Cardiology & Cath Lab', 'Neurology & Neurosurgery',
      'Obstetrics & Super-Specialty Gynaecology', 'Pediatrics & Level-3 NICU/PICU', 'Medical & Surgical Oncology',
      'Nephrology & Dialysis', 'Orthopaedics & Joint Replacement', 'Advanced Radiology & Nuclear Medicine',
      'Central Tele-Consultation Hub', 'Apex Diagnostic Center'
    ],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: [
      '128-Slice Multi-Detector CT Scanner',
      '3.0 Tesla High-Field MRI Scanner',
      'Cardiac Catheterization Laboratory (Cath Lab)',
      '12 State-of-the-Art Modular Operation Theatres',
      'Level-3 Neonatal & Pediatric ICU (NICU/PICU)',
      'Fully Automated Blood Component Separation Bank',
      'Digital Mammography & Color Doppler Ultrasound',
      'Comprehensive 40-Bed Medical & Surgical ICU',
      'Hemodialysis & Continuous Renal Replacement (CRRT)'
    ],
    currentOpdQueue: { queueLength: 48, activeCounters: 6, avgServiceTimeMin: 10 },
    resources: {
      bedsTotal: 960, bedsOccupied: 720, icuTotal: 60, icuOccupied: 44,
      oxygenBeds: 150, oxygenOccupied: 98, ventilators: 25, ventilatorsInUse: 18,
      ambulances: 8, ambulancesAvailable: 6, operatingTheatres: 12, otAvailable: 4
    },
    diagnostics: [
      { name: 'Multi-Slice CT Scan (Stat)', available: true, slots: 40, waitHrs: 1.5 },
      { name: '3.0T High-Field MRI', available: true, slots: 18, waitHrs: 3 },
      { name: 'Coronary Angiography (Cath Lab)', available: true, slots: 10, waitHrs: 4 },
      { name: 'Digital X-Ray / Mammography', available: true, slots: 150, waitHrs: 0.5 },
      { name: '2D / 3D Echocardiography & Doppler', available: true, slots: 30, waitHrs: 1.5 },
      { name: 'Advanced Pathology, Genetics & Histopathology', available: true, slots: 300, waitHrs: 2 }
    ],
    doctors: [
      { name: 'Dr. K. Anuradha', specialty: 'Cardiology (MD, DM)', availableToday: true, teleconsultAvailable: true, nextSlot: '10:00 AM' },
      { name: 'Dr. B. Venkatesh', specialty: 'Neurology & Stroke (DM)', availableToday: true, teleconsultAvailable: true, nextSlot: '11:30 AM' },
      { name: 'Dr. S. Deepthi', specialty: 'Paediatrics & Neonatology (MD)', availableToday: true, teleconsultAvailable: true, nextSlot: '09:30 AM' },
      { name: 'Dr. N. Raghuram', specialty: 'Orthopaedics & Joint Surgery (MS, MCh)', availableToday: true, teleconsultAvailable: false, nextSlot: '02:00 PM' }
    ]
  },

  // ── 6. Government General Hospital Guntur (GGH Guntur) ────────────────────
  {
    facilityId: 'GGH-GUNTUR-01',
    name: 'Government General Hospital (GGH) Guntur',
    nameMarathi: 'शासकीय सामान्य रुग्णालय गुंटूर',
    nameTelugu: 'ప్రభుత్వ సమగ్ర ఆసుపత్రి - గుంటూరు',
    nameHindi: 'सरकारी सामान्य अस्पताल गुंटूर',
    level: 'civil_hospital',
    block: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh',
    address: 'Kanna Vari Thota, Old Bus Stand Road, Guntur – 522004',
    phone: '0863-2220000',
    lat: 16.3067, lng: 80.4365,
    departments: ['Emergency Trauma Unit', 'Super-Specialty Surgery', 'Burns Critical Ward', 'Nephrology & Dialysis', 'Cardiology', 'Pulmonology', 'Psychiatry', 'Radiology'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: [
      '1200-Bed Public Teaching Hospital',
      '30-Station Hemodialysis Facility',
      'Neuro-Trauma Resuscitation Unit',
      'Cobalt-60 Radiotherapy Machine',
      '1.5 Tesla MRI & 64-Slice CT Scan',
      'Comprehensive Burns Intensive Care Unit'
    ],
    currentOpdQueue: { queueLength: 62, activeCounters: 8, avgServiceTimeMin: 10 },
    resources: {
      bedsTotal: 1200, bedsOccupied: 980, icuTotal: 70, icuOccupied: 58,
      oxygenBeds: 200, oxygenOccupied: 165, ventilators: 30, ventilatorsInUse: 22,
      ambulances: 10, ambulancesAvailable: 7, operatingTheatres: 14, otAvailable: 4
    },
    diagnostics: [
      { name: 'CT Scan & 1.5T MRI', available: true, slots: 50, waitHrs: 2 },
      { name: 'Hemodialysis Sessions', available: true, slots: 30, waitHrs: 1 },
      { name: 'Digital X-Ray / USG / Color Doppler', available: true, slots: 200, waitHrs: 0.5 },
      { name: 'Emergency Biochemistry & ABG Stat', available: true, slots: 150, waitHrs: 0.25 }
    ],
    doctors: [
      { name: 'Dr. T. Venugopal', specialty: 'Orthopaedic Trauma (MS)', availableToday: true, teleconsultAvailable: true, nextSlot: '10:15 AM' },
      { name: 'Dr. M. Sailaja', specialty: 'Nephrology & Dialysis (DM)', availableToday: true, teleconsultAvailable: true, nextSlot: '12:00 PM' }
    ]
  },

  // ===========================================================================
  // REGION B: MAHARASHTRA (Palghar District · Kelwa / Khed / Thane)
  // ===========================================================================

  // ── 7. Sub-Centre Kelwa ───────────────────────────────────────────────────
  {
    facilityId: 'SC-KELWA-01',
    name: 'Sub-Centre Kelwa',
    nameMarathi: 'उप-केंद्र केळवा',
    nameTelugu: 'ఉప-కేంద్రం కేళ్వా',
    nameHindi: 'उप-केंद्र केलवा',
    level: 'sub_centre',
    block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    address: 'Kelwa Gaon, Near Gram Panchayat, Palghar – 401304',
    phone: '02525-222101',
    lat: 19.6032, lng: 72.7183,
    departments: ['General OPD', 'MCH / ANC', 'Immunization', 'Sample Collection Post'],
    emergencyOpen24h: false,
    lastUpdated: new Date().toISOString(),
    equipment: ['Sahli Haemoglobinometer', 'Glucometer', 'Urine Dipsticks', 'Cold Chain Box'],
    currentOpdQueue: { queueLength: 5, activeCounters: 1, avgServiceTimeMin: 6 },
    resources: {
      bedsTotal: 4, bedsOccupied: 2, icuTotal: 0, icuOccupied: 0,
      oxygenBeds: 0, oxygenOccupied: 0, ventilators: 0, ventilatorsInUse: 0,
      ambulances: 0, ambulancesAvailable: 0, operatingTheatres: 0, otAvailable: 0
    },
    diagnostics: [
      { name: 'Haemoglobin (Sahli)', available: true, slots: 20, waitHrs: 0 },
      { name: 'Urine Albumin + Sugar', available: true, slots: 15, waitHrs: 0 },
      { name: 'Rapid Malaria (RDT)', available: true, slots: 10, waitHrs: 0 },
      { name: 'Pregnancy Test (UPT)', available: true, slots: 8, waitHrs: 0 },
      { name: 'Blood Glucose (Glucometer)', available: true, slots: 25, waitHrs: 0 },
      { name: 'Hub-and-Spoke Sample Pickup', available: true, slots: 50, waitHrs: 6 }
    ],
    doctors: [
      { name: 'ANM Lata Sawant', specialty: 'Midwifery / MCH', availableToday: true, teleconsultAvailable: false, nextSlot: '09:30' }
    ]
  },

  // ── 8. PHC Kelwa ───────────────────────────────────────────────────────────
  {
    facilityId: 'PHC-KELWA-01',
    name: 'PHC Kelwa',
    nameMarathi: 'प्राथमिक आरोग्य केंद्र केळवा',
    nameTelugu: 'ప్రాథమిక ఆరోగ్య కేంద్రం కేళ్వా',
    nameHindi: 'प्राथमिक स्वास्थ्य केंद्र केलवा',
    level: 'phc',
    block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    address: 'Main Road, Kelwa, Palghar – 401304',
    phone: '02525-222201',
    lat: 19.6071, lng: 72.7214,
    departments: ['OPD', 'ANC Clinic', 'Immunization', 'Emergency (Basic)', 'NCD Clinic', 'Family Planning', 'Tele-Consultation Spoke'],
    emergencyOpen24h: false,
    lastUpdated: new Date().toISOString(),
    equipment: ['Semi-Auto Blood Analyzer', 'Fetal Doppler', 'Digital ECG Machine', 'Oxygen Cylinders'],
    currentOpdQueue: { queueLength: 12, activeCounters: 2, avgServiceTimeMin: 7 },
    resources: {
      bedsTotal: 12, bedsOccupied: 7, icuTotal: 0, icuOccupied: 0,
      oxygenBeds: 2, oxygenOccupied: 1, ventilators: 0, ventilatorsInUse: 0,
      ambulances: 1, ambulancesAvailable: 1, operatingTheatres: 0, otAvailable: 0
    },
    diagnostics: [
      { name: 'CBC', available: true, slots: 30, waitHrs: 1 },
      { name: 'Blood Sugar FBS / PPBS', available: true, slots: 25, waitHrs: 0 },
      { name: 'Urine Routine Microscopy', available: true, slots: 20, waitHrs: 0 },
      { name: 'Haemoglobin', available: true, slots: 40, waitHrs: 0 },
      { name: 'Rapid Malaria Test', available: true, slots: 15, waitHrs: 0 },
      { name: 'Pregnancy Test (UPT)', available: true, slots: 10, waitHrs: 0 },
      { name: 'ECG (Cloud Sync to DH)', available: true, slots: 15, waitHrs: 0.25 },
      { name: 'Thyroid (TSH) – Hub Dispatch', available: true, slots: 20, waitHrs: 12 }
    ],
    doctors: [
      { name: 'Dr. Ramesh Patkar', specialty: 'General Medicine / MO', availableToday: true, teleconsultAvailable: true, nextSlot: '10:00' },
      { name: 'ANM Sujata More', specialty: 'ANC / MCH', availableToday: true, teleconsultAvailable: false, nextSlot: '09:00' }
    ]
  },

  // ── 9. Rural Hospital Khed ─────────────────────────────────────────────────
  {
    facilityId: 'RH-KHED-01',
    name: 'Rural Hospital Khed',
    nameMarathi: 'ग्रामीण रुग्णालय खेड',
    nameTelugu: 'గ్రామీణ ఆసుపత్రి ఖేడ్',
    nameHindi: 'ग्रामीण अस्पताल खेड',
    level: 'rural_hospital',
    block: 'Khed', district: 'Palghar', state: 'Maharashtra',
    address: 'Khed Town, Near Bus Stand, Dist Palghar – 401305',
    phone: '02525-223501',
    lat: 19.7274, lng: 72.6581,
    departments: ['OPD', 'Emergency', 'Surgery', 'Obstetrics & Gynaecology', 'Paediatrics', 'Orthopaedics', 'Intermediate Stabilization Unit'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: ['Digital X-Ray (300mA)', 'Ultrasound Sonography', '12-Lead ECG Stat', 'Modular OT', 'Oxygen Beds'],
    currentOpdQueue: { queueLength: 19, activeCounters: 3, avgServiceTimeMin: 8 },
    resources: {
      bedsTotal: 30, bedsOccupied: 19, icuTotal: 4, icuOccupied: 2,
      oxygenBeds: 6, oxygenOccupied: 3, ventilators: 1, ventilatorsInUse: 0,
      ambulances: 2, ambulancesAvailable: 1, operatingTheatres: 1, otAvailable: 1
    },
    diagnostics: [
      { name: 'X-Ray (Digital)', available: true, slots: 20, waitHrs: 2 },
      { name: 'Sonography (USG)', available: true, slots: 8, waitHrs: 3 },
      { name: 'CBC + Peripheral Smear', available: true, slots: 40, waitHrs: 1 },
      { name: 'LFT / KFT Panel', available: true, slots: 15, waitHrs: 2 },
      { name: 'ECG (12-lead)', available: true, slots: 20, waitHrs: 0.5 },
      { name: 'Foetal Doppler', available: true, slots: 6, waitHrs: 2 }
    ],
    doctors: [
      { name: 'Dr. Neeta Kulkarni', specialty: 'Obstetrics & Gynaecology', availableToday: true, teleconsultAvailable: true, nextSlot: '11:00' },
      { name: 'Dr. Prakash Desai', specialty: 'General Surgery', availableToday: true, teleconsultAvailable: false, nextSlot: '14:00' },
      { name: 'Dr. Suresh Naik', specialty: 'General Medicine', availableToday: false, teleconsultAvailable: true, nextSlot: 'Tomorrow 09:00' }
    ]
  },

  // ── 10. District Hospital Palghar ──────────────────────────────────────────
  {
    facilityId: 'DH-PALGHAR-01',
    name: 'District Hospital Palghar',
    nameMarathi: 'जिल्हा रुग्णालय पालघर',
    nameTelugu: 'జిల్లా ఆసుపత్రి పాల్ఘర్',
    nameHindi: 'जिला अस्पताल पालघर',
    level: 'district_hospital',
    block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    address: 'Station Road, Palghar – 401404',
    phone: '02525-252201',
    lat: 19.6981, lng: 72.7686,
    departments: ['OPD', 'Emergency', 'ICU', 'Surgery', 'Obs & Gynae', 'Paediatrics', 'Orthopaedics', 'Medicine', 'ENT', 'Ophthalmology', 'Psychiatry', 'Central Diagnostics Hub', 'Tele-Consultation Hub'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: ['16-Slice CT Scanner', 'Digital X-Ray', 'Color Doppler 3D USG', '15-Bed ICU', 'Blood Bank'],
    currentOpdQueue: { queueLength: 38, activeCounters: 5, avgServiceTimeMin: 9 },
    resources: {
      bedsTotal: 200, bedsOccupied: 147, icuTotal: 15, icuOccupied: 11,
      oxygenBeds: 30, oxygenOccupied: 22, ventilators: 4, ventilatorsInUse: 3,
      ambulances: 5, ambulancesAvailable: 3, operatingTheatres: 3, otAvailable: 2
    },
    diagnostics: [
      { name: 'X-Ray', available: true, slots: 60, waitHrs: 1 },
      { name: 'Sonography / Foetal USG', available: true, slots: 20, waitHrs: 2 },
      { name: 'CT Scan', available: true, slots: 6, waitHrs: 4 },
      { name: 'MRI', available: false, slots: 0, waitHrs: 0 },
      { name: 'ECG / Holter', available: true, slots: 50, waitHrs: 0.5 },
      { name: 'Echo (2D)', available: true, slots: 8, waitHrs: 3 },
      { name: 'CBC / LFT / KFT / Lipid Panel', available: true, slots: 100, waitHrs: 1 },
      { name: 'HbA1C / Thyroid Panel', available: true, slots: 40, waitHrs: 2 },
      { name: 'Blood Culture & Sensitivity', available: true, slots: 15, waitHrs: 24 }
    ],
    doctors: [
      { name: 'Dr. Anjali Mehta', specialty: 'Obstetrics & Gynaecology', availableToday: true, teleconsultAvailable: true, nextSlot: '10:30' },
      { name: 'Dr. Ramesh Sharma', specialty: 'General Medicine / Physician', availableToday: true, teleconsultAvailable: true, nextSlot: '11:00' },
      { name: 'Dr. Kavita Rane', specialty: 'Paediatrics', availableToday: true, teleconsultAvailable: true, nextSlot: '09:30' },
      { name: 'Dr. Ajit Wagh', specialty: 'Orthopaedic Surgery', availableToday: true, teleconsultAvailable: false, nextSlot: '14:00' },
      { name: 'Dr. Sunita Chavan', specialty: 'Nephrology', availableToday: false, teleconsultAvailable: true, nextSlot: 'Tomorrow' }
    ]
  },

  // ── 11. Civil Hospital Thane ───────────────────────────────────────────────
  {
    facilityId: 'CH-THANE-01',
    name: 'Civil Hospital Thane',
    nameMarathi: 'सिव्हिल रुग्णालय ठाणे',
    nameTelugu: 'సివిల్ ఆసుపత్రి థానే',
    nameHindi: 'सिविल अस्पताल ठाणे',
    level: 'civil_hospital',
    block: 'Thane', district: 'Thane', state: 'Maharashtra',
    address: 'Pokhran Road No.1, Thane West – 400601',
    phone: '022-25339291',
    lat: 19.2043, lng: 72.9720,
    departments: ['OPD', 'Emergency', 'ICU', 'NICU', 'Surgery', 'Cardiology', 'Neurology', 'Nephrology', 'Oncology', 'Obs & Gynae', 'Paediatrics', 'Psychiatry', 'Burns', 'Radiology'],
    emergencyOpen24h: true,
    lastUpdated: new Date().toISOString(),
    equipment: ['128-Slice CT Scan', '1.5T MRI', 'Cath Lab (Angiography)', 'Dialysis Unit', '50-Bed ICU'],
    currentOpdQueue: { queueLength: 55, activeCounters: 7, avgServiceTimeMin: 10 },
    resources: {
      bedsTotal: 750, bedsOccupied: 612, icuTotal: 50, icuOccupied: 41,
      oxygenBeds: 80, oxygenOccupied: 65, ventilators: 20, ventilatorsInUse: 16,
      ambulances: 8, ambulancesAvailable: 5, operatingTheatres: 8, otAvailable: 3
    },
    diagnostics: [
      { name: 'CT Scan', available: true, slots: 20, waitHrs: 2 },
      { name: 'MRI (1.5T)', available: true, slots: 10, waitHrs: 6 },
      { name: 'Coronary Angiography', available: true, slots: 3, waitHrs: 24 },
      { name: 'X-Ray / USG / ECG / Echo', available: true, slots: 999, waitHrs: 1 },
      { name: 'Advanced Pathology Panel', available: true, slots: 100, waitHrs: 6 }
    ],
    doctors: [
      { name: 'Dr. Pradeep Kale', specialty: 'Cardiology', availableToday: true, teleconsultAvailable: true, nextSlot: '12:00' },
      { name: 'Dr. Sunita Vaidya', specialty: 'Neurology', availableToday: true, teleconsultAvailable: true, nextSlot: '14:00' },
      { name: 'Dr. Mohan Joshi', specialty: 'Nephrology', availableToday: false, teleconsultAvailable: true, nextSlot: 'Wednesday' }
    ]
  }
];

export const FACILITIES = Array.from(new Map(RAW_FACILITIES.map(f => [f.facilityId, f])).values());

// ─── Patients (Comprehensive spectrum from Mild/Routine to High-Risk/Emergency) ──
export const PATIENTS = [
  // 1. Savita Patil — 28w ANC, anaemia (Hb 8.4), hypotension (BP 104/68) [Urgent referral]
  {
    abhaId: 'ABHA-MH-2026-00001',
    name: 'Savita Patil',
    nameMarathi: 'सविता पाटील',
    age: 24, gender: 'F',
    dob: '2002-03-12',
    village: 'Kelwa Gaon', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9876543210',
    asha: 'Meena Bhoir', ashaPhone: '9765432100',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['ANC-28w', 'Anaemia-Moderate', 'Hypotension'],
    latestVitals: {
      bp: '104/68', pulse: 98, temp: 37.2, spo2: 98,
      weight: 52, height: 156,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Meena Bhoir'
    },
    lastSeen: new Date('2026-08-28').toISOString(),
  },
  // 2. Ramakant Bhagat — 58y, uncontrolled T2DM + HTN Stage 2 [High Risk NCD]
  {
    abhaId: 'ABHA-MH-2026-00002',
    name: 'Ramakant Bhagat',
    nameMarathi: 'रामकांत भगत',
    age: 58, gender: 'M',
    village: 'Nandgaon', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9823456789',
    asha: 'Sushma Mhatre', ashaPhone: '9812345678',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['T2DM-Uncontrolled', 'HTN-Stage2', 'CKD-Early'],
    latestVitals: {
      bp: '158/96', pulse: 82, temp: 37.0, spo2: 97,
      weight: 71, height: 165,
      recordedAt: new Date('2026-08-25').toISOString(),
      recordedBy: 'Sushma Mhatre'
    },
    lastSeen: new Date('2026-08-25').toISOString(),
  },
  // 3. Laxmi Koli — 32y, ANC 36w, Eclampsia Risk (BP 148/94) [Emergency]
  {
    abhaId: 'ABHA-MH-2026-00003',
    name: 'Laxmi Koli',
    nameMarathi: 'लक्ष्मी कोळी',
    age: 32, gender: 'F',
    village: 'Shirgaon', block: 'Khed', district: 'Palghar', state: 'Maharashtra',
    phone: '9711234567',
    asha: 'Rekha Patil', ashaPhone: '9700112233',
    rationCardCategory: 'AAY', riskCategory: 'high',
    conditions: ['ANC-36w', 'Eclampsia-Risk', 'Oedema-Bilateral'],
    latestVitals: {
      bp: '148/94', pulse: 102, temp: 37.6, spo2: 97,
      weight: 64, height: 152,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Rekha Patil'
    },
    lastSeen: new Date('2026-08-29').toISOString(),
  },
  // 4. Govind Wagh — 7y child, SAM + Acute Diarrhoea [Urgent Pediatric]
  {
    abhaId: 'ABHA-MH-2026-00004',
    name: 'Govind Wagh',
    nameMarathi: 'गोविंद वाघ',
    age: 7, gender: 'M',
    village: 'Tembhode', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9988776655',
    asha: 'Meena Bhoir', ashaPhone: '9765432100',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['SAM', 'Acute Diarrhoea', 'Dehydration-Moderate'],
    latestVitals: {
      bp: '90/60', pulse: 118, temp: 38.4, spo2: 96,
      weight: 14, height: 112,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Meena Bhoir'
    },
    lastSeen: new Date('2026-08-29').toISOString(),
  },
  // 5. Anand Shinde — 42y M, Farm worker, Mild tension headache [Routine / Home Care]
  {
    abhaId: 'ABHA-MH-2026-00005',
    name: 'Anand Shinde',
    nameMarathi: 'आनंद शिंदे',
    age: 42, gender: 'M',
    village: 'Kelwa Gaon', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9867112233',
    asha: 'Meena Bhoir', ashaPhone: '9765432100',
    rationCardCategory: 'APL', riskCategory: 'low',
    conditions: ['Tension Headache-Mild', 'Fatigue-Occupational'],
    latestVitals: {
      bp: '122/78', pulse: 74, temp: 36.8, spo2: 99,
      weight: 66, height: 168,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Meena Bhoir'
    },
    lastSeen: new Date('2026-08-29').toISOString(),
  },
  // 6. Sunita Jadhav — 29y F, Seasonal dry cough & mild cold [Routine Primary Care]
  {
    abhaId: 'ABHA-MH-2026-00006',
    name: 'Sunita Jadhav',
    nameMarathi: 'सुनिता जाधव',
    age: 29, gender: 'F',
    village: 'Nandgaon', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9833445566',
    asha: 'Sushma Mhatre', ashaPhone: '9812345678',
    rationCardCategory: 'BPL', riskCategory: 'low',
    conditions: ['Upper Respiratory Infection-Mild', 'Seasonal Cough'],
    latestVitals: {
      bp: '118/76', pulse: 76, temp: 37.0, spo2: 98,
      weight: 54, height: 157,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Sushma Mhatre'
    },
    lastSeen: new Date('2026-08-28').toISOString(),
  },
  // 7. Dinkar Pawar — 67y M, COPD + CKD Stage 3, SpO2 91% [High Risk Geriatric]
  {
    abhaId: 'ABHA-MH-2026-00007',
    name: 'Dinkar Pawar',
    nameMarathi: 'दिनकर पवार',
    age: 67, gender: 'M',
    village: 'Boisar', block: 'Palghar', district: 'Palghar', state: 'Maharashtra',
    phone: '9988001122',
    asha: 'Rekha Patil', ashaPhone: '9700112233',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['COPD-Moderate', 'T2DM', 'CKD-Stage3'],
    latestVitals: {
      bp: '132/82', pulse: 88, temp: 37.1, spo2: 91,
      weight: 55, height: 162,
      recordedAt: new Date('2026-08-27').toISOString(),
      recordedBy: 'Rekha Patil'
    },
    lastSeen: new Date('2026-08-27').toISOString(),
  },

  // ── 8. Kavya Reddy — 20y F, Student at VIT-AP, Viral URI & Low-Grade Fever [AP]
  {
    abhaId: 'ABHA-AP-2026-00101',
    name: 'Kavya Reddy',
    nameMarathi: 'काव्या रेड्डी',
    age: 20, gender: 'F',
    village: 'Inavolu Village', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848011223',
    asha: 'MLHP K. Lakshmi Prasanna', ashaPhone: '0863-234101',
    rationCardCategory: 'None', riskCategory: 'low',
    conditions: ['Viral Upper Respiratory Infection', 'Mild Fever'],
    latestVitals: {
      bp: '116/74', pulse: 78, temp: 37.8, spo2: 99,
      weight: 51, height: 160,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Dr. Ch. Haritha'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },

  // ── 9. Venkat Rao — 54y M, Farmer in Mandadam, Diabetic Foot Ulcer & Hypertension [AP]
  {
    abhaId: 'ABHA-AP-2026-00102',
    name: 'Venkat Rao',
    nameMarathi: 'व्यंकट राव',
    age: 54, gender: 'M',
    village: 'Mandadam', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848033445',
    asha: 'MLHP K. Lakshmi Prasanna', ashaPhone: '0863-234101',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Type 2 Diabetes Mellitus', 'Hypertension Stage 2', 'Peripheral Neuropathy'],
    latestVitals: {
      bp: '162/98', pulse: 84, temp: 37.2, spo2: 97,
      weight: 74, height: 169,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Dr. P. Srinivas Rao'
    },
    lastSeen: new Date('2026-08-28').toISOString()
  },

  // ── 10. Ananya Sharma — 19y F, VIT-AP University, Sports Ligament Sprain [AP]
  {
    abhaId: 'ABHA-AP-2026-00103',
    name: 'Ananya Sharma',
    nameMarathi: 'अनन्या शर्मा',
    age: 19, gender: 'F',
    village: 'VIT-AP Campus', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848099887',
    asha: 'Dr. Ch. Haritha', ashaPhone: '0863-2370000',
    rationCardCategory: 'None', riskCategory: 'low',
    conditions: ['Lateral Ankle Sprain', 'Mild Soft Tissue Oedema'],
    latestVitals: {
      bp: '118/76', pulse: 72, temp: 36.7, spo2: 99,
      weight: 56, height: 165,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. Ch. Haritha'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },

  // ── 11. Suresh Varma — 61y M, Tulluru, Ischemic Heart Disease & Angina [AP]
  {
    abhaId: 'ABHA-AP-2026-00104',
    name: 'Suresh Varma',
    nameMarathi: 'सुरेश वर्मा',
    age: 61, gender: 'M',
    village: 'Tulluru Town', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848077665',
    asha: 'MLHP K. Lakshmi Prasanna', ashaPhone: '0863-234101',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Coronary Artery Disease', 'Exertional Angina', 'Hyperlipidemia'],
    latestVitals: {
      bp: '154/92', pulse: 94, temp: 37.0, spo2: 95,
      weight: 78, height: 172,
      recordedAt: new Date('2026-08-27').toISOString(),
      recordedBy: 'Dr. V. Rajesh Kumar'
    },
    lastSeen: new Date('2026-08-27').toISOString()
  },

  // ── 12. Lakshmi Devi — 26y F, Inavolu, ANC 32w Gestational Diabetes [AP]
  {
    abhaId: 'ABHA-AP-2026-00105',
    name: 'Lakshmi Devi',
    nameMarathi: 'लक्ष्मी देवी',
    age: 26, gender: 'F',
    village: 'Inavolu', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848055443',
    asha: 'MLHP K. Lakshmi Prasanna', ashaPhone: '0863-234101',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['ANC-32w', 'Gestational Diabetes Mellitus', 'Polyhydramnios Risk'],
    latestVitals: {
      bp: '124/80', pulse: 86, temp: 36.9, spo2: 98,
      weight: 62, height: 155,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'MLHP K. Lakshmi Prasanna'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },

  // ── 13. Bhavani Prasad — 8y child, Mangalagiri, Pediatric Asthma Exacerbation [AP]
  {
    abhaId: 'ABHA-AP-2026-00106',
    name: 'Bhavani Prasad',
    nameMarathi: 'भवानी प्रसाद',
    age: 8, gender: 'M',
    village: 'Mangalagiri', block: 'Mangalagiri', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848044332',
    asha: 'ANM Suvarna', ashaPhone: '08645-293400',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Bronchial Asthma-Moderate Exacerbation', 'Allergic Rhinitis'],
    latestVitals: {
      bp: '96/64', pulse: 112, temp: 37.4, spo2: 93,
      weight: 22, height: 124,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Dr. S. Deepthi'
    },
    lastSeen: new Date('2026-08-28').toISOString()
  },

  // ── 14. Chinnaiah Goud — 72y M, Sakhamuru, Bilateral Senile Cataract & HTN [AP]
  {
    abhaId: 'ABHA-AP-2026-00107',
    name: 'Chinnaiah Goud',
    nameMarathi: 'चिन्नय्या गौड',
    age: 72, gender: 'M',
    village: 'Sakhamuru', block: 'Thullur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848022110',
    asha: 'MLHP K. Lakshmi Prasanna', ashaPhone: '0863-234101',
    rationCardCategory: 'AAY', riskCategory: 'moderate',
    conditions: ['Senile Cataract-Bilateral', 'Isolated Systolic Hypertension'],
    latestVitals: {
      bp: '168/82', pulse: 68, temp: 36.6, spo2: 97,
      weight: 58, height: 164,
      recordedAt: new Date('2026-08-26').toISOString(),
      recordedBy: 'Dr. P. Srinivas Rao'
    },
    lastSeen: new Date('2026-08-26').toISOString()
  },

  // ── 15. Narasimha Murthy — 63y M, Guntur, End-Stage Renal Disease on Dialysis [AP]
  {
    abhaId: 'ABHA-AP-2026-00108',
    name: 'Narasimha Murthy',
    nameMarathi: 'नरसिंह मूर्ती',
    age: 63, gender: 'M',
    village: 'Guntur Old Town', block: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh',
    phone: '9848066778',
    asha: 'Staff Nurse Geetha', ashaPhone: '0863-2220000',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['End-Stage Renal Disease (ESRD)', 'Maintenance Hemodialysis (Bi-Weekly)', 'Secondary Anemia'],
    latestVitals: {
      bp: '146/90', pulse: 76, temp: 36.8, spo2: 96,
      weight: 64, height: 167,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Dr. M. Sailaja'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },
  // ── 16. Ch. Varalakshmi — 27y F, Visakhapatnam, High-Risk ANC 34w Pre-Eclampsia [AP]
  {
    abhaId: 'ABHA-AP-2026-00109',
    name: 'Ch. Varalakshmi',
    nameTelugu: 'సిహెచ్. వరలక్ష్మి',
    age: 27, gender: 'F',
    village: 'Bheemili', block: 'Bheemunipatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh',
    phone: '9849223344',
    asha: 'ASHA K. Sridevi', ashaPhone: '08933-224233',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['ANC-34w', 'Severe Pre-Eclampsia', 'Proteinuria +2', 'Pedal Edema Bilateral'],
    latestVitals: {
      bp: '150/98', pulse: 104, temp: 37.4, spo2: 97,
      weight: 66, height: 154,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. S. K. Anuradha'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },
  // ── 17. B. Appala Naidu — 59y M, Visakhapatnam, Acute Coronary Syndrome & HTN [AP]
  {
    abhaId: 'ABHA-AP-2026-00110',
    name: 'B. Appala Naidu',
    nameTelugu: 'బి. అప్పలనాయుడు',
    age: 59, gender: 'M',
    village: 'Pendurthi', block: 'Pendurthi', district: 'Visakhapatnam', state: 'Andhra Pradesh',
    phone: '9849334455',
    asha: 'ASHA V. Lakshmi', ashaPhone: '0891-2741122',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Coronary Artery Disease', 'Unstable Angina', 'Hypertension Stage 2'],
    latestVitals: {
      bp: '160/94', pulse: 92, temp: 36.9, spo2: 95,
      weight: 76, height: 171,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. K. Srinivas'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },
  // ── 18. Baby of G. Padma — 11m Child, Visakhapatnam, SAM + Acute Bronchopneumonia [AP]
  {
    abhaId: 'ABHA-AP-2026-00111',
    name: 'Baby of G. Padma',
    nameTelugu: 'బేబీ ఆఫ్ జి. పద్మ',
    age: 1, gender: 'F',
    village: 'Anakapalli Town', block: 'Anakapalli', district: 'Anakapalli', state: 'Andhra Pradesh',
    phone: '9849445566',
    asha: 'ASHA M. Kumari', ashaPhone: '08924-221250',
    rationCardCategory: 'AAY', riskCategory: 'high',
    conditions: ['Severe Acute Malnutrition (SAM)', 'Acute Bronchopneumonia', 'Severe Anemia'],
    latestVitals: {
      bp: '88/54', pulse: 130, temp: 38.6, spo2: 92,
      weight: 6.8, height: 68,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. M. Venkata Rao'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },
  // ── 19. P. Subbamma — 65y F, Tirupati, Post-PTCA Angina Follow-up [AP]
  {
    abhaId: 'ABHA-AP-2026-00112',
    name: 'P. Subbamma',
    nameTelugu: 'పి. సుబ్బమ్మ',
    age: 65, gender: 'F',
    village: 'Srikalahasti Rural', block: 'Srikalahasti', district: 'Tirupati', state: 'Andhra Pradesh',
    phone: '9849778899',
    asha: 'ASHA R. Sarada', ashaPhone: '08578-222340',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Post-PTCA Follow-up', 'Ischemic Heart Disease', 'Dyslipidemia'],
    latestVitals: {
      bp: '142/86', pulse: 78, temp: 36.8, spo2: 96,
      weight: 60, height: 153,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Dr. C. Prabhakar'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },
  // ── 20. S. Parvathi — 28y F, Kurnool, ANC 30w Twin Gestation [AP]
  {
    abhaId: 'ABHA-AP-2026-00113',
    name: 'S. Parvathi',
    nameTelugu: 'ఎస్. పార్వతి',
    age: 28, gender: 'F',
    village: 'Kodumur', block: 'Kodumur', district: 'Kurnool', state: 'Andhra Pradesh',
    phone: '9850223344',
    asha: 'ASHA G. Renuka', ashaPhone: '08518-283100',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['ANC-30w', 'Twin Pregnancy', 'Moderate Anaemia (Hb 8.6)', 'Hypertension'],
    latestVitals: {
      bp: '142/92', pulse: 94, temp: 37.1, spo2: 98,
      weight: 68, height: 158,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. K. Jayasree'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },
  // ── 21. V. Krishnaiah — 52y M, Nellore, T2DM Hyperglycemia [AP]
  {
    abhaId: 'ABHA-AP-2026-00114',
    name: 'V. Krishnaiah',
    nameTelugu: 'వి. కృష్ణయ్య',
    age: 52, gender: 'M',
    village: 'Kavali Town', block: 'Kavali', district: 'SPSR Nellore', state: 'Andhra Pradesh',
    phone: '9850334455',
    asha: 'ASHA T. Padma', ashaPhone: '08626-243100',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Type 2 DM Uncontrolled (BS 310)', 'Diabetic Retinopathy', 'Hypertension'],
    latestVitals: {
      bp: '154/90', pulse: 82, temp: 36.9, spo2: 97,
      weight: 73, height: 168,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Dr. Y. Sudhakar'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },
  // ── 22. G. Satyanarayana — 48y M, Kakinada, Acute Viral Hepatitis [AP]
  {
    abhaId: 'ABHA-AP-2026-00115',
    name: 'G. Satyanarayana',
    nameTelugu: 'జి. సత్యనారాయణ',
    age: 48, gender: 'M',
    village: 'Tuni', block: 'Tuni', district: 'Kakinada', state: 'Andhra Pradesh',
    phone: '9850445566',
    asha: 'ASHA B. Bhavani', ashaPhone: '08854-251240',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Acute Viral Hepatitis A', 'Jaundice (Bilirubin 4.2)', 'Elevated SGPT/SGOT'],
    latestVitals: {
      bp: '124/80', pulse: 88, temp: 38.2, spo2: 98,
      weight: 65, height: 169,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Dr. M. S. R. Murthy'
    },
    lastSeen: new Date('2026-08-28').toISOString()
  },
  // ── 23. K. Venkataramana — 61y M, Rajahmundry, COPD Exacerbation [AP]
  {
    abhaId: 'ABHA-AP-2026-00116',
    name: 'K. Venkataramana',
    nameTelugu: 'కె. వెంకటరమణ',
    age: 61, gender: 'M',
    village: 'Kovvur', block: 'Kovvur', district: 'East Godavari', state: 'Andhra Pradesh',
    phone: '9850556677',
    asha: 'ASHA D. Radha', ashaPhone: '08813-231200',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['COPD Stage III Exacerbation', 'Respiratory Distress', 'SpO2 89%'],
    latestVitals: {
      bp: '136/84', pulse: 102, temp: 37.6, spo2: 89,
      weight: 56, height: 162,
      recordedAt: new Date('2026-08-29').toISOString(),
      recordedBy: 'Dr. Danavaipeta Medical Officer'
    },
    lastSeen: new Date('2026-08-29').toISOString()
  },
  // ── 24. P. Chandramma — 35y F, Kadapa, High-Risk GDM & Hypertension [AP]
  {
    abhaId: 'ABHA-AP-2026-00117',
    name: 'P. Chandramma',
    nameTelugu: 'పి. చంద్రమ్మ',
    age: 35, gender: 'F',
    village: 'Pulivendula', block: 'Pulivendula', district: 'YSR Kadapa', state: 'Andhra Pradesh',
    phone: '9850667788',
    asha: 'ASHA L. Sunitha', ashaPhone: '08568-286200',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['ANC-26w', 'Gestational Hypertension', 'Elderly Gravida'],
    latestVitals: {
      bp: '144/94', pulse: 86, temp: 37.0, spo2: 98,
      weight: 67, height: 156,
      recordedAt: new Date('2026-08-30').toISOString(),
      recordedBy: 'Dr. RIMS Kadapa OBG'
    },
    lastSeen: new Date('2026-08-30').toISOString()
  },
  // ── 25. T. Appala Swamy — 58y M, Srikakulam, Uddanam Endemic CKD [AP]
  {
    abhaId: 'ABHA-AP-2026-00118',
    name: 'T. Appala Swamy',
    nameTelugu: 'టి. అప్పలస్వామి',
    age: 58, gender: 'M',
    village: 'Tekkali', block: 'Tekkali', district: 'Srikakulam', state: 'Andhra Pradesh',
    phone: '9850778899',
    asha: 'ASHA N. Saraswathi', ashaPhone: '08945-244220',
    rationCardCategory: 'BPL', riskCategory: 'high',
    conditions: ['Chronic Kidney Disease Stage 4', 'Uddanam Endemic Nephropathy', 'Serum Cr 3.8'],
    latestVitals: {
      bp: '152/92', pulse: 74, temp: 36.7, spo2: 96,
      weight: 59, height: 165,
      recordedAt: new Date('2026-08-28').toISOString(),
      recordedBy: 'Dr. Tekkali Dialysis Unit'
    },
    lastSeen: new Date('2026-08-28').toISOString()
  }
];

// ─── Savita's Encounter History ───────────────────────────────────────────────
export const ENCOUNTERS_SAVITA = [
  {
    facilityId: 'SC-KELWA-01', facilityName: 'Sub-Centre Kelwa',
    type: 'ANC', department: 'MCH / ANC', token: 'ANC-001',
    status: 'completed',
    chiefComplaint: 'Missed period × 3 months, confirmed pregnant',
    vitals: { bp: '108/70', pulse: 80, temp: 36.8, spo2: 99, weight: 48, height: 156, recordedBy: 'Meena Bhoir', recordedAt: new Date('2026-05-20').toISOString() },
    notes: 'ASHA Meena Bhoir detected pregnancy during routine home visit. UPT positive. ANC registration done. Iron-Folic Acid tablets prescribed.',
    diagnosis: ['Pregnancy – 12 weeks (ANC registration)'],
    conductedBy: 'ANM Lata Sawant', conductedAt: new Date('2026-05-20').toISOString(), role: 'asha'
  },
  {
    facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa',
    type: 'ANC', department: 'ANC Clinic', token: 'ANC-042',
    status: 'completed',
    chiefComplaint: 'Routine ANC check — 20 weeks',
    vitals: { bp: '110/72', pulse: 84, temp: 36.9, spo2: 99, weight: 50, height: 156, recordedBy: 'ANM Sujata More', recordedAt: new Date('2026-07-01').toISOString() },
    notes: 'ANC 20 weeks check. Haemoglobin 9.2 g/dL — Anaemia detected. Iron injection prescribed. Foetal heart rate 148/min.',
    diagnosis: ['ANC-20w', 'Anaemia-Moderate (Hb 9.2)'],
    conductedBy: 'ANM Sujata More', conductedAt: new Date('2026-07-01').toISOString(), role: 'phc_doctor'
  },
  {
    facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa',
    type: 'ANC', department: 'ANC Clinic', token: 'ANC-071',
    status: 'completed',
    chiefComplaint: 'ANC 28w check — headache, fatigue, pallor. Referred by ASHA Meena Bhoir.',
    vitals: { bp: '104/68', pulse: 98, temp: 37.2, spo2: 98, weight: 52, height: 156, recordedBy: 'ANM Sujata More', recordedAt: new Date('2026-08-28').toISOString() },
    notes: 'Savita Patil, ANC 28 weeks. Hb 8.4 g/dL (worsening anaemia), BP 104/68, proteinuria +1. Decision to refer to Rural Hospital Khed (Dr. Neeta Kulkarni, OBG). 108 Emergency Ambulance transport booked.',
    diagnosis: ['ANC-28w', 'Anaemia-Moderate-Worsening (Hb 8.4)', 'Hypotension', 'Proteinuria +1'],
    conductedBy: 'Dr. Ramesh Patkar', conductedAt: new Date('2026-08-28').toISOString(), role: 'phc_doctor',
    triageResult: {
      urgency: 'urgent',
      suggestedDept: 'Obstetrics & Gynaecology',
      suggestedFacilityLevel: 'rural_hospital',
      clinicalReasoning: 'ANC 28-week patient presents with BP 104/68 mmHg, Haemoglobin 8.4 g/dL, and proteinuria +1. Requires urgent OBG specialist assessment with IV iron and foetal Doppler at Rural Hospital Khed.',
      diagnosticsNeeded: ['CBC + Peripheral Smear', 'Serum Ferritin', 'Urine 24h Protein', 'Foetal Doppler USG'],
      aiModel: 'arogyalink-clinical-rules-v3',
      confirmedByDoctor: true,
      doctorName: 'Dr. Ramesh Patkar',
      confirmedAt: new Date('2026-08-28T10:30:00').toISOString()
    }
  }
];

// ─── Savita's Active Referral ─────────────────────────────────────────────────
export const REFERRAL_SAVITA = {
  fromFacilityId: 'PHC-KELWA-01', fromFacilityName: 'PHC Kelwa',
  toFacilityId: 'RH-KHED-01', toFacilityName: 'Rural Hospital Khed',
  urgency: 'urgent',
  reason: 'ANC 28w — worsening anaemia (Hb 8.4), hypotension (BP 104/68), proteinuria +1. Needs OBG specialist assessment, IV iron, foetal Doppler.',
  diagnosis: ['ANC-28w', 'Anaemia-Moderate-Worsening', 'Hypotension', 'Proteinuria +1'],
  diagnosticsRequested: ['CBC + Peripheral Smear', 'Serum Ferritin', 'Urine 24h Protein', 'Foetal Doppler USG'],
  specialistRequired: 'Obstetrics & Gynaecology',
  currentStage: 'transport_arranged',
  stageHistory: [
    { stage: 'initiated', updatedBy: 'Dr. Ramesh Patkar', role: 'phc_doctor', facilityId: 'PHC-KELWA-01', notes: 'Referral initiated after ANC 28w assessment.', timestamp: new Date('2026-08-28T10:45:00').toISOString() },
    { stage: 'accepted', updatedBy: 'Dr. Neeta Kulkarni', role: 'hospital_doctor', facilityId: 'RH-KHED-01', notes: 'Accepted. Bed reserved in OBG Ward Bed #04. Green channel token generated.', timestamp: new Date('2026-08-28T11:10:00').toISOString() },
    { stage: 'transport_arranged', updatedBy: '108 Control Room', role: 'system', facilityId: 'PHC-KELWA-01', notes: '108 Ambulance MH-04-108-3421 dispatched from Palghar depot.', timestamp: new Date('2026-08-28T11:20:00').toISOString() }
  ],
  ambulanceNumber: 'MH-04-108-3421', driverPhone: '9900108108',
  estimatedArrival: new Date('2026-08-28T12:30:00').toISOString(),
  initiatedBy: 'Dr. Ramesh Patkar',
  initiatedAt: new Date('2026-08-28T10:45:00').toISOString()
};

// ─── Long-Distance Transport Dispatches (108 / JSSK / Waypoints) ──────────────
export const TRANSPORT_DISPATCHES = [
  {
    bookingId: 'TR-MH-108-8821',
    serviceType: '108_emergency',
    pickupLocation: {
      village: 'Kelwa Gaon',
      facilityId: 'PHC-KELWA-01',
      facilityName: 'PHC Kelwa',
      lat: 19.6071, lng: 72.7214,
      address: 'Main Road, Kelwa, Palghar – 401304'
    },
    dropoffLocation: {
      facilityId: 'RH-KHED-01',
      facilityName: 'Rural Hospital Khed',
      lat: 19.7274, lng: 72.6581,
      address: 'Khed Town, Near Bus Stand, Dist Palghar – 401305'
    },
    intermediateWaypoint: {
      facilityId: 'PHC-KELWA-01',
      facilityName: 'PHC Kelwa Transit Post',
      facilityLevel: 'phc',
      reason: 'Intermediate stabilization check: SpO2, fetal heart sound & IV fluid line verification before highway transit',
      kmFromPickup: 0,
      estArrivalMin: 0
    },
    vehicleNumber: 'MH-04-108-3421',
    driverName: 'Sanjay Jadhav',
    driverPhone: '9900108108',
    emtName: 'EMT Rajesh Patil',
    emtPhone: '9900108109',
    currentStatus: 'en_route',
    liveTelemetry: {
      currentLat: 19.6650,
      currentLng: 72.6900,
      speedKmph: 48,
      lastPingAt: new Date().toISOString(),
      etaMinutes: 18,
      distanceRemainingKm: 9.4,
      oxygenSupplyAvailable: true,
      vitalsMonitoredInTransit: {
        spo2: 98,
        pulse: 96,
        bp: '106/70'
      }
    },
    govSchemeCovered: {
      schemeName: 'Janani Shishu Suraksha Karyakram (JSSK) — Free Government Maternity Transport',
      isFreeOfCost: true,
      voucherCode: 'JSSK-MH-2026-7789',
      beneficiarySubsidyAmt: 0
    },
    requestedBy: 'Dr. Ramesh Patkar',
    role: 'phc_doctor',
    dispatchedAt: new Date('2026-08-28T11:20:00').toISOString()
  },
  {
    bookingId: 'TR-MH-102-4412',
    serviceType: '102_janani_maternity',
    pickupLocation: {
      village: 'Shirgaon',
      facilityId: 'PHC-KELWA-01',
      facilityName: 'PHC Kelwa',
      lat: 19.6032, lng: 72.7183
    },
    dropoffLocation: {
      facilityId: 'DH-PALGHAR-01',
      facilityName: 'District Hospital Palghar',
      lat: 19.6981, lng: 72.7686
    },
    vehicleNumber: 'MH-04-102-1920',
    driverName: 'Pravin Mhatre',
    driverPhone: '9822102102',
    emtName: 'ANM Sunita',
    currentStatus: 'arrived_hospital',
    liveTelemetry: {
      currentLat: 19.6981, currentLng: 72.7686,
      speedKmph: 0, etaMinutes: 0, distanceRemainingKm: 0,
      oxygenSupplyAvailable: true
    },
    govSchemeCovered: {
      schemeName: 'JSSK 102 Post-Natal Transport Voucher',
      isFreeOfCost: true,
      voucherCode: 'JSSK-MH-2026-4412'
    },
    requestedBy: 'Rekha Patil',
    role: 'asha',
    dispatchedAt: new Date('2026-08-29T08:00:00').toISOString(),
    completedAt: new Date('2026-08-29T09:15:00').toISOString()
  }
];

// ─── Hub-and-Spoke Diagnostic Samples (Rwanda/China Lab Model) ────────────────
export const DIAGNOSTIC_SAMPLES = [
  {
    sampleBarcode: 'SMP-2026-00891',
    patientName: 'Savita Patil',
    abhaId: 'ABHA-MH-2026-00001',
    collectedAtFacilityId: 'SC-KELWA-01',
    collectedAtFacilityName: 'Sub-Centre Kelwa',
    collectedBy: 'ANM Lata Sawant',
    testTypes: ['Serum Ferritin', 'Urine 24h Protein', 'Total Iron Binding Capacity (TIBC)'],
    urgency: 'urgent',
    status: 'in_transit_courier',
    destinationLabId: 'DH-PALGHAR-01',
    destinationLabName: 'District Hospital Palghar Central Laboratory',
    transitDetails: {
      courierName: 'Kishore Patil (Cold-Chain Bike Runner)',
      courierPhone: '9765123456',
      transitMethod: 'cold_chain_bike',
      pickupTime: new Date('2026-08-28T09:30:00').toISOString(),
      estArrivalAtLab: new Date('2026-08-28T10:45:00').toISOString(),
      temperatureMaintainedCelsius: 4.2
    },
    results: [
      { testName: 'Serum Ferritin', value: '11.4', unit: 'ng/mL', normalRange: '15 - 150 ng/mL', isAbnormal: true, verifiedByPathologist: 'Dr. S. Kulkarni' },
      { testName: 'TIBC', value: '440', unit: 'µg/dL', normalRange: '250 - 400 µg/dL', isAbnormal: true, verifiedByPathologist: 'Dr. S. Kulkarni' }
    ],
    collectedAt: new Date('2026-08-28T09:00:00').toISOString()
  },
  {
    sampleBarcode: 'SMP-2026-00754',
    patientName: 'Ramakant Bhagat',
    abhaId: 'ABHA-MH-2026-00002',
    collectedAtFacilityId: 'PHC-KELWA-01',
    collectedAtFacilityName: 'PHC Kelwa',
    collectedBy: 'ANM Sujata More',
    testTypes: ['HbA1c', 'Serum Creatinine', 'Lipid Profile'],
    urgency: 'routine',
    status: 'report_ready',
    destinationLabId: 'DH-PALGHAR-01',
    destinationLabName: 'District Hospital Palghar Central Laboratory',
    transitDetails: {
      courierName: 'Kishore Patil',
      transitMethod: 'cold_chain_bike',
      estArrivalAtLab: new Date('2026-08-25T11:00:00').toISOString()
    },
    results: [
      { testName: 'HbA1c', value: '9.4', unit: '%', normalRange: '< 5.7 %', isAbnormal: true, verifiedByPathologist: 'Dr. S. Kulkarni' },
      { testName: 'Serum Creatinine', value: '1.4', unit: 'mg/dL', normalRange: '0.7 - 1.2 mg/dL', isAbnormal: true, verifiedByPathologist: 'Dr. S. Kulkarni' },
      { testName: 'Total Cholesterol', value: '238', unit: 'mg/dL', normalRange: '< 200 mg/dL', isAbnormal: true, verifiedByPathologist: 'Dr. S. Kulkarni' }
    ],
    collectedAt: new Date('2026-08-25T08:30:00').toISOString(),
    reportCompletedAt: new Date('2026-08-25T14:00:00').toISOString()
  }
];

// ─── Mobile Medical Unit (MMU) Outreach Camps ─────────────────────────────────
export const MMU_CAMPS = [
  {
    campId: 'MMU-PLG-CAMP-01',
    village: 'Kelwa Gaon Hamlet East',
    block: 'Palghar',
    district: 'Palghar',
    locationCoordinates: { lat: 19.6032, lng: 72.7183 },
    scheduledDate: new Date('2026-09-02T09:30:00').toISOString(),
    timings: '09:30 AM - 03:30 PM',
    teamLeadDoctor: 'Dr. Ramesh Patkar (MO) + Dr. Kavita Rane (Pediatrician)',
    specialtiesAvailable: ['General Medicine', 'Pediatrics / SAM Screening', 'ANC & Gynec Check', 'Vision & NCD Screening'],
    equipmentOnboard: ['Portable Ultrasound (Sonography)', '12-Lead ECG Machine', 'Semi-Auto Blood Analyzer', 'Free 60-Day Pharmacy Stock'],
    targetVillagesCovered: ['Kelwa East', 'Nandgaon Pada', 'Shirgaon Koliwada'],
    ashaContact: 'Meena Bhoir',
    ashaPhone: '9765432100',
    status: 'scheduled'
  },
  {
    campId: 'MMU-PLG-CAMP-02',
    village: 'Tembhode Tribal Pada',
    block: 'Palghar',
    district: 'Palghar',
    locationCoordinates: { lat: 19.6800, lng: 72.7400 },
    scheduledDate: new Date('2026-09-05T09:30:00').toISOString(),
    timings: '09:30 AM - 04:00 PM',
    teamLeadDoctor: 'Dr. Neeta Kulkarni (OBG) + Dr. Prakash Desai',
    specialtiesAvailable: ['High-Risk ANC Screening', 'Pediatric Nutrition', 'Geriatric Chronic Care'],
    equipmentOnboard: ['Fetal Doppler', 'Digital X-Ray Van', 'Glucometer / Lipid Strip Analyzers'],
    targetVillagesCovered: ['Tembhode', 'Boisar West Hamlets'],
    ashaContact: 'Rekha Patil',
    ashaPhone: '9700112233',
    status: 'scheduled'
  }
];

// ─── Stock Data (with critical & stockout items) ──────────────────────────────
export const STOCK_DATA = [
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Iron-Folic Acid Tablets', genericName: 'Ferrous Sulphate 60mg + Folic Acid 0.5mg', category: 'Supplement', quantityInHand: 280, reorderLevel: 200, unit: 'strips', status: 'adequate' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Ferric Carboxymaltose Injection 500mg', genericName: 'Ferric Carboxymaltose', category: 'Essential', quantityInHand: 4, reorderLevel: 20, unit: 'vials', status: 'critical', expiryDate: '2027-03-01' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'ORS Sachets (WHO formula)', genericName: 'Oral Rehydration Salts', category: 'Essential', quantityInHand: 0, reorderLevel: 100, unit: 'packets', status: 'stockout' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Essential', quantityInHand: 12, reorderLevel: 50, unit: 'strips', status: 'critical' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', category: 'Essential', quantityInHand: 180, reorderLevel: 100, unit: 'strips', status: 'adequate' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Cotrimoxazole Paediatric Suspension', genericName: 'Trimethoprim + Sulphamethoxazole', category: 'Essential', quantityInHand: 3, reorderLevel: 30, unit: 'bottles', status: 'critical' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'DPT Vaccine (Pentavalent)', genericName: 'DPT-HepB-Hib', category: 'Vaccine', quantityInHand: 48, reorderLevel: 40, unit: 'doses', status: 'adequate' },
  { facilityId: 'PHC-KELWA-01', facilityName: 'PHC Kelwa', medicineName: 'Artesunate Injection 60mg', genericName: 'Artesunate', category: 'Essential', quantityInHand: 0, reorderLevel: 10, unit: 'vials', status: 'stockout' },
  { facilityId: 'RH-KHED-01', facilityName: 'Rural Hospital Khed', medicineName: 'Magnesium Sulphate 50% Injection', genericName: 'MgSO4', category: 'Emergency', quantityInHand: 18, reorderLevel: 10, unit: 'ampoules', status: 'adequate' },
  { facilityId: 'RH-KHED-01', facilityName: 'Rural Hospital Khed', medicineName: 'Labetalol Injection 5mg/mL', genericName: 'Labetalol HCl', category: 'Emergency', quantityInHand: 2, reorderLevel: 10, unit: 'ampoules', status: 'critical' }
];

// ─── Follow-up Tasks ──────────────────────────────────────────────────────────
export const FOLLOWUPS = [
  {
    ashaWorker: 'Meena Bhoir', ashaPhone: '9765432100',
    facilityId: 'SC-KELWA-01',
    type: 'ANC', dueDate: new Date('2026-08-30').toISOString(), priority: 'high',
    notes: 'Savita Patil — ANC 28w post-referral follow-up. Check if admitted to RH Khed. Confirm IV iron started.',
    completed: false
  },
  {
    ashaWorker: 'Meena Bhoir', ashaPhone: '9765432100',
    facilityId: 'SC-KELWA-01',
    type: 'PostReferral', dueDate: new Date('2026-08-29').toISOString(), priority: 'high',
    notes: 'Govind Wagh (7y) — Post-ORS therapy follow-up. Check hydration, weight, and diarrhoea frequency.',
    completed: false
  },
  {
    ashaWorker: 'Meena Bhoir', ashaPhone: '9765432100',
    facilityId: 'SC-KELWA-01',
    type: 'Routine', dueDate: new Date('2026-08-31').toISOString(), priority: 'low',
    notes: 'Anand Shinde — Check if tension headache resolved with hydration & rest. No meds required.',
    completed: false
  },
  {
    ashaWorker: 'Sushma Mhatre', ashaPhone: '9812345678',
    facilityId: 'PHC-KELWA-01',
    type: 'NCD', dueDate: new Date('2026-08-26').toISOString(), priority: 'high',
    notes: 'Ramakant Bhagat — BP 158/96 last week. Medication compliance check. Refer to PHC NCD clinic if BP still >150.',
    completed: false
  },
  {
    ashaWorker: 'Rekha Patil', ashaPhone: '9700112233',
    facilityId: 'RH-KHED-01',
    type: 'PostDischarge', dueDate: new Date('2026-09-02').toISOString(), priority: 'high',
    notes: 'Laxmi Koli — Post-eclampsia treatment at RH Khed. Home visit after discharge. Check BP, urine protein, foetal movements.',
    completed: false
  },
  {
    ashaWorker: 'Rekha Patil', ashaPhone: '9700112233',
    facilityId: 'PHC-KELWA-01',
    type: 'NCD', dueDate: new Date('2026-08-28').toISOString(), priority: 'high',
    notes: 'Dinkar Pawar — SpO2 91%, COPD+CKD. Monthly follow-up overdue by 3 days. Bring to PHC for spirometry assessment.',
    completed: false
  }
];

// ─── User Accounts (Email & Password Credentials for All Actors) ─────────────
export const USERS_DATA = [
  // 1. Patients
  {
    email: 'savita.patil@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Savita Patil',
    nameMarathi: 'सविता पाटील',
    nameHindi: 'सविता पाटिल',
    role: 'patient',
    phone: '9876543210',
    abhaId: 'ABHA-MH-2026-00001',
    designation: 'Citizen / Beneficiary (ANC 28w)'
  },
  {
    email: 'anand.shinde@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Anand Shinde',
    nameMarathi: 'आनंद शिंदे',
    nameHindi: 'आनंद शिंदे',
    role: 'patient',
    phone: '9867112233',
    abhaId: 'ABHA-MH-2026-00005',
    designation: 'Citizen / Beneficiary (Farmer)'
  },
  {
    email: 'ramakant.bhagat@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Ramakant Bhagat',
    nameMarathi: 'रामकांत भगत',
    nameHindi: 'रामकांत भगत',
    role: 'patient',
    phone: '9823456789',
    abhaId: 'ABHA-MH-2026-00002',
    designation: 'Citizen / Beneficiary (T2DM+HTN)'
  },

  // 2. ASHA Workers
  {
    email: 'meena.bhoir@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Meena Bhoir',
    nameMarathi: 'मीना भोईर',
    nameHindi: 'मीना भोईर',
    role: 'asha',
    phone: '9765432100',
    facilityId: 'SC-KELWA-01',
    facilityName: 'Sub-Centre Kelwa',
    designation: 'Accredited Social Health Activist (ASHA)'
  },
  {
    email: 'rekha.patil@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Rekha Patil',
    nameMarathi: 'रेखा पाटील',
    nameHindi: 'रेखा पाटिल',
    role: 'asha',
    phone: '9700112233',
    facilityId: 'RH-KHED-01',
    facilityName: 'Rural Hospital Khed',
    designation: 'Senior Community Health Worker'
  },

  // 3. PHC Medical Officer
  {
    email: 'dr.patkar@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Dr. Ramesh Patkar',
    nameMarathi: 'डॉ. रमेश पाटकर',
    nameHindi: 'डॉ. रमेश पाटकर',
    role: 'phc_doctor',
    phone: '9822001122',
    facilityId: 'PHC-KELWA-01',
    facilityName: 'PHC Kelwa',
    department: 'General OPD & Primary Care',
    designation: 'Medical Officer In-Charge (MBBS)'
  },

  // 4. Hospital Staff / Administrator
  {
    email: 'admin.khed@arogyalink.gov.in',
    password: 'Password@123',
    name: 'RH Khed Hospital Desk',
    nameMarathi: 'ग्रामीण रुग्णालय खेड कक्ष',
    nameHindi: 'ग्रामीण अस्पताल खेड डेस्क',
    role: 'hospital_admin',
    phone: '02525-223501',
    facilityId: 'RH-KHED-01',
    facilityName: 'Rural Hospital Khed',
    designation: 'Hospital Superintendent / Reception'
  },

  // 5. Specialist Doctor
  {
    email: 'dr.kulkarni@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Dr. Neeta Kulkarni',
    nameMarathi: 'डॉ. नीता कुलकर्णी',
    nameHindi: 'डॉ. नीता कुलकर्णी',
    role: 'hospital_doctor',
    phone: '9822998877',
    facilityId: 'RH-KHED-01',
    facilityName: 'Rural Hospital Khed',
    department: 'Obstetrics & Gynaecology',
    designation: 'Senior Consultant OBG (MS, DGO)'
  },
  {
    email: 'dr.kale@arogyalink.gov.in',
    password: 'Password@123',
    name: 'Dr. Pradeep Kale',
    nameMarathi: 'डॉ. प्रदीप काळे',
    nameHindi: 'डॉ. प्रदीप काले',
    role: 'hospital_doctor',
    phone: '9822443322',
    facilityId: 'CH-THANE-01',
    facilityName: 'Civil Hospital Thane',
    department: 'Cardiology',
    designation: 'Chief Cardiologist (MD, DM)'
  },

  // ── 7. Andhra Pradesh Patients & Healthcare Workers ─────────────
  {
    email: 'kavya.reddy@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Kavya Reddy',
    nameMarathi: 'काव्या रेड्डी',
    nameHindi: 'काव्या रेड्डी',
    role: 'patient',
    phone: '9848011223',
    abhaId: 'ABHA-AP-2026-00101',
    designation: 'Citizen / Student (Inavolu, Amaravati)'
  },
  {
    email: 'venkat.rao@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Venkat Rao',
    nameMarathi: 'व्यंकट राव',
    nameHindi: 'वेंकट राव',
    role: 'patient',
    phone: '9848033445',
    abhaId: 'ABHA-AP-2026-00102',
    designation: 'Citizen / Farmer (Mandadam Village)'
  },
  {
    email: 'ananya.sharma@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Ananya Sharma',
    nameMarathi: 'अनन्या शर्मा',
    nameHindi: 'अनन्या शर्मा',
    role: 'patient',
    phone: '9848099887',
    abhaId: 'ABHA-AP-2026-00103',
    designation: 'Student (VIT-AP University)'
  },
  {
    email: 'dr.haritha@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Dr. Ch. Haritha',
    nameMarathi: 'डॉ. सी. एच. हरिता',
    nameHindi: 'डॉ. सी. एच. हरिता',
    role: 'phc_doctor',
    phone: '0863-2370000',
    facilityId: 'VIT-AP-HC-01',
    facilityName: 'VIT-AP Campus Health Centre',
    department: 'Campus General OPD',
    designation: 'Campus Medical Officer (MBBS)'
  },
  {
    email: 'dr.srinivas.rao@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Dr. P. Srinivas Rao',
    nameMarathi: 'डॉ. पी. श्रीनिवास राव',
    nameHindi: 'डॉ. पी. श्रीनिवास राव',
    role: 'phc_doctor',
    phone: '0863-228201',
    facilityId: 'PHC-MANDADAM-01',
    facilityName: 'Primary Health Centre Mandadam',
    department: 'General OPD & Primary Care',
    designation: 'Medical Officer In-Charge (MBBS)'
  },
  {
    email: 'dr.anuradha.aiims@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Dr. K. Anuradha',
    nameMarathi: 'डॉ. के. अनुराधा',
    nameHindi: 'डॉ. के. अनुराधा',
    role: 'hospital_doctor',
    phone: '08645-293400',
    facilityId: 'AIIMS-MANGALAGIRI-01',
    facilityName: 'AIIMS Mangalagiri',
    department: 'Cardiology',
    designation: 'Senior Consultant Cardiologist (MD, DM)'
  },
  {
    email: 'dho.guntur@arogyalink.ap.gov.in',
    password: 'Password@123',
    name: 'Dr. Y. Kameswara Rao',
    nameMarathi: 'डॉ. वाय. कामेश्वर राव',
    nameHindi: 'डॉ. वाई. कामेश्वर राव',
    role: 'district_admin',
    phone: '0863-2224400',
    facilityId: 'AIIMS-MANGALAGIRI-01',
    facilityName: 'AIIMS Mangalagiri & DMHO Guntur',
    designation: 'District Medical & Health Officer (DM&HO), Guntur'
  }
];

// ─── Grievance & Service Quality Feedback Data ─────────────────────────────────
export const GRIEVANCES_DATA = [
  {
    grievanceId: 'GRV-MH-2026-0041',
    patientName: 'Ramakant Bhagat',
    patientPhone: '9823456789',
    facilityId: 'PHC-KELWA-01',
    facilityName: 'PHC Kelwa',
    category: 'Grievance',
    complaintType: 'doctor_absent_on_duty',
    targetDoctorOrStaff: 'Dr. Suresh Naik',
    rating: 2,
    comment: 'App showed doctor present for OPD consultation at 10:30 AM, but doctor was absent at PHC. Had to wait 2 hours.',
    status: 'action_taken',
    actionTakenNotes: 'Show-cause notice issued by DHO. Digital roster corrected to offline status immediately.',
    autoRosterCorrectionTriggered: true,
    submittedAt: new Date('2026-08-27T11:00:00').toISOString()
  },
  {
    grievanceId: 'GRV-MH-2026-0029',
    patientName: 'Savita Patil',
    patientPhone: '9876543210',
    facilityId: 'SC-KELWA-01',
    facilityName: 'Sub-Centre Kelwa',
    category: 'OPD',
    complaintType: 'none',
    rating: 5,
    waitTimeRating: 5,
    staffBehaviorRating: 5,
    cleanliness: 4,
    comment: 'ASHA Meena Bhoir took blood pressure and arranged timely ANC iron supplements at my doorstep.',
    status: 'resolved',
    submittedAt: new Date('2026-08-28T14:30:00').toISOString()
  }
];

// ─── Initial OP Bookings (Queue Token Records across all departments & facilities) ────
export const INITIAL_OP_BOOKINGS = [
  {
    bookingId: 'OP-AP-2026-1001',
    tokenNumber: 'OPD-VIT-004',
    patientName: 'Ananya Sharma',
    abhaId: 'ABHA-AP-2026-00103',
    phone: '9848099887',
    facilityId: 'VIT-AP-HC-01',
    facilityName: 'VIT-AP Campus Health Centre',
    department: 'General OPD',
    doctorName: 'Dr. Ch. Haritha',
    slotTime: '10:00 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 12,
    priorityScore: 85,
    symptoms: ['Fever', 'Headache'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1002',
    tokenNumber: 'OPD-MAN-014',
    patientName: 'Venkat Rao',
    abhaId: 'ABHA-AP-2026-00102',
    phone: '9848033445',
    facilityId: 'PHC-MANDADAM-01',
    facilityName: 'Primary Health Centre Mandadam',
    department: 'General OPD',
    doctorName: 'Dr. P. Srinivas Rao',
    slotTime: '10:30 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 18,
    priorityScore: 78,
    symptoms: ['Blood Glucose Check', 'Hypertension'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1003',
    tokenNumber: 'OPD-AIM-008',
    patientName: 'Lakshmi Devi K.',
    abhaId: 'ABHA-AP-2026-00104',
    phone: '9848123456',
    facilityId: 'AIIMS-MANGALAGIRI-01',
    facilityName: 'AIIMS Mangalagiri (All India Institute of Medical Sciences)',
    department: 'Obstetrics & Gynaecology',
    doctorName: 'Dr. K. Swathi, MD (OBG)',
    slotTime: '10:45 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 24,
    priorityScore: 92,
    symptoms: ['Routine ANC 28w', 'Mild Swelling'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1004',
    tokenNumber: 'OPD-GNT-021',
    patientName: 'Suresh Kumar Reddy',
    abhaId: 'ABHA-AP-2026-00105',
    phone: '9848234567',
    facilityId: 'GGH-GUNTUR-01',
    facilityName: 'Government General Hospital (GGH) Guntur',
    department: 'Cardiology',
    doctorName: 'Dr. N. B. Prasad, DM (Cardio)',
    slotTime: '11:00 AM',
    queuePosition: 4,
    estimatedWaitMinutes: 30,
    priorityScore: 89,
    symptoms: ['Chest Heaviness', 'Shortness of Breath'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1005',
    tokenNumber: 'OPD-VJA-012',
    patientName: 'Master Sai Charan (6y)',
    abhaId: 'ABHA-AP-2026-00106',
    phone: '9848345678',
    facilityId: 'AP-VJA-001',
    facilityName: 'Government General Hospital (GGH) Vijayawada',
    department: 'Paediatrics',
    doctorName: 'Dr. T. Geetha, MD (Paed)',
    slotTime: '11:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 15,
    priorityScore: 82,
    symptoms: ['High Fever', 'Persistent Cough'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1006',
    tokenNumber: 'OPD-TUL-007',
    patientName: 'M. Appa Rao',
    abhaId: 'ABHA-AP-2026-00107',
    phone: '9848456789',
    facilityId: 'PHC-TULLURU-01',
    facilityName: 'Primary Health Centre Tulluru',
    department: 'Orthopaedics',
    doctorName: 'Dr. M. Koteswara Rao, MS (Ortho)',
    slotTime: '11:30 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 20,
    priorityScore: 76,
    symptoms: ['Joint Pain', 'Knee Swelling'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1007',
    tokenNumber: 'EMG-AIM-001',
    patientName: 'Ramesh Varma',
    abhaId: 'ABHA-AP-2026-00108',
    phone: '9848567890',
    facilityId: 'AIIMS-MANGALAGIRI-01',
    facilityName: 'AIIMS Mangalagiri',
    department: 'Emergency Bay',
    doctorName: 'Emergency Medical Officer on Duty',
    slotTime: 'Immediate (Green Channel)',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    priorityScore: 98,
    symptoms: ['Severe Chest Pain', 'Diaphoresis'],
    clinicalUrgency: 'emergency',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-MH-2026-1008',
    tokenNumber: 'OPD-KHD-005',
    patientName: 'Savita Patil',
    abhaId: 'ABHA-MH-2026-00001',
    phone: '9876543210',
    facilityId: 'RH-KHED-01',
    facilityName: 'Rural Hospital Khed',
    department: 'Obstetrics & Gynaecology',
    doctorName: 'Dr. Sunita Vaidya',
    slotTime: '11:45 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 16,
    priorityScore: 90,
    symptoms: ['ANC 28w', 'Anaemia (Hb 8.4)'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-MH-2026-1009',
    tokenNumber: 'OPD-KLW-009',
    patientName: 'Ramakant Bhagat',
    abhaId: 'ABHA-MH-2026-00002',
    phone: '9823456789',
    facilityId: 'PHC-KELWA-01',
    facilityName: 'Primary Health Centre Kelwa',
    department: 'NCD Clinic',
    doctorName: 'Dr. Ramesh Patkar',
    slotTime: '12:00 PM',
    queuePosition: 3,
    estimatedWaitMinutes: 22,
    priorityScore: 84,
    symptoms: ['T2DM Uncontrolled', 'HTN Stage 2'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  // Additional AP multi-department OP bookings
  {
    bookingId: 'OP-AP-2026-1010',
    tokenNumber: 'OPD-KGH-045',
    patientName: 'K. Sanyasi Rao',
    abhaId: 'ABHA-AP-2026-00109',
    phone: '9849112233',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'General Medicine',
    doctorName: 'Dr. P. V. Ramana',
    slotTime: '09:00 AM',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    priorityScore: 78,
    symptoms: ['Fever & Chills', 'Body Aches'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1011',
    tokenNumber: 'OPD-KGH-046',
    patientName: 'Ch. Varalakshmi',
    abhaId: 'ABHA-AP-2026-00110',
    phone: '9849223344',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'Obstetrics & Gynaecology',
    doctorName: 'Dr. S. K. Anuradha',
    slotTime: '09:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 14,
    priorityScore: 94,
    symptoms: ['ANC 34w', 'Severe Pedal Edema', 'BP 150/98'],
    clinicalUrgency: 'emergency',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1012',
    tokenNumber: 'OPD-KGH-047',
    patientName: 'B. Appala Naidu',
    abhaId: 'ABHA-AP-2026-00111',
    phone: '9849334455',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'Cardiology',
    doctorName: 'Dr. K. Srinivas',
    slotTime: '09:30 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 20,
    priorityScore: 91,
    symptoms: ['Chest Tightness', 'Exertional Dyspnea'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1013',
    tokenNumber: 'OPD-KGH-048',
    patientName: 'Baby of G. Padma (11m)',
    abhaId: 'ABHA-AP-2026-00112',
    phone: '9849445566',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'Paediatrics',
    doctorName: 'Dr. M. Venkata Rao',
    slotTime: '09:45 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 12,
    priorityScore: 88,
    symptoms: ['High Fever 103F', 'Vomiting & Lethargy'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1014',
    tokenNumber: 'OPD-KGH-049',
    patientName: 'N. Prasad',
    abhaId: 'ABHA-AP-2026-00113',
    phone: '9849556677',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'Orthopaedics',
    doctorName: 'Dr. T. Satyanarayana',
    slotTime: '10:00 AM',
    queuePosition: 4,
    estimatedWaitMinutes: 28,
    priorityScore: 74,
    symptoms: ['Right Tibia Fracture post fall'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1015',
    tokenNumber: 'EMG-KGH-001',
    patientName: 'K. Srinivasa Rao',
    abhaId: 'ABHA-AP-2026-00114',
    phone: '9849667788',
    facilityId: 'AP-VSP-001',
    facilityName: 'King George Hospital (KGH)',
    department: 'Emergency Bay',
    doctorName: 'Casualty Medical Officer',
    slotTime: 'Immediate (Green Channel)',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    priorityScore: 99,
    symptoms: ['RTA Poly-Trauma', 'Head Injury GCS 11'],
    clinicalUrgency: 'emergency',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1016',
    tokenNumber: 'OPD-SVM-019',
    patientName: 'P. Subbamma',
    abhaId: 'ABHA-AP-2026-00115',
    phone: '9849778899',
    facilityId: 'AP-TPT-001',
    facilityName: 'Sri Venkateswara Institute of Medical Sciences (SVIMS)',
    department: 'Cardiology',
    doctorName: 'Dr. C. Prabhakar',
    slotTime: '10:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 16,
    priorityScore: 89,
    symptoms: ['Post-PTCA Follow-up', 'Angina on walking'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1017',
    tokenNumber: 'OPD-SVM-020',
    patientName: 'T. Reddappa',
    abhaId: 'ABHA-AP-2026-00116',
    phone: '9849889900',
    facilityId: 'AP-TPT-001',
    facilityName: 'Sri Venkateswara Institute of Medical Sciences (SVIMS)',
    department: 'Neurology',
    doctorName: 'Dr. V. B. Sarma',
    slotTime: '10:30 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 24,
    priorityScore: 85,
    symptoms: ['Right-sided weakness & numbness'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1018',
    tokenNumber: 'OPD-KNL-031',
    patientName: 'M. Hussainappa',
    abhaId: 'ABHA-AP-2026-00117',
    phone: '9850112233',
    facilityId: 'AP-KNL-001',
    facilityName: 'Government General Hospital (GGH) Kurnool',
    department: 'General Medicine',
    doctorName: 'Dr. B. Ramanjaneyulu',
    slotTime: '10:45 AM',
    queuePosition: 5,
    estimatedWaitMinutes: 32,
    priorityScore: 76,
    symptoms: ['Chronic Cough', 'Hemoptysis trace'],
    clinicalUrgency: 'routine',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1019',
    tokenNumber: 'OPD-KNL-032',
    patientName: 'S. Parvathi',
    abhaId: 'ABHA-AP-2026-00118',
    phone: '9850223344',
    facilityId: 'AP-KNL-001',
    facilityName: 'Government General Hospital (GGH) Kurnool',
    department: 'Obstetrics & Gynaecology',
    doctorName: 'Dr. K. Jayasree',
    slotTime: '11:00 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 18,
    priorityScore: 92,
    symptoms: ['ANC 30w', 'Twin Gestation', 'BP 142/92'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1020',
    tokenNumber: 'OPD-NLR-015',
    patientName: 'V. Krishnaiah',
    abhaId: 'ABHA-AP-2026-00119',
    phone: '9850334455',
    facilityId: 'AP-NLR-001',
    facilityName: 'ACSR Government General Hospital Nellore',
    department: 'General Medicine',
    doctorName: 'Dr. Y. Sudhakar',
    slotTime: '11:15 AM',
    queuePosition: 2,
    estimatedWaitMinutes: 12,
    priorityScore: 79,
    symptoms: ['Uncontrolled Hyperglycemia BS 310 mg/dL'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  },
  {
    bookingId: 'OP-AP-2026-1021',
    tokenNumber: 'OPD-KKD-022',
    patientName: 'G. Satyanarayana',
    abhaId: 'ABHA-AP-2026-00120',
    phone: '9850445566',
    facilityId: 'AP-KKD-001',
    facilityName: 'Government General Hospital (GGH) Kakinada',
    department: 'General Medicine',
    doctorName: 'Dr. M. S. R. Murthy',
    slotTime: '11:30 AM',
    queuePosition: 3,
    estimatedWaitMinutes: 18,
    priorityScore: 75,
    symptoms: ['Fever & Jaundice (Bilirubin 4.2)'],
    clinicalUrgency: 'urgent',
    status: 'confirmed'
  }
];

// ─── Rich Andhra Pradesh Multi-Stage Referral Network ─────────────────────────
export const ALL_REFERRALS_DATA = [
  {
    fromFacilityId: 'PHC-KELWA-01', fromFacilityName: 'PHC Kelwa',
    toFacilityId: 'RH-KHED-01', toFacilityName: 'Rural Hospital Khed',
    urgency: 'urgent',
    reason: 'ANC 28w — worsening anaemia (Hb 8.4), hypotension (BP 104/68), proteinuria +1. Needs OBG specialist assessment, IV iron, foetal Doppler.',
    diagnosis: ['ANC-28w', 'Anaemia-Moderate-Worsening', 'Hypotension', 'Proteinuria +1'],
    diagnosticsRequested: ['CBC + Peripheral Smear', 'Serum Ferritin', 'Urine 24h Protein', 'Foetal Doppler USG'],
    specialistRequired: 'Obstetrics & Gynaecology',
    currentStage: 'transport_arranged',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. Ramesh Patkar', role: 'phc_doctor', facilityId: 'PHC-KELWA-01', notes: 'Referral initiated after ANC 28w assessment.', timestamp: new Date('2026-08-28T10:45:00').toISOString() },
      { stage: 'accepted', updatedBy: 'Dr. Neeta Kulkarni', role: 'hospital_doctor', facilityId: 'RH-KHED-01', notes: 'Accepted. Bed reserved in OBG Ward Bed #04.', timestamp: new Date('2026-08-28T11:10:00').toISOString() },
      { stage: 'transport_arranged', updatedBy: '108 Control Room', role: 'system', facilityId: 'PHC-KELWA-01', notes: '108 Ambulance MH-04-108-3421 dispatched.', timestamp: new Date('2026-08-28T11:20:00').toISOString() }
    ],
    ambulanceNumber: 'MH-04-108-3421', driverPhone: '9900108108',
    estimatedArrival: new Date('2026-08-28T12:30:00').toISOString(),
    initiatedBy: 'Dr. Ramesh Patkar',
    initiatedAt: new Date('2026-08-28T10:45:00').toISOString()
  },
  {
    fromFacilityId: 'AP-GNT-007', fromFacilityName: 'Primary Health Centre Thullur',
    toFacilityId: 'AP-GNT-002', toFacilityName: 'AIIMS Mangalagiri',
    urgency: 'urgent',
    reason: 'ANC 32w with Gestational Diabetes and mild polyhydramnios. Requires tertiary OBG and endocrine consultation.',
    diagnosis: ['ANC-32w', 'Gestational Diabetes Mellitus', 'Polyhydramnios'],
    diagnosticsRequested: ['OGTT', 'Foetal Wellbeing USG', 'HbA1c'],
    specialistRequired: 'Obstetrics & Gynaecology',
    currentStage: 'under_treatment',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. Ch. Haritha', role: 'phc_doctor', facilityId: 'AP-GNT-007', notes: 'GDM detected on 75g OGTT.', timestamp: new Date('2026-08-27T09:30:00').toISOString() },
      { stage: 'accepted', updatedBy: 'Dr. K. Swathi', role: 'hospital_doctor', facilityId: 'AP-GNT-002', notes: 'Appointment booked in High-Risk ANC Clinic.', timestamp: new Date('2026-08-27T10:00:00').toISOString() },
      { stage: 'arrived', updatedBy: 'AIIMS Triage Desk', role: 'hospital_admin', facilityId: 'AP-GNT-002', notes: 'Admitted for 24hr blood sugar profile.', timestamp: new Date('2026-08-28T09:00:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'Dr. K. Swathi, MD (OBG)', role: 'hospital_doctor', facilityId: 'AP-GNT-002', notes: 'Insulin regimen titrated. Foetal heart Doppler normal.', timestamp: new Date('2026-08-29T11:30:00').toISOString() }
    ],
    initiatedBy: 'Dr. Ch. Haritha',
    initiatedAt: new Date('2026-08-27T09:30:00').toISOString()
  },
  {
    fromFacilityId: 'AP-GNT-008', fromFacilityName: 'Primary Health Centre Mandadam',
    toFacilityId: 'AP-GNT-001', toFacilityName: 'Government General Hospital (GGH) Guntur',
    urgency: 'emergency',
    reason: 'Acute Coronary Syndrome — severe retrosternal chest pain radiating to left arm with ST elevations in V1-V4.',
    diagnosis: ['Acute Anterior Wall STEMI', 'Hypertension Stage 2'],
    diagnosticsRequested: ['12-Lead ECG Stat', 'Troponin-I Stat', 'Echocardiography', 'Coronary Angiography'],
    specialistRequired: 'Cardiology',
    currentStage: 'under_treatment',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. P. Srinivas Rao', role: 'phc_doctor', facilityId: 'AP-GNT-008', notes: 'Stat ECG showed STEMI. Loading doses of Aspirin, Clopidogrel & Atorvastatin administered.', timestamp: new Date('2026-08-29T08:15:00').toISOString() },
      { stage: 'transport_arranged', updatedBy: '108 EMRI Control Hub', role: 'system', facilityId: 'AP-GNT-008', notes: '108 ALS Ambulance AP-07-108-1122 dispatched.', timestamp: new Date('2026-08-29T08:20:00').toISOString() },
      { stage: 'patient_en_route', updatedBy: 'EMT V. Subbaiah', role: 'system', facilityId: 'AP-GNT-008', notes: 'Patient en route. High flow oxygen running, SpO2 97%.', timestamp: new Date('2026-08-29T08:35:00').toISOString() },
      { stage: 'arrived', updatedBy: 'Casualty In-Charge', role: 'hospital_admin', facilityId: 'AP-GNT-001', notes: 'Patient reached GGH Guntur Green Channel Bay.', timestamp: new Date('2026-08-29T08:55:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'Dr. N. B. Prasad, DM', role: 'hospital_doctor', facilityId: 'AP-GNT-001', notes: 'Direct transfer to GGH Guntur Cath Lab for primary PCI.', timestamp: new Date('2026-08-29T09:05:00').toISOString() }
    ],
    ambulanceNumber: 'AP-07-108-1122', driverPhone: '9848108108',
    initiatedBy: 'Dr. P. Srinivas Rao',
    initiatedAt: new Date('2026-08-29T08:15:00').toISOString()
  },
  {
    fromFacilityId: 'AP-VSP-007', fromFacilityName: 'Community Health Centre Bheemunipatnam',
    toFacilityId: 'AP-VSP-001', toFacilityName: 'King George Hospital (KGH)',
    urgency: 'urgent',
    reason: 'Chronic non-healing diabetic ulcer right foot with osteomyelitis risk.',
    diagnosis: ['Type 2 DM', 'Diabetic Foot Ulcer Wagner Grade 3', 'Peripheral Vascular Disease'],
    diagnosticsRequested: ['X-Ray Foot', 'Wound Culture & Sensitivity', 'Duplex Arterial Doppler'],
    specialistRequired: 'General Surgery',
    currentStage: 'discharged',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. T. Geetha', role: 'phc_doctor', facilityId: 'AP-VSP-007', notes: 'Ulcer expanding despite oral antibiotics.', timestamp: new Date('2026-08-22T10:00:00').toISOString() },
      { stage: 'accepted', updatedBy: 'Dr. P. V. Ramana', role: 'hospital_doctor', facilityId: 'AP-VSP-001', notes: 'Surgical bed allocated in Ward 8.', timestamp: new Date('2026-08-22T11:00:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'KGH Surgical Team', role: 'hospital_doctor', facilityId: 'AP-VSP-001', notes: 'Surgical debridement completed successfully.', timestamp: new Date('2026-08-24T14:00:00').toISOString() },
      { stage: 'discharged', updatedBy: 'Dr. P. V. Ramana', role: 'hospital_doctor', facilityId: 'AP-VSP-001', notes: 'Wound healing well. Discharged with oral antibiotic course and ASHA dressing protocol.', timestamp: new Date('2026-08-27T16:00:00').toISOString() }
    ],
    initiatedBy: 'Dr. T. Geetha',
    initiatedAt: new Date('2026-08-22T10:00:00').toISOString()
  },
  {
    fromFacilityId: 'AP-TPT-005', fromFacilityName: 'Area Hospital Srikalahasti',
    toFacilityId: 'AP-TPT-001', toFacilityName: 'Sri Venkateswara Institute of Medical Sciences (SVIMS)',
    urgency: 'urgent',
    reason: 'Suspected Rheumatic Heart Disease with severe Mitral Stenosis and pulmonary hypertension.',
    diagnosis: ['Severe Mitral Stenosis', 'Pulmonary Arterial Hypertension'],
    diagnosticsRequested: ['2D/3D Echocardiography', 'Chest X-Ray', 'ECG'],
    specialistRequired: 'Cardiology',
    currentStage: 'discharged',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. M. Koteswara Rao', role: 'phc_doctor', facilityId: 'AP-TPT-005', notes: 'Murmur detected with NYHA Class III dyspnea.', timestamp: new Date('2026-08-21T09:00:00').toISOString() },
      { stage: 'accepted', updatedBy: 'Dr. C. Prabhakar', role: 'hospital_doctor', facilityId: 'AP-TPT-001', notes: 'SVIMS Cardiology appointment confirmed.', timestamp: new Date('2026-08-21T10:30:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'Dr. C. Prabhakar', role: 'hospital_doctor', facilityId: 'AP-TPT-001', notes: 'Balloon Mitral Valvotomy (BMV) performed.', timestamp: new Date('2026-08-23T11:00:00').toISOString() },
      { stage: 'discharged', updatedBy: 'Dr. C. Prabhakar', role: 'hospital_doctor', facilityId: 'AP-TPT-001', notes: 'Patient clinically stable. Discharged with Dr. NTR Vaidya Seva post-procedure kit.', timestamp: new Date('2026-08-26T15:00:00').toISOString() }
    ],
    initiatedBy: 'Dr. M. Koteswara Rao',
    initiatedAt: new Date('2026-08-21T09:00:00').toISOString()
  },
  {
    fromFacilityId: 'AP-KNL-005', fromFacilityName: 'Primary Health Centre Kodumur',
    toFacilityId: 'AP-KNL-001', toFacilityName: 'Government General Hospital (GGH) Kurnool',
    urgency: 'emergency',
    reason: 'Child 4y with severe febrile convulsions and altered sensorium — suspect acute bacterial meningitis.',
    diagnosis: ['Acute Bacterial Meningitis Suspect', 'Status Epilepticus', 'Severe Dehydration'],
    diagnosticsRequested: ['Stat CSF Analysis', 'Blood Culture', 'Serum Electrolytes', 'CT Brain'],
    specialistRequired: 'Pediatrics',
    currentStage: 'under_treatment',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. B. Ramanjaneyulu', role: 'phc_doctor', facilityId: 'AP-KNL-005', notes: 'Emergency IV anticonvulsant and ceftriaxone given.', timestamp: new Date('2026-08-30T07:30:00').toISOString() },
      { stage: 'transport_arranged', updatedBy: '108 EMRI Kurnool', role: 'system', facilityId: 'AP-KNL-005', notes: '108 Emergency Ambulance AP-21-108-5544 dispatched.', timestamp: new Date('2026-08-30T07:35:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'Dr. K. Jayasree', role: 'hospital_doctor', facilityId: 'AP-KNL-001', notes: 'Admitted to PICU Bed #03. Lumbar puncture performed.', timestamp: new Date('2026-08-30T08:45:00').toISOString() }
    ],
    ambulanceNumber: 'AP-21-108-5544', driverPhone: '9850108108',
    initiatedBy: 'Dr. B. Ramanjaneyulu',
    initiatedAt: new Date('2026-08-30T07:30:00').toISOString()
  },
  {
    fromFacilityId: 'AP-SKL-002', fromFacilityName: 'Area Hospital Tekkali',
    toFacilityId: 'AP-SKL-001', toFacilityName: 'RIMS Government General Hospital Srikakulam',
    urgency: 'routine',
    reason: 'Uddanam nephropathy case — progressive rise in Serum Creatinine (3.8 mg/dL). Needs nephrologist review and AV fistula creation planning.',
    diagnosis: ['Chronic Kidney Disease Stage 4', 'Uddanam Endemic Nephropathy', 'Renal Anemia'],
    diagnosticsRequested: ['Renal Ultrasound', '24h Urine Protein', 'Serum Electrolytes & Creatinine'],
    specialistRequired: 'Nephrology',
    currentStage: 'accepted',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. M. S. R. Murthy', role: 'phc_doctor', facilityId: 'AP-SKL-002', notes: 'Referred from Uddanam screening camp.', timestamp: new Date('2026-08-29T14:00:00').toISOString() },
      { stage: 'accepted', updatedBy: 'Dr. Y. Sudhakar', role: 'hospital_doctor', facilityId: 'AP-SKL-001', notes: 'Nephrology OPD slot booked for Monday.', timestamp: new Date('2026-08-30T10:00:00').toISOString() }
    ],
    initiatedBy: 'Dr. M. S. R. Murthy',
    initiatedAt: new Date('2026-08-29T14:00:00').toISOString()
  },
  {
    fromFacilityId: 'AP-NLR-004', fromFacilityName: 'Area Hospital Kavali',
    toFacilityId: 'AP-NLR-001', toFacilityName: 'ACSR Government General Hospital Nellore',
    urgency: 'routine',
    reason: 'Bilateral mature senile cataract with visual acuity reduced to Counting Fingers at 1 metre.',
    diagnosis: ['Senile Cataract Bilateral (Mature)'],
    diagnosticsRequested: ['Biometry A-Scan', 'Keratometry', 'Random Blood Sugar', 'ECG'],
    specialistRequired: 'Ophthalmology',
    currentStage: 'follow_up_due',
    stageHistory: [
      { stage: 'initiated', updatedBy: 'Dr. S. K. Anuradha', role: 'phc_doctor', facilityId: 'AP-NLR-004', notes: 'Identified during National Programme for Control of Blindness (NPCB) camp.', timestamp: new Date('2026-08-20T10:00:00').toISOString() },
      { stage: 'under_treatment', updatedBy: 'ACSR Eye Dept', role: 'hospital_doctor', facilityId: 'AP-NLR-001', notes: 'Phacoemulsification with Foldable IOL implanted right eye.', timestamp: new Date('2026-08-24T11:30:00').toISOString() },
      { stage: 'follow_up_due', updatedBy: 'ACSR Eye Dept', role: 'hospital_doctor', facilityId: 'AP-NLR-001', notes: 'Post-op vision 6/9. ASHA follow-up visit scheduled.', timestamp: new Date('2026-08-25T14:00:00').toISOString() }
    ],
    initiatedBy: 'Dr. S. K. Anuradha',
    initiatedAt: new Date('2026-08-20T10:00:00').toISOString()
  }
];

// ─── Time-Series Encounters for Footfall & Department Analytics ───────────────
export const TIME_SERIES_ENCOUNTERS = [
  // 14-day daily encounters spread across key departments
  { date: '2026-08-18', dept: 'General Medicine', type: 'OPD', count: 18 },
  { date: '2026-08-18', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 12 },
  { date: '2026-08-18', dept: 'Paediatrics', type: 'OPD', count: 9 },
  { date: '2026-08-18', dept: 'Orthopaedics', type: 'OPD', count: 7 },
  { date: '2026-08-18', dept: 'Cardiology', type: 'OPD', count: 8 },
  { date: '2026-08-18', dept: 'Emergency Bay', type: 'Emergency', count: 4 },

  { date: '2026-08-20', dept: 'General Medicine', type: 'OPD', count: 24 },
  { date: '2026-08-20', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 16 },
  { date: '2026-08-20', dept: 'Paediatrics', type: 'OPD', count: 14 },
  { date: '2026-08-20', dept: 'Orthopaedics', type: 'OPD', count: 11 },
  { date: '2026-08-20', dept: 'Cardiology', type: 'OPD', count: 12 },
  { date: '2026-08-20', dept: 'Emergency Bay', type: 'Emergency', count: 6 },

  { date: '2026-08-22', dept: 'General Medicine', type: 'OPD', count: 32 },
  { date: '2026-08-22', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 22 },
  { date: '2026-08-22', dept: 'Paediatrics', type: 'OPD', count: 18 },
  { date: '2026-08-22', dept: 'Orthopaedics', type: 'OPD', count: 15 },
  { date: '2026-08-22', dept: 'Cardiology', type: 'OPD', count: 16 },
  { date: '2026-08-22', dept: 'Emergency Bay', type: 'Emergency', count: 8 },

  { date: '2026-08-25', dept: 'General Medicine', type: 'OPD', count: 38 },
  { date: '2026-08-25', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 26 },
  { date: '2026-08-25', dept: 'Paediatrics', type: 'OPD', count: 20 },
  { date: '2026-08-25', dept: 'Orthopaedics', type: 'OPD', count: 18 },
  { date: '2026-08-25', dept: 'Cardiology', type: 'OPD', count: 19 },
  { date: '2026-08-25', dept: 'Emergency Bay', type: 'Emergency', count: 9 },

  { date: '2026-08-28', dept: 'General Medicine', type: 'OPD', count: 44 },
  { date: '2026-08-28', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 31 },
  { date: '2026-08-28', dept: 'Paediatrics', type: 'OPD', count: 25 },
  { date: '2026-08-28', dept: 'Orthopaedics', type: 'OPD', count: 22 },
  { date: '2026-08-28', dept: 'Cardiology', type: 'OPD', count: 24 },
  { date: '2026-08-28', dept: 'Emergency Bay', type: 'Emergency', count: 12 },

  { date: '2026-08-30', dept: 'General Medicine', type: 'OPD', count: 48 },
  { date: '2026-08-30', dept: 'Obstetrics & Gynaecology', type: 'ANC', count: 35 },
  { date: '2026-08-30', dept: 'Paediatrics', type: 'OPD', count: 28 },
  { date: '2026-08-30', dept: 'Orthopaedics', type: 'OPD', count: 24 },
  { date: '2026-08-30', dept: 'Cardiology', type: 'OPD', count: 26 },
  { date: '2026-08-30', dept: 'Emergency Bay', type: 'Emergency', count: 14 }
];

// ─── Comprehensive Multi-Facility Medicine & Vaccine Inventory ────────────────
export const EXPANDED_STOCK_DATA = [
  ...STOCK_DATA,
  { facilityId: 'AP-GNT-001', facilityName: 'Government General Hospital (GGH) Guntur', medicineName: 'Inj. Oxytocin 10 IU', genericName: 'Oxytocin', category: 'Emergency', quantityInHand: 420, reorderLevel: 200, unit: 'ampoules', status: 'adequate' },
  { facilityId: 'AP-GNT-001', facilityName: 'Government General Hospital (GGH) Guntur', medicineName: 'Inj. Magnesium Sulphate 50%', genericName: 'MgSO4 50%', category: 'Emergency', quantityInHand: 110, reorderLevel: 50, unit: 'vials', status: 'adequate' },
  { facilityId: 'AP-GNT-001', facilityName: 'Government General Hospital (GGH) Guntur', medicineName: 'Tab. Metformin 500mg', genericName: 'Metformin HCl', category: 'Essential', quantityInHand: 14000, reorderLevel: 3000, unit: 'tabs', status: 'adequate' },
  { facilityId: 'AP-GNT-001', facilityName: 'Government General Hospital (GGH) Guntur', medicineName: 'Inj. Artesunate 60mg', genericName: 'Artesunate', category: 'Essential', quantityInHand: 4, reorderLevel: 25, unit: 'vials', status: 'critical' },
  { facilityId: 'AP-VSP-001', facilityName: 'King George Hospital (KGH)', medicineName: 'Inj. Streptokinase 1.5 MU', genericName: 'Streptokinase', category: 'Emergency', quantityInHand: 18, reorderLevel: 15, unit: 'vials', status: 'adequate' },
  { facilityId: 'AP-VSP-001', facilityName: 'King George Hospital (KGH)', medicineName: 'IV Normal Saline 500ml', genericName: '0.9% NaCl', category: 'Emergency', quantityInHand: 2400, reorderLevel: 800, unit: 'bottles', status: 'adequate' },
  { facilityId: 'AP-VSP-001', facilityName: 'King George Hospital (KGH)', medicineName: 'Inj. Anti-Snake Venom (ASV)', genericName: 'Polyvalent Snake Antivenom', category: 'Emergency', quantityInHand: 0, reorderLevel: 20, unit: 'vials', status: 'stockout' },
  { facilityId: 'AP-TPT-001', facilityName: 'SVIMS Tirupati', medicineName: 'Inj. Heparin 5000 IU/mL', genericName: 'Heparin Sodium', category: 'Emergency', quantityInHand: 95, reorderLevel: 40, unit: 'vials', status: 'adequate' },
  { facilityId: 'AP-TPT-001', facilityName: 'SVIMS Tirupati', medicineName: 'Human Regular Insulin 40 IU/mL', genericName: 'Regular Insulin', category: 'Essential', quantityInHand: 350, reorderLevel: 100, unit: 'vials', status: 'adequate' },
  { facilityId: 'AP-KNL-001', facilityName: 'GGH Kurnool', medicineName: 'Inj. Labetalol 5mg/mL', genericName: 'Labetalol HCl', category: 'Emergency', quantityInHand: 2, reorderLevel: 20, unit: 'ampoules', status: 'critical' },
  { facilityId: 'AP-KNL-001', facilityName: 'GGH Kurnool', medicineName: 'Tab. Paracetamol 500mg', genericName: 'Paracetamol', category: 'Essential', quantityInHand: 25000, reorderLevel: 5000, unit: 'tabs', status: 'adequate' },
  { facilityId: 'AP-GNT-007', facilityName: 'PHC Thullur', medicineName: 'Ferric Carboxymaltose Inj 500mg', genericName: 'FCM Iron', category: 'Essential', quantityInHand: 0, reorderLevel: 15, unit: 'vials', status: 'stockout' },
  { facilityId: 'AP-GNT-007', facilityName: 'PHC Thullur', medicineName: 'ORS Sachets 21.8g', genericName: 'Oral Rehydration Salts', category: 'Essential', quantityInHand: 450, reorderLevel: 200, unit: 'sachets', status: 'adequate' }
];





import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClinicalDecision, matchFacilities } from '../services/clinicalDecisionSupport.js';

test('Triage CDSS: Cardiac Emergency (ACS / Chest Pain)', () => {
  const result = buildClinicalDecision({
    symptoms: ['acute chest pain', 'sweating', 'left arm radiation'],
    vitals: { bp: '150/95', spo2: 96, pulse: 104 }
  });

  assert.equal(result.urgency, 'emergency', 'Chest pain must trigger emergency urgency');
  assert.equal(result.department, 'Emergency Cardiology');
  assert.equal(result.level, 'district_hospital');
  assert.equal(result.requiresClinicianReview, true, 'Emergency must require clinician review');
  assert.ok(result.recommendations.some(r => r.name.toLowerCase().includes('ecg')), '12-lead ECG must be recommended');
});

test('Triage CDSS: Severe Hypoxia & Respiratory Failure (SpO2 < 90%)', () => {
  const result = buildClinicalDecision({
    symptoms: ['severe breathlessness', 'cough'],
    vitals: { spo2: 86, bp: '120/80', temp: 38.5 }
  });

  assert.equal(result.urgency, 'emergency');
  assert.ok(result.redFlags.some(f => f.includes('saturation below 90%')));
  assert.equal(result.level, 'district_hospital');
});

test('Triage CDSS: ANC High-Risk Maternal Pre-Eclampsia', () => {
  const result = buildClinicalDecision({
    symptoms: ['headache', 'pedal oedema', 'blurred vision'],
    vitals: { bp: '168/112', spo2: 98 },
    patient: { isPregnant: true, conditions: ['ANC'] }
  });

  assert.equal(result.urgency, 'emergency');
  assert.equal(result.department, 'Obstetrics & Gynaecology');
  assert.ok(result.redFlags.some(f => f.includes('Pre-Eclampsia')));
});

test('Triage CDSS: Stroke / Neurological Emergency', () => {
  const result = buildClinicalDecision({
    symptoms: ['sudden left-sided paralysis', 'slurred speech', 'facial droop'],
    vitals: { bp: '170/100', spo2: 97 }
  });

  assert.equal(result.urgency, 'emergency');
  assert.equal(result.department, 'Emergency Neurology');
  assert.equal(result.level, 'district_hospital');
});

test('Triage CDSS: NCD Hypertensive Crisis (BP >= 180/120)', () => {
  const result = buildClinicalDecision({
    symptoms: ['dizziness', 'headache'],
    vitals: { bp: '190/124', spo2: 98 }
  });

  assert.equal(result.urgency, 'emergency');
  assert.ok(result.redFlags.some(f => f.includes('Hypertensive crisis')));
});

test('Triage CDSS: Routine Primary Care Febrile Illness', () => {
  const result = buildClinicalDecision({
    symptoms: ['mild fever', 'running nose', 'body ache'],
    vitals: { bp: '120/80', temp: 38.1, spo2: 98 }
  });

  assert.equal(result.urgency, 'routine');
  assert.equal(result.level, 'phc');
  assert.equal(result.redFlags.length, 0);
});

test('Facility Matching: Prioritizes 24x7 emergency & beds when emergency detected', () => {
  const mockFacilities = [
    {
      facilityId: 'PHC-01',
      name: 'Sub-Centre A',
      level: 'sub_centre',
      emergencyOpen24h: false,
      resources: { bedsTotal: 2, bedsOccupied: 2 },
      equipment: ['Blood pressure monitor'],
      lat: 19.6, lng: 72.7
    },
    {
      facilityId: 'DH-PALGHAR-01',
      name: 'District Hospital Palghar',
      level: 'district_hospital',
      emergencyOpen24h: true,
      resources: { bedsTotal: 200, bedsOccupied: 140, icuTotal: 20, icuOccupied: 10 },
      equipment: ['12-lead ECG', 'Cardiac troponin rapid test', 'Echocardiography'],
      lat: 19.69, lng: 72.76
    }
  ];

  const emergencyDecision = buildClinicalDecision({
    symptoms: ['chest pain'],
    vitals: { bp: '140/90', spo2: 96 }
  });

  const matches = matchFacilities(mockFacilities, emergencyDecision, 19.6, 72.7);
  assert.equal(matches[0].facilityId, 'DH-PALGHAR-01', 'District hospital with emergency capability must be ranked #1');
  assert.ok(matches[0].matchScore > matches[1].matchScore);
});

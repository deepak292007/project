import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAffirmativeSymptoms,
  buildClinicalDecision,
  URGENCY_LEVELS
} from '../services/clinicalDecisionSupport.js';

test('Clinical Safety: Multilingual negation handling', () => {
  // English negation
  const enNeg = extractAffirmativeSymptoms(['no chest pain', 'headache', 'denies fever']);
  assert.deepEqual(enNeg.negated, ['chest pain', 'fever']);
  assert.deepEqual(enNeg.affirmative, ['headache']);

  // Marathi negation: छातीत दुखत नाही (no chest pain)
  const mrNeg = extractAffirmativeSymptoms(['छातीत दुखत नाही', 'डोकेदुखी']);
  assert.ok(mrNeg.negated.some(n => n.includes('छातीत दुखत')));
  assert.ok(mrNeg.affirmative.includes('डोकेदुखी'));

  // Telugu negation: ఛాతీ నొప్పి లేదు (no chest pain)
  const teNeg = extractAffirmativeSymptoms(['ఛాతీ నొప్పి లేదు', 'తలనెప్పి']);
  assert.ok(teNeg.negated.some(n => n.includes('ఛాతీ నొప్పి')));
  assert.ok(teNeg.affirmative.includes('తలనెప్పి'));

  // Negated emergency symptoms must NOT trigger cardiac emergency rule
  const decision = buildClinicalDecision({
    symptoms: ['no chest pain', 'mild headache'],
    vitals: { bp: '120/80', spo2: 98, pulse: 72 }
  });
  assert.notEqual(decision.urgency, URGENCY_LEVELS.EMERGENCY, 'Negated chest pain must not trigger emergency');
});

test('Clinical Safety: Cough alone must NEVER trigger an emergency rule', () => {
  const result = buildClinicalDecision({
    symptoms: ['cough', 'mild sore throat'],
    vitals: { bp: '118/76', spo2: 98, temp: 37.0 }
  });

  assert.equal(result.urgency, URGENCY_LEVELS.ROUTINE, 'Cough alone with normal vitals must be routine');
  assert.notEqual(result.urgency, URGENCY_LEVELS.EMERGENCY, 'Cough alone must never be an emergency');
  assert.equal(result.level, 'phc');
});

test('Clinical Safety: AI can escalate, but Safety Floor strictly prevents downgrade of rule-triggered emergency', () => {
  // 1. Severe cardiac symptoms with SpO2 96% and chest pain -> Rule triggers emergency
  const emergencyCase = {
    symptoms: ['severe crushing retrosternal chest pain', 'sweating'],
    vitals: { bp: '150/95', spo2: 96 }
  };

  // Attempt AI downgrade: future ML model attempts to suggest 'routine'
  const downgradeAttempt = buildClinicalDecision({
    ...emergencyCase,
    aiEscalation: { urgency: 'routine' }
  });

  assert.equal(
    downgradeAttempt.urgency,
    URGENCY_LEVELS.EMERGENCY,
    'Safety Floor must block AI downgrade of rule-triggered emergency'
  );
  assert.equal(downgradeAttempt.requiresClinicianReview, true);

  // 2. Routine case -> AI escalation to urgent IS permitted
  const routineCase = {
    symptoms: ['persistent low fever', 'mild cough'],
    vitals: { bp: '120/80', spo2: 97, temp: 37.8 }
  };

  const escalatedDecision = buildClinicalDecision({
    ...routineCase,
    aiEscalation: { urgency: 'urgent' }
  });

  assert.equal(
    escalatedDecision.urgency,
    URGENCY_LEVELS.URGENT,
    'Safety floor permits AI escalation of lower urgency to urgent'
  );
});

test('Clinical Safety: Non-diagnostic disclaimer and mandatory clinician review', () => {
  const result = buildClinicalDecision({
    symptoms: ['sudden facial weakness', 'slurred speech'],
    vitals: { bp: '160/100', spo2: 97 }
  });

  assert.equal(result.requiresClinicianReview, true, 'Clinician review flag must be true');
  assert.ok(
    result.disclaimer.includes('non-diagnostic') && result.disclaimer.includes('medical officer'),
    'Clinical disclaimer must emphasize non-diagnostic, assistive nature'
  );
});

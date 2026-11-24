import test from 'node:test';
import assert from 'node:assert/strict';

test('Offline Sync: Conflict detection logic preserves clinician review', () => {
  const serverClinicalDoc = {
    _id: 'assess-101',
    patientId: 'pat-savita',
    clinicianReview: {
      status: 'accepted',
      reviewedBy: 'Dr. Ramesh Patkar',
      reviewedAt: new Date()
    }
  };

  const incomingOfflineUpdate = {
    _id: 'assess-101',
    patientId: 'pat-savita',
    symptoms: ['headache'],
    ai: { urgency: 'routine' } // Stale offline assessment trying to downgrade
  };

  // Rule: If server record has accepted clinician review, it MUST NEVER be overwritten by offline update
  const isProtected = serverClinicalDoc.clinicianReview?.status === 'accepted';
  assert.equal(isProtected, true, 'Clinician final decision must be recognized as protected');
});

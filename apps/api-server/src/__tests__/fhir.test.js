import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toFHIRPatient,
  toFHIREncounter,
  toFHIRObservation,
  toFHIRServiceRequest,
  toFHIROrganization,
  wrapBundle
} from '../services/fhirAdapter.js';

test('FHIR R4 Adapter: Patient transformation with ABHA identifier', () => {
  const patientDoc = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Savita Patil',
    nameMarathi: 'सविता पाटील',
    abhaId: 'ABHA-MH-992144',
    age: 26,
    gender: 'F',
    village: 'Kelwa Gaon',
    district: 'Palghar',
    phone: '9822100000'
  };

  const fhirPatient = toFHIRPatient(patientDoc);

  assert.equal(fhirPatient.resourceType, 'Patient');
  assert.equal(fhirPatient.gender, 'female');
  assert.equal(fhirPatient.name[0].text, 'Savita Patil');
  assert.equal(fhirPatient.identifier[0].value, 'ABHA-MH-992144');
  assert.equal(fhirPatient.address[0].district, 'Palghar');
});

test('FHIR R4 Adapter: ServiceRequest referral transformation', () => {
  const referralDoc = {
    _id: '607f1f77bcf86cd799439022',
    patientId: '507f1f77bcf86cd799439011',
    fromFacilityId: 'PHC-KELWA-01',
    fromFacilityName: 'PHC Kelwa',
    toFacilityId: 'DH-PALGHAR-01',
    toFacilityName: 'District Hospital Palghar',
    urgency: 'emergency',
    diagnosis: ['Severe Pre-Eclampsia', 'Eclampsia Danger'],
    currentStage: 'initiated'
  };

  const fhirSR = toFHIRServiceRequest(referralDoc);

  assert.equal(fhirSR.resourceType, 'ServiceRequest');
  assert.equal(fhirSR.priority, 'stat');
  assert.equal(fhirSR.requester.reference, 'Organization/PHC-KELWA-01');
  assert.equal(fhirSR.performer[0].reference, 'Organization/DH-PALGHAR-01');
});

test('FHIR R4 Adapter: Bundle wrapper validation', () => {
  const resources = [
    { resourceType: 'Patient', id: 'pat-1' },
    { resourceType: 'Encounter', id: 'enc-1' }
  ];

  const bundle = wrapBundle(resources, 'collection');

  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.type, 'collection');
  assert.equal(bundle.total, 2);
  assert.equal(bundle.entry.length, 2);
  assert.equal(bundle.entry[0].resource.resourceType, 'Patient');
});

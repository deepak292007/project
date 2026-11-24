/**
 * HL7 FHIR R4 Compliant Data Models & Domain Interfaces for ArogyaLink
 * Rural Healthcare Access & Quality Support Platform
 * Aligned with Ayushman Bharat Digital Mission (ABDM) & National Health Mission standards.
 */

export type AdministrativeGender = 'male' | 'female' | 'other' | 'unknown';

export interface Identifier {
  system: string;
  value: string;
  type?: {
    text: string;
    coding?: Array<{ system: string; code: string; display: string }>;
  };
}

export interface HumanName {
  use?: 'official' | 'usual' | 'nickname';
  text: string;
  family?: string;
  given?: string[];
}

export interface ContactPoint {
  system: 'phone' | 'email' | 'sms';
  value: string;
  use?: 'home' | 'work' | 'mobile';
}

export interface Address {
  use?: 'home' | 'work';
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Identifier[]; // e.g. ABHA ID, Aadhaar, Local ID
  active: boolean;
  name: HumanName[];
  telecom?: ContactPoint[];
  gender: AdministrativeGender;
  birthDate?: string;
  age?: number;
  address?: Address[];
  guardianName?: string;
  village?: string;
  subCentreId?: string;
  phcId?: string;
  isHighRisk?: boolean;
  highRiskCategories?: ('ANC' | 'PNC' | 'IMCI' | 'Hypertension' | 'Diabetes' | 'TB' | 'Severe')[];
  bloodGroup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalsObservation {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  spO2?: number;
  temperature?: number; // in Celsius
  bloodGlucoseMgDl?: number;
  hemoglobinGdl?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  fetalHeartRate?: number; // for ANC
  gestationalWeeks?: number; // for ANC
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category: 'vital-signs' | 'laboratory' | 'imaging' | 'triage' | 'social-history';
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  subject: {
    reference: string; // Patient/id
    display: string;
  };
  encounterId?: string;
  effectiveDateTime: string;
  performer?: {
    id: string;
    name: string;
    role: 'CHW' | 'ANM' | 'StaffNurse' | 'MedicalOfficer' | 'Specialist';
  };
  valueQuantity?: {
    value: number | string;
    unit?: string;
    system?: string;
    code?: string;
  };
  interpretation?: Array<{
    coding?: Array<{ system: string; code: string; display: string }>;
    text: string;
  }>;
  vitals?: VitalsObservation;
  notes?: string;
}

export interface TriageEvaluation {
  riskTier: 'RED' | 'YELLOW' | 'GREEN';
  riskScore: number;
  flaggedConditions: string[];
  recommendedAction: string;
  escalationRequired: boolean;
  departmentRecommendation: string;
  ruleVersion?: string;
  guidelineReference?: string;
  confidence?: number;
  requiresClinicianReview?: boolean;
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'resolved' | 'remission' | 'inactive';
  verificationStatus: 'provisional' | 'confirmed' | 'differential' | 'refuted';
  category: 'problem-list-item' | 'encounter-diagnosis' | 'health-concern';
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  code: {
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  };
  subject: {
    reference: string;
    display: string;
  };
  onsetDate?: string;
  recordedDate: string;
  notes?: string;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  class: 'teleconsult' | 'outpatient' | 'emergency' | 'home-visit' | 'inpatient';
  type: 'general-consult' | 'specialist-teleconsult' | 'anc-checkup' | 'immunization' | 'ncd-followup' | 'emergency';
  subject: {
    reference: string;
    display: string;
    gender: AdministrativeGender;
    age?: number;
    village?: string;
    abhaId?: string;
  };
  serviceProvider: {
    facilityId: string;
    facilityName: string;
    facilityType: 'SubCentre' | 'PHC' | 'CHC' | 'RuralHospital' | 'DistrictHospital' | 'MedicalCollege';
  };
  participant: Array<{
    individual: {
      id: string;
      name: string;
      role: 'CHW' | 'ANM' | 'MedicalOfficer' | 'Specialist' | 'StaffNurse';
      specialty?: string;
    };
  }>;
  period: {
    start: string;
    end?: string;
  };
  chiefComplaints: string[];
  vitals?: VitalsObservation;
  triage?: TriageEvaluation;
  diagnoses?: string[];
  teleconsultRoomId?: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface FHIRServiceRequest {
  resourceType: 'ServiceRequest';
  id: string;
  status: 'draft' | 'active' | 'on-hold' | 'completed' | 'revoked';
  intent: 'order' | 'referral';
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  subject: {
    reference: string;
    display: string;
  };
  encounterId?: string;
  originFacility: {
    id: string;
    name: string;
    tier: 'SubCentre' | 'PHC' | 'CHC' | 'RuralHospital';
  };
  targetFacility: {
    id: string;
    name: string;
    tier: 'PHC' | 'CHC' | 'RuralHospital' | 'DistrictHospital' | 'SpecialistHub';
  };
  specialtyRequired: string;
  reasonCode: string[];
  clinicalSummary: string;
  appointmentDate?: string;
  scheduledTimeSlot?: string;
  closedLoopStatus: 'Issued' | 'SlotBooked' | 'ArrivedAtHub' | 'Consulted' | 'CounterReferred' | 'Discharged';
  counterReferralAdvice?: {
    specialistNotes: string;
    prescribedPlan: string;
    chwFollowUpDate?: string;
    completedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: 'Once a day' | 'Twice a day' | 'Three times a day' | 'Four times a day' | 'As needed (SOS)';
  durationDays: number;
  instructions: string;
  isAvailableAtPHC?: boolean;
}

export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  intent: 'order';
  subject: {
    reference: string;
    display: string;
  };
  encounterId?: string;
  authoredOn: string;
  requester: {
    id: string;
    name: string;
    registrationNumber?: string;
    designation: string;
    digitalSignatureHash?: string;
  };
  medications: MedicationItem[];
  adviceAndLifestyle: string[];
  followUpDate?: string;
  dispensedStatus: 'pending' | 'partially-dispensed' | 'fully-dispensed';
}

export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category: 'PoCT' | 'Biochemistry' | 'Hematology' | 'Radiology' | 'ECG';
  code: {
    text: string;
    coding?: Array<{ system: string; code: string; display: string }>;
  };
  subject: {
    reference: string;
    display: string;
  };
  encounterId?: string;
  effectiveDateTime: string;
  issued: string;
  results: Array<{
    testName: string;
    value: string | number;
    unit?: string;
    referenceRange?: string;
    isAbnormal: boolean;
  }>;
  attachmentUrl?: string;
  interpretation?: string;
}

export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  serviceType: string;
  specialty?: string;
  participant: Array<{
    actor: { reference: string; display: string };
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  start: string;
  end?: string;
  description?: string;
}

export interface FHIROrganization {
  resourceType: 'Organization';
  id: string;
  identifier: Identifier[];
  active: boolean;
  type: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
    text: string;
  }>;
  name: string;
  telecom?: ContactPoint[];
  address?: Address[];
}

export interface FHIRLocation {
  resourceType: 'Location';
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'inactive';
  type: 'SubCentre' | 'PHC' | 'CHC' | 'RuralHospital' | 'DistrictHospital' | 'MedicalCollege';
  district: string;
  block: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  telehealthEnabled: boolean;
  doctorsAvailable: number;
  specialistsAvailable: string[];
  diagnosticsAvailable: string[];
  contactPhone: string;
}

export interface FHIRConsent {
  resourceType: 'Consent';
  id: string;
  status: 'draft' | 'active' | 'inactive' | 'entered-in-error';
  scope: {
    coding: Array<{ system: string; code: string; display: string }>;
  };
  category: Array<{
    coding: Array<{ system: string; code: string; display: string }>;
  }>;
  patient: {
    reference: string;
    display: string;
  };
  dateTime: string;
  performer?: Array<{
    reference: string;
    display: string;
  }>;
  organization?: Array<{
    reference: string;
    display: string;
  }>;
  provision?: {
    type: 'deny' | 'permit';
    period?: { start: string; end?: string };
  };
}

export interface FHIRBundleEntry<T = any> {
  fullUrl: string;
  resource: T;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'collection' | 'searchset' | 'transaction' | 'batch';
  timestamp: string;
  total?: number;
  entry: FHIRBundleEntry[];
}

export interface HighRiskTask {
  id: string;
  patientId: string;
  patientName: string;
  village: string;
  category: 'ANC_Checkup' | 'Immunization' | 'Hypertension_Review' | 'Diabetes_Followup' | 'Post_Discharge' | 'TB_DOTS';
  dueDate: string;
  priority: 'HIGH' | 'URGENT' | 'ROUTINE';
  status: 'PENDING' | 'VISITED' | 'OVERDUE' | 'ESCALATED';
  instructions: string;
  assignedCHWId: string;
  lastContactDate?: string;
}

export interface EmergencySOSAlert {
  id: string;
  patientId?: string;
  patientName?: string;
  chwId: string;
  chwName: string;
  chwPhone: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  emergencyType: 'Maternal Shock / Postpartum Hemorrhage' | 'Acute Respiratory Distress' | 'Severe Cardiac / Chest Pain' | 'Snake Bite / Poisoning' | 'Severe Pediatric Trauma / Convulsion' | 'General Emergency';
  vitalsSummary?: VitalsObservation;
  criticalNotes: string;
  timestamp: string;
  status: 'ACTIVE' | 'AMBULANCE_DISPATCHED' | 'ADMITTED' | 'RESOLVED';
  dispatchedToFacility?: {
    id: string;
    name: string;
    etaMinutes: number;
  };
}

// ================================================================
// ArogyaLink — Domain Types
// FHIR R4-aligned where applicable
// Government of Maharashtra · SIH 2026 · Problem 26133
// ================================================================

export type Lang = 'en' | 'hi' | 'mr' | 'te' | 'kn';

export type Role =
  | 'patient'
  | 'asha'
  | 'phc_doctor'
  | 'hospital_admin'
  | 'hospital_doctor'
  | 'district_admin';

export type RiskCategory = 'high' | 'moderate' | 'low';
export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'elective';
export type Gender = 'M' | 'F' | 'O';
export type RationCard = 'BPL' | 'AAY' | 'APL' | 'None';

export type FacilityLevel =
  | 'sub_centre'
  | 'phc'
  | 'rural_hospital'
  | 'district_hospital'
  | 'civil_hospital';

export type ReferralStage =
  | 'initiated'
  | 'accepted'
  | 'transport_arranged'
  | 'patient_en_route'
  | 'arrived'
  | 'under_treatment'
  | 'discharged'
  | 'follow_up_due';

export type EncounterType =
  | 'OPD'
  | 'ANC'
  | 'Immunization'
  | 'Teleconsult'
  | 'Emergency'
  | 'FollowUp';

export type EncounterStatus =
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type StockStatus = 'adequate' | 'low' | 'critical' | 'stockout';

// ─── Vitals ───────────────────────────────────────────────────────
export interface Vitals {
  bp?: string;          // e.g. "120/80"
  pulse?: number;       // bpm
  temp?: number;        // °C
  spo2?: number;        // %
  weight?: number;      // kg
  height?: number;      // cm
  recordedAt?: string;
  recordedBy?: string;
}

// ─── Triage ───────────────────────────────────────────────────────
export interface TriageResult {
  urgency: UrgencyLevel;
  urgencyLabel?: string;
  urgencyScore?: number;
  suggestedDept: string;
  suggestedFacilityLevel: FacilityLevel;
  clinicalReasoning: string;
  differentialDiagnosis?: string[];
  redFlagsDetected?: string[];
  homeCareAdvice?: string;
  diagnosticsNeeded: string[];
  aiModel: string;
  disclaimer?: string;
  confirmedByDoctor?: boolean;
  doctorName?: string;
  confirmedAt?: string;
  // ─── lnkling enrichment fields (optional — rendered only when present) ──────
  patientMessage?: string;      // ≤2 sentence patient guidance in their language
  ashaMessage?: string;         // Bullet-style field-worker checklist
  reasons?: string[];           // Plain-language triage reasons
  specialty?: string;           // Clinical specialty
  priority?: 'emergency' | 'priority' | 'normal';
  language?: Lang;              // Language the messages are in
  lnklingOffline?: boolean;     // true when fallback mock was used
}

// ─── lnkling AI Triage Result (full type — mirrors server LnklingTriageResult) ─
export interface LnklingTriageResult {
  urgency: 'low' | 'moderate' | 'high';
  opDepartment: string;
  priority: 'emergency' | 'priority' | 'normal';
  specialty: string;
  reasons: string[];
  suggestedDiagnostics: string[];
  patientMessage: string;
  ashaMessage: string;
  language: Lang;
  model: 'lnkling';
  disclaimer: string;
  offline?: boolean;
}


// ─── Long-Distance Access & Transport (Rwanda/China/India NHM) ─────
export interface TransportDispatch {
  _id: string;
  bookingId: string;
  patientId: string | Patient;
  serviceType: '108_emergency' | '102_janani_maternity' | 'mmu_shuttle' | 'patient_transport_voucher';
  pickupLocation: {
    village: string;
    facilityId: string;
    facilityName: string;
    lat?: number;
    lng?: number;
    address?: string;
  };
  dropoffLocation: {
    facilityId: string;
    facilityName: string;
    lat?: number;
    lng?: number;
    address?: string;
  };
  intermediateWaypoint?: {
    facilityId: string;
    facilityName: string;
    facilityLevel: string;
    reason: string;
    kmFromPickup: number;
    estArrivalMin: number;
  };
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  emtName?: string;
  currentStatus: 'dispatched' | 'at_pickup' | 'stabilizing_at_waypoint' | 'en_route' | 'arrived_hospital' | 'completed' | 'cancelled';
  liveTelemetry?: {
    currentLat: number;
    currentLng: number;
    speedKmph: number;
    etaMinutes: number;
    distanceRemainingKm: number;
    oxygenSupplyAvailable: boolean;
  };
  govSchemeCovered?: {
    schemeName: string;
    isFreeOfCost: boolean;
    voucherCode: string;
  };
  dispatchedAt: string;
}

export interface MedicineDeliveryRequest {
  _id?: string;
  requestId: string;
  patientName: string;
  patientPhone: string;
  abhaId?: string;
  village?: string;
  district?: string;
  state?: string;
  deliveryAddress: string;
  symptoms: string[];
  clinicalUrgency?: 'routine' | 'mild' | 'urgent';
  prescribedMedicines: Array<{
    medicineName: string;
    dosage: string;
    quantity: number;
    instructions?: string;
  }>;
  dispensingFacilityId?: string;
  dispensingFacilityName?: string;
  assignedAshaId?: string;
  assignedAshaName?: string;
  assignedAshaPhone?: string;
  status: 'requested' | 'phc_approved' | 'dispatched_with_asha' | 'delivered' | 'cancelled';
  estimatedDeliveryHours?: number;
  requestedAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface OPBookingRecord {
  _id?: string;
  bookingId: string;
  tokenNumber: string;
  patientName: string;
  abhaId?: string;
  phone?: string;
  facilityId: string;
  facilityName: string;
  department: string;
  doctorName: string;
  bookingDate?: string;
  slotTime: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  priorityScore?: number;
  status: 'confirmed' | 'called_in' | 'in_consultation' | 'completed' | 'cancelled';
  symptoms: string[];
  clinicalUrgency?: string;
  consultationFee?: number;
}

export interface DiagnosticSample {
  _id: string;
  sampleBarcode: string;
  patientId: string | Patient;
  patientName: string;
  abhaId?: string;
  collectedAtFacilityId: string;
  collectedAtFacilityName: string;
  collectedBy: string;
  testTypes: string[];
  urgency: UrgencyLevel;
  status: 'collected' | 'in_transit_courier' | 'received_at_hub_lab' | 'processing' | 'completed' | 'report_ready';
  destinationLabName: string;
  transitDetails?: {
    courierName: string;
    transitMethod: string;
    estArrivalAtLab: string;
  };
  results?: Array<{
    testName: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
  collectedAt: string;
}

export interface MMUCamp {
  _id: string;
  campId: string;
  village: string;
  block: string;
  district: string;
  scheduledDate: string;
  timings: string;
  teamLeadDoctor: string;
  specialtiesAvailable: string[];
  equipmentOnboard: string[];
  targetVillagesCovered: string[];
  ashaContact: string;
  ashaPhone: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

// ─── Patient ──────────────────────────────────────────────────────
export interface Patient {
  _id: string;
  abhaId?: string;
  name: string;
  nameMarathi?: string;
  age: number;
  gender: Gender;
  dob?: string;
  village: string;
  block?: string;
  district: string;
  state: string;
  phone?: string;
  asha?: string;
  ashaPhone?: string;
  rationCardCategory: RationCard;
  riskCategory: RiskCategory;
  conditions: string[];
  latestVitals?: Vitals;
  registeredAt?: string;
  lastSeen?: string;
}

// ─── Encounter ────────────────────────────────────────────────────
export interface Encounter {
  _id: string;
  patientId: string | Patient;
  facilityId: string;
  facilityName: string;
  type: EncounterType;
  department?: string;
  token?: string;
  queuePosition?: number;
  status: EncounterStatus;
  chiefComplaint?: string;
  complaints?: string[];
  vitals?: Vitals;
  triageResult?: TriageResult;
  notes?: string;
  diagnosis?: string[];
  icd10?: string[];
  conductedAt?: string;
  conductedBy?: string;
  role?: string;
}

// ─── Referral ─────────────────────────────────────────────────────
export interface ReferralStageEntry {
  stage: ReferralStage;
  updatedBy: string;
  role: string;
  facilityId?: string;
  notes?: string;
  timestamp: string;
}

export interface Referral {
  _id: string;
  patientId: string | Patient;
  encounterId?: string;
  fromFacilityId: string;
  fromFacilityName: string;
  toFacilityId: string;
  toFacilityName: string;
  urgency: UrgencyLevel;
  reason: string;
  diagnosis: string[];
  diagnosticsRequested: string[];
  specialistRequired?: string;
  currentStage: ReferralStage;
  stageHistory: ReferralStageEntry[];
  ambulanceNumber?: string;
  driverPhone?: string;
  estimatedArrival?: string;
  dischargeNotes?: string;
  followUpDate?: string;
  followUpCompleted?: boolean;
  initiatedAt: string;
  initiatedBy: string;
  closedAt?: string;
}

// ─── Facility ────────────────────────────────────────────────────
export interface FacilityResources {
  bedsTotal: number;
  bedsOccupied: number;
  icuTotal: number;
  icuOccupied: number;
  oxygenBeds: number;
  oxygenOccupied: number;
  ventilators: number;
  ventilatorsInUse: number;
  ambulances: number;
  ambulancesAvailable: number;
  operatingTheatres: number;
  otAvailable: number;
}

export interface DiagnosticCapability {
  name: string;
  available: boolean;
  slots: number;
  waitHrs: number;
}

export interface FacilityDoctor {
  name: string;
  specialty: string;
  availableToday: boolean;
  teleconsultAvailable: boolean;
  nextSlot: string;
}

export interface Facility {
  _id?: string;
  facilityId: string;
  name: string;
  nameTelugu?: string;
  nameKannada?: string;
  nameMarathi?: string;
  nameHindi?: string;
  type?: string;
  level: FacilityLevel | string;
  block?: string;
  district: string;
  city?: string;
  state: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  beds?: number;
  icuBeds?: number;
  oxygenAvailable?: boolean;
  specialties?: string[];
  specialistsAvailableToday?: string[];
  currentOPLoad?: 'Low' | 'Medium' | 'High';
  empanelledSchemes?: string[];
  isEmergencyCapable?: boolean;
  matchScore?: number;
  rank?: number;
  distKm?: number;
  travelMin?: number;
  bedsAvailable?: number;
  icuAvailable?: number;
  operationalHighlight?: string;
  primaryReason?: string;
  greenChannelEligible?: boolean;
  clinicalSuitability?: 'ideal' | 'acceptable' | 'suboptimal';
  recommendedAction?: string;
  resources?: FacilityResources;
  diagnostics?: DiagnosticCapability[];
  doctors?: FacilityDoctor[];
  departments?: string[];
  emergencyOpen24h?: boolean;
  lastUpdated?: string;
}

// ─── Stock ────────────────────────────────────────────────────────
export interface StockItem {
  _id: string;
  facilityId: string;
  facilityName: string;
  medicineName: string;
  genericName?: string;
  category: 'Essential' | 'Vaccine' | 'Contraceptive' | 'Supplement' | 'Emergency' | 'Diagnostic';
  quantityInHand: number;
  reorderLevel: number;
  unit: string;
  expiryDate?: string;
  status: StockStatus;
}

// ─── Follow-up ────────────────────────────────────────────────────
export interface Followup {
  _id: string;
  patientId: string | Patient;
  ashaWorker: string;
  ashaPhone?: string;
  facilityId?: string;
  type: 'ANC' | 'Immunization' | 'NCD' | 'PostDischarge' | 'PostReferral' | 'Routine';
  dueDate: string;
  priority: RiskCategory;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  visitNotes?: string;
  nextDueDate?: string;
}

// ─── Feedback ─────────────────────────────────────────────────────
export interface FeedbackItem {
  _id: string;
  patientId?: string;
  facilityId?: string;
  category: 'OPD' | 'Referral' | 'Teleconsult' | 'ASHA' | 'General';
  rating?: number;
  waitTimeRating?: number;
  staffBehaviorRating?: number;
  cleanliness?: number;
  comment?: string;
  anonymous?: boolean;
  lang?: Lang;
  submittedAt?: string;
}

// ─── Audit ────────────────────────────────────────────────────────
export interface AuditEntry {
  _id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  role?: string;
  facilityId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ─── Analytics ───────────────────────────────────────────────────
export interface KPIs {
  totalPatients: number;
  highRisk: number;
  totalReferrals: number;
  completedReferrals: number;
  referralCompletionRate?: number; // %
  avgTAT: number;                 // hours
  stockAlerts: number;
  pendingFollowups: number;
  avgBedOccupancy: number;        // %
  referralsByStage?: Partial<Record<ReferralStage, number>>;
  urgencyMix?: Record<string, number>;
  riskBreakdown?: Array<{ name: string; value: number; color?: string }>;
  highRiskSummary?: {
    ancHighRisk: number;
    hypertension: number;
    diabetes: number;
    pediatric: number;
    cardiac: number;
  };
  opQueueByDept?: Array<{ dept: string; waiting: number; emergency: number }>;
  dailyFootfall?: Array<{ date: string; total: number; opd: number; emergency: number; completed: number }>;
  stockBreakdown?: Array<{ name: string; value: number; color?: string }>;
  criticalStockList?: Array<{
    medicineName: string;
    facilityName?: string;
    category?: string;
    quantityInHand: number;
    reorderLevel: number;
    unit?: string;
    status: string;
  }>;
  facilityLoad?: Array<{
    facilityId: string;
    name: string;
    district: string;
    bedsTotal: number;
    bedsOccupied: number;
    occupancyPct: number;
    currentOPLoad: string;
    queueLength: number;
  }>;
  aiInsights?: string[];
  aiInsightsSource?: string;
  aiInsightsGeneratedAt?: string;
  isAI?: boolean;
}

// ─── Session ─────────────────────────────────────────────────────
export interface UserSession {
  role: Role;
  name: string;
  facilityId?: string;
  facilityName?: string;
  lang: Lang;
  online: boolean;
}

// ─── Offline queue ───────────────────────────────────────────────
export interface PendingRecord {
  id: string;
  type: 'encounter' | 'followup' | 'patient';
  data: Record<string, unknown>;
  createdAt: string;
}

// ─── Facility match scoring ───────────────────────────────────────
export interface FacilityMatchResult {
  facility: Facility;
  score: number;          // 0–100
  travelMins: number;
  bedAvailPct: number;
  specialistAvailable: boolean;
  diagnosticsAvailable: string[];
  diagnosticsMissing: string[];
  teleconsultOption: boolean;
  recommendation: 'refer' | 'teleconsult' | 'treat_here';
}

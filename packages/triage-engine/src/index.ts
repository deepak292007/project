import { VitalsObservation, TriageEvaluation } from '@srhacp/fhir-models';
import { CLINICAL_RULES_REGISTRY } from './rules';

export * from './rules';

export interface ClinicalTriageInput {
  vitals: VitalsObservation | Record<string, any>;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'unknown' | string;
  isPregnant?: boolean;
  chiefSymptoms?: string[];
  knownConditions?: string[];
  patient?: any;
}

export interface UnifiedClinicalDecision {
  urgency: 'emergency' | 'urgent' | 'routine' | 'home_care';
  riskTier: 'RED' | 'YELLOW' | 'GREEN';
  riskScore: number;
  department: string;
  facilityLevel: 'sub_centre' | 'phc' | 'rural_hospital' | 'district_hospital';
  ruleId: string;
  ruleVersion: string;
  guidelineReference: string;
  redFlags: string[];
  differentialDiagnosis: string[];
  recommendedDiagnostics: string[];
  confidence: number;
  requiresClinicianReview: boolean;
  summary: string;
  disclaimer: string;
}

/**
 * Unified Clinical Decision Support Engine (CDSS)
 * Strictly provides EXPLAINABLE DECISION SUPPORT to clinicians and frontline workers.
 * Never acts as an autonomous diagnosis or prescription tool.
 */
export function evaluateClinicalDecision(input: ClinicalTriageInput): UnifiedClinicalDecision {
  const { vitals = {}, chiefSymptoms = [], knownConditions = [], isPregnant, patient = {} } = input;
  const combinedPatient = { ...patient, isPregnant: isPregnant ?? patient.isPregnant, conditions: knownConditions.length ? knownConditions : patient.conditions };

  // Evaluate against versioned rule registry in priority order (Emergency > Urgent > Routine)
  for (const rule of CLINICAL_RULES_REGISTRY) {
    const res = rule.evaluator(vitals, chiefSymptoms, combinedPatient);
    if (res.matched) {
      const urgency = res.urgency || 'routine';
      const riskTier = urgency === 'emergency' ? 'RED' : urgency === 'urgent' ? 'YELLOW' : 'GREEN';
      const riskScore = urgency === 'emergency' ? 95 : urgency === 'urgent' ? 70 : 35;
      const requiresClinicianReview = urgency === 'emergency' || urgency === 'urgent';

      return {
        urgency,
        riskTier,
        riskScore,
        department: rule.department,
        facilityLevel: rule.facilityLevel,
        ruleId: rule.id,
        ruleVersion: rule.version,
        guidelineReference: rule.guidelineReference,
        redFlags: res.redFlags || [],
        differentialDiagnosis: res.differentials || [],
        recommendedDiagnostics: res.diagnostics || [],
        confidence: res.confidence || 0.85,
        requiresClinicianReview,
        summary: `Decision Support: Triggered ${rule.id} (v${rule.version}) under ${rule.guidelineReference}. Urgency evaluated as ${urgency.toUpperCase()}.`,
        disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. All clinical actions, prescriptions, and escalations require confirmation by a qualified medical officer.'
      };
    }
  }

  // Default Primary Care Routine fallback
  return {
    urgency: 'routine',
    riskTier: 'GREEN',
    riskScore: 25,
    department: 'General OPD',
    facilityLevel: 'sub_centre',
    ruleId: 'RULE-GEN-001',
    ruleVersion: '1.0.0',
    guidelineReference: 'MoHFW Primary Care Guidelines (2024)',
    redFlags: [],
    differentialDiagnosis: ['General Outpatient Wellness & Routine Screening — 100%'],
    recommendedDiagnostics: ['Baseline Vitals Screening', 'General Medical Consultation'],
    confidence: 0.80,
    requiresClinicianReview: false,
    summary: 'Symptoms and vitals within normal routine outpatient parameters. Standard PHC/Sub-Centre care indicated.',
    disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. All clinical actions require confirmation by a qualified medical officer.'
  };
}

/**
 * Backward-compatible evaluation function conforming to FHIREncounter.triage interface
 */
export function evaluateClinicalTriage(input: ClinicalTriageInput): TriageEvaluation {
  const decision = evaluateClinicalDecision(input);
  return {
    riskTier: decision.riskTier,
    riskScore: decision.riskScore,
    flaggedConditions: decision.redFlags.length ? decision.redFlags : decision.differentialDiagnosis,
    recommendedAction: decision.summary,
    escalationRequired: decision.urgency === 'emergency',
    departmentRecommendation: decision.department,
    ruleVersion: decision.ruleVersion,
    guidelineReference: decision.guidelineReference,
    confidence: decision.confidence,
    requiresClinicianReview: decision.requiresClinicianReview
  };
}

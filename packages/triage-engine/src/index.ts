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
  aiEscalation?: { urgency: 'emergency' | 'urgent' | 'routine' | 'home_care' };
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
  safetyFloorTriggered?: boolean;
}

const URGENCY_RANK = {
  emergency: 4,
  urgent: 3,
  routine: 2,
  home_care: 1
};

/**
 * Filter out negated complaints from symptom list
 */
function extractAffirmative(symptoms: string[] = []): string[] {
  const negatedKeywords = new Set<string>();
  const clean: string[] = [];

  for (const raw of symptoms) {
    const text = String(raw || '').toLowerCase().trim();
    if (!text) continue;

    const matchNo = text.match(/\b(?:no|denies|without|not having)\s+([a-z0-9\s]+)/i);
    if (matchNo && matchNo[1]) {
      negatedKeywords.add(matchNo[1].trim());
      continue;
    }
    if (text.includes('nahi') || text.includes('नहीं') || text.includes('नाही') || text.includes('లేదు') || text.includes('ఇಲ್ಲ')) {
      const cleaned = text.replace(/nahi\s*hai|nahi|नहीं\s*है|नहीं|नाही|नाहीत|లేదు|ఇల్ల|illa/gi, '').trim();
      if (cleaned) negatedKeywords.add(cleaned);
      continue;
    }
    clean.push(text);
  }

  return clean.filter(sym => {
    for (const neg of negatedKeywords) {
      if (neg && (sym.includes(neg) || neg.includes(sym))) return false;
    }
    return true;
  });
}

/**
 * Unified Clinical Decision Support Engine (CDSS)
 * Strictly provides EXPLAINABLE DECISION SUPPORT to clinicians and frontline workers.
 * Never acts as an autonomous diagnosis or prescription tool.
 * Consolidates highest-severity rule evaluation, negation handling, cough non-escalation, and non-downgradable safety floor.
 */
export function evaluateClinicalDecision(input: ClinicalTriageInput): UnifiedClinicalDecision {
  const { vitals = {}, chiefSymptoms = [], knownConditions = [], isPregnant, patient = {}, aiEscalation } = input;
  const affirmativeSymptoms = extractAffirmative(chiefSymptoms);
  const combinedPatient = { ...patient, isPregnant: isPregnant ?? patient.isPregnant, conditions: knownConditions.length ? knownConditions : patient.conditions };

  // Evaluate against all rules and collect all matches
  const matchedEvaluations: Array<{
    rule: typeof CLINICAL_RULES_REGISTRY[0];
    res: ReturnType<typeof CLINICAL_RULES_REGISTRY[0]['evaluator']>;
  }> = [];

  for (const rule of CLINICAL_RULES_REGISTRY) {
    const res = rule.evaluator(vitals, affirmativeSymptoms, combinedPatient);
    if (res.matched) {
      matchedEvaluations.push({ rule, res });
    }
  }

  // Select highest-severity applicable rule
  let chosenEntry = matchedEvaluations[0] || null;
  let highestRank = 0;

  for (const entry of matchedEvaluations) {
    const urgency = entry.res.urgency || 'routine';
    const rank = URGENCY_RANK[urgency] || 2;
    if (rank > highestRank) {
      highestRank = rank;
      chosenEntry = entry;
    }
  }

  // Critical Vitals Red-Flags (Safety Floor)
  const vAny = vitals as Record<string, any>;
  const spo2 = Number(vAny.spO2 || vAny.spo2 || 0);
  const systolic = Number(String(vAny.systolicBP || (vAny.bp ? String(vAny.bp).split('/')[0] : 0))) || 0;
  const diastolic = Number(String(vAny.diastolicBP || (vAny.bp ? String(vAny.bp).split('/')[1] : 0))) || 0;

  const redFlags: string[] = chosenEntry?.res.redFlags ? [...chosenEntry.res.redFlags] : [];
  if (spo2 > 0 && spo2 < 90 && !redFlags.some(f => f.includes('< 90%'))) {
    redFlags.push(`Critical oxygen saturation below 90% (${spo2}%)`);
  }
  if ((systolic >= 180 || diastolic >= 120) && !redFlags.some(f => f.includes('Hypertensive'))) {
    redFlags.push(`Hypertensive crisis (BP ${systolic}/${diastolic} mmHg)`);
  }
  if (combinedPatient.isPregnant && (systolic >= 160 || diastolic >= 110) && !redFlags.some(f => f.includes('Pre-Eclampsia'))) {
    redFlags.push(`Severe Pre-Eclampsia Danger (BP ${systolic}/${diastolic} mmHg in pregnancy)`);
  }

  let ruleUrgency: 'emergency' | 'urgent' | 'routine' | 'home_care' =
    redFlags.length ? 'emergency' : (chosenEntry?.res.urgency || 'routine');

  // Check safety floor against AI escalation
  let finalUrgency = ruleUrgency;
  let safetyFloorTriggered = false;

  if (aiEscalation && aiEscalation.urgency) {
    const aiRank = URGENCY_RANK[aiEscalation.urgency] || 2;
    const ruleRank = URGENCY_RANK[ruleUrgency] || 2;
    if (aiRank > ruleRank) {
      finalUrgency = aiEscalation.urgency;
    } else if (aiRank < ruleRank) {
      finalUrgency = ruleUrgency;
      safetyFloorTriggered = true; // Attempted downgrade was blocked
    }
  }

  const riskTier = finalUrgency === 'emergency' ? 'RED' : finalUrgency === 'urgent' ? 'YELLOW' : 'GREEN';
  const riskScore = finalUrgency === 'emergency' ? 95 : finalUrgency === 'urgent' ? 70 : finalUrgency === 'home_care' ? 15 : 35;
  const requiresClinicianReview = true; // Always require clinician review

  if (chosenEntry) {
    const { rule, res } = chosenEntry;
    return {
      urgency: finalUrgency,
      riskTier,
      riskScore,
      department: rule.department,
      facilityLevel: finalUrgency === 'emergency' ? 'district_hospital' : rule.facilityLevel,
      ruleId: rule.id,
      ruleVersion: rule.version,
      guidelineReference: rule.guidelineReference,
      redFlags,
      differentialDiagnosis: res.differentials || [],
      recommendedDiagnostics: res.diagnostics || [],
      confidence: redFlags.length ? 0.95 : res.confidence || 0.85,
      requiresClinicianReview,
      summary: `Clinical Decision Support: Evaluated under ${rule.guidelineReference}. Urgency: ${finalUrgency.toUpperCase()}.${safetyFloorTriggered ? ' (Safety floor enforced against AI downgrade).' : ''}`,
      disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. Strictly non-diagnostic; all clinical actions require clinician confirmation.',
      safetyFloorTriggered
    };
  }

  // Default Primary Care Routine fallback
  return {
    urgency: finalUrgency,
    riskTier: 'GREEN',
    riskScore: 25,
    department: 'General OPD',
    facilityLevel: 'sub_centre',
    ruleId: 'RULE-GEN-001',
    ruleVersion: '1.0.0',
    guidelineReference: 'MoHFW Primary Care Guidelines (2024)',
    redFlags,
    differentialDiagnosis: ['General Outpatient Wellness & Routine Screening — 100%'],
    recommendedDiagnostics: ['Baseline Vitals Screening', 'General Medical Consultation'],
    confidence: 0.80,
    requiresClinicianReview: true,
    summary: 'Symptoms and vitals within normal routine outpatient parameters. Standard PHC/Sub-Centre care indicated.',
    disclaimer: 'Clinical Decision Support: Algorithmic assessment for healthcare workers. Strictly non-diagnostic; all clinical actions require clinician confirmation.',
    safetyFloorTriggered
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

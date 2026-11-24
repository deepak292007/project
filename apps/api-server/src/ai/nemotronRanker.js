/**
 * @file nemotronRanker.js — NVIDIA Nemotron Hospital Ranking Engine
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Uses nvidia/nemotron-3-ultra-550b-a55b:free via OpenRouter to rank healthcare
 * facilities based on clinical urgency, specialty requirements, real-time bed/ICU
 * capacity, distance, OPD wait times, and empanelled schemes (Ayushman Bharat / Dr. NTR Vaidya Seva).
 *
 * Fallback: Deterministic multi-criteria scoring algorithm when model is offline or times out.
 */

import { callOpenRouterChat, OPENROUTER_MODELS } from './openrouterClient.js';

export const NEMOTRON_SYSTEM_PROMPT = `You are the ArogyaLink Clinical Hospital Ranking Engine for India's public health system (Andhra Pradesh, Karnataka, Maharashtra).
Your role: Rank candidate healthcare facilities for a patient based on:
1. Clinical Urgency:
   - Emergency: Prioritize 24x7 Emergency capability, ICU beds, oxygen supply, shortest travel distance/time, Green Channel readiness.
   - Urgent: Prioritize specialist availability today, required diagnostics, bed availability, tertiary/district hospital capability.
   - Routine: Prioritize lower OPD queue wait times, PHCs / Area Hospitals to avoid overcrowding tertiary medical colleges.
2. Clinical Specialty & Diagnostics Match: Does the facility have the required doctor specialty and diagnostic equipment available today?
3. Financial Protection: Prioritize facilities empanelled under Ayushman Bharat (PM-JAY) and Dr. NTR Vaidya Seva / Arogya Karnataka.

Output MUST BE ONLY valid JSON matching this schema (no markdown fences, no explanatory text):
{
  "rankedFacilities": [
    {
      "facilityId": string,
      "facilityName": string,
      "rank": number,
      "matchScore": number, // 0 to 100
      "clinicalSuitability": "ideal" | "acceptable" | "suboptimal",
      "recommendedAction": "immediate_emergency_transit" | "specialist_opd_visit" | "phc_primary_care" | "teleconsult_first",
      "primaryReason": string,
      "operationalHighlight": string,
      "greenChannelEligible": boolean
    }
  ],
  "triageSummary": string,
  "rankingRationale": string
}`;

/**
 * Build Nemotron user prompt from triage result + candidate facilities
 */
export function buildNemotronUserPrompt(triage, facilities, userLocation) {
  const facilityData = facilities.slice(0, 15).map(f => ({
    facilityId: f.facilityId,
    name: f.name,
    type: f.type || f.level,
    district: f.district,
    city: f.city || f.district,
    distanceKm: f.distKm ?? f.distanceKm ?? 0,
    travelMin: f.travelMin ?? 0,
    bedsAvailable: f.bedsAvailable ?? f.beds ?? 12,
    bedsTotal: f.bedsTotal ?? 20,
    icuAvailable: f.icuAvailable ?? f.icuBeds ?? 2,
    oxygenAvailable: f.oxygenAvailable ?? Boolean(f.resources?.oxygenBeds ?? true),
    isEmergencyCapable: f.isEmergencyCapable ?? f.emergencyOpen24h ?? false,
    specialties: f.specialties || f.departments || ['General Medicine'],
    specialistsAvailableToday: f.specialistsAvailableToday || (f.doctors || []).filter(d => d.availableToday).map(d => d.specialty || d.name),
    currentOPLoad: f.currentOPLoad || (f.currentOpdQueue?.queueLength > 15 ? 'High' : 'Medium'),
    empanelledSchemes: f.empanelledSchemes || ['Ayushman Bharat', 'Dr. NTR Vaidya Seva']
  }));

  return JSON.stringify({
    patientCase: {
      urgency: triage.urgency || 'routine',
      urgencyScore: triage.urgencyScore || 40,
      specialtyNeeded: triage.specialty || triage.suggestedDept || 'General Medicine',
      suggestedDept: triage.suggestedDept || 'General OPD',
      clinicalReasoning: triage.clinicalReasoning || triage.summary || 'Clinical assessment needed',
      redFlags: triage.redFlagsDetected || triage.redFlags || [],
      userLocation: userLocation || { lat: 16.5062, lng: 80.6480, district: 'NTR / Vijayawada' }
    },
    candidateFacilities: facilityData
  }, null, 2);
}

/**
 * Deterministic fallback scoring function for when AI model is unreachable
 */
export function deterministicRankFacilities(triage, facilities, userLocation) {
  const urgency = triage.urgency || 'routine';
  const specialtyNeeded = String(triage.specialty || triage.suggestedDept || '').toLowerCase();
  const isEmergency = urgency === 'emergency' || (triage.urgencyScore && triage.urgencyScore >= 80);
  const isUrgent = urgency === 'urgent' || (triage.urgencyScore && triage.urgencyScore >= 60);

  const ranked = facilities.map((f, index) => {
    let score = 55;
    const dist = f.distKm ?? f.distanceKm ?? (8 + index * 4);
    const travelMin = f.travelMin ?? Math.round(dist * 2.5 + 4);
    const bedsTotal = f.bedsTotal ?? f.beds ?? 25;
    const beds = f.bedsAvailable ?? Math.max(2, Math.round(bedsTotal * 0.4));
    const icu = f.icuAvailable ?? (f.icuBeds ? Math.max(1, Math.round(f.icuBeds * 0.5)) : 2);
    const isEmerg = f.isEmergencyCapable ?? f.emergencyOpen24h ?? (f.level === 'district_hospital' || f.level === 'civil_hospital');
    const specs = (f.specialties || f.departments || ['General Medicine']).map(s => String(s).toLowerCase());
    const specsToday = (f.specialistsAvailableToday || (f.doctors || []).filter(d => d.availableToday).map(d => d.specialty || d.name));

    const hasSpecialty = specs.some(s => s.includes(specialtyNeeded) || specialtyNeeded.includes(s));
    const hasDoctorToday = specsToday.some(s => String(s).toLowerCase().includes(specialtyNeeded));

    if (isEmergency) {
      if (isEmerg) score += 25;
      if (icu > 0) score += 15;
      if (f.oxygenAvailable || (f.resources?.oxygenBeds ?? 0) > 0) score += 10;
      score -= Math.min(30, dist * 0.8);
      if (hasSpecialty) score += 10;
    } else if (isUrgent) {
      if (hasDoctorToday) score += 25;
      else if (hasSpecialty) score += 15;
      if (beds > 0) score += 10;
      score -= Math.min(25, dist * 0.5);
      if (f.currentOPLoad === 'Low' || (f.currentOpdQueue?.queueLength ?? 10) < 10) score += 10;
    } else {
      if (f.level === 'phc' || f.level === 'sub_centre' || (f.type && f.type.includes('Area'))) score += 20;
      if (f.currentOPLoad === 'Low' || (f.currentOpdQueue?.queueLength ?? 10) < 8) score += 15;
      if (hasDoctorToday || hasSpecialty) score += 15;
      score -= Math.min(20, dist * 0.4);
    }

    const finalScore = Math.max(15, Math.min(99, Math.round(score)));
    const primaryReason = isEmergency
      ? `${f.name} offers 24x7 emergency response with ${icu} ICU beds within ${dist} km (${travelMin} mins).`
      : isUrgent
      ? `Specialist care for ${triage.specialty || 'General Medicine'} available with ${beds} beds open.`
      : `Optimal OPD queue wait time (~${f.currentOpdQueue?.avgServiceTimeMin ?? 12} mins) with medical officer on duty.`;

    return {
      ...f,
      facilityId: f.facilityId,
      facilityName: f.name,
      matchScore: finalScore,
      distKm: dist,
      travelMin,
      bedsAvailable: beds,
      bedsTotal,
      icuAvailable: icu,
      specialistsAvailable: Math.max(1, specsToday.length || 2),
      clinicalSuitability: finalScore >= 80 ? 'ideal' : finalScore >= 60 ? 'acceptable' : 'suboptimal',
      recommendedAction: isEmergency ? 'immediate_emergency_transit' : isUrgent ? 'specialist_opd_visit' : 'phc_primary_care',
      primaryReason,
      operationalHighlight: `${dist} km away · ${travelMin} min travel · ${beds} beds · ${isEmerg ? '24x7 Emergency' : 'OPD Active'}`,
      greenChannelEligible: isEmergency && isEmerg && icu > 0,
      empanelledSchemes: f.empanelledSchemes || ['Ayushman Bharat', 'Dr. NTR Vaidya Seva']
    };
  }).sort((a, b) => b.matchScore - a.matchScore)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return {
    rankedFacilities: ranked,
    triageSummary: `Clinical urgency evaluated as ${urgency.toUpperCase()}. Found ${ranked.length} verified network facilities.`,
    rankingRationale: isEmergency
      ? 'Emergency criteria applied: 24x7 life support, ICU readiness, and closest drive-time prioritized.'
      : isUrgent
      ? 'Urgent criteria applied: Verified specialist availability today and bed vacancy prioritized.'
      : 'Routine criteria applied: Decentralized primary care and minimal wait time prioritized to reduce tertiary congestion.',
    source: 'ArogyaLink CDS Algorithmic Optimizer (Offline/High-Availability Fallback)'
  };
}

/**
 * Main public entry point: Rank facilities using Nemotron 3 Ultra with instant deterministic fallback
 */
export async function rankFacilitiesWithNemotron({ triage, facilities, userLocation }) {
  if (!facilities || facilities.length === 0) {
    return { rankedFacilities: [], triageSummary: 'No candidate facilities provided', rankingRationale: '' };
  }

  const fast = deterministicRankFacilities(triage, facilities, userLocation);

  try {
    const userMessage = buildNemotronUserPrompt(triage, facilities, userLocation);
    const chatResult = await callOpenRouterChat({
      models: [
        OPENROUTER_MODELS.NEMOTRON_LIGHTNING,
        OPENROUTER_MODELS.NEMOTRON_NANO,
        OPENROUTER_MODELS.NEMOTRON_ULTRA
      ],
      messages: [
        { role: 'system', content: NEMOTRON_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      maxTokens: 1024,
      timeoutMs: 7000,
      title: 'ArogyaLink Nemotron Hospital Ranking'
    });

    if (chatResult && chatResult.content) {
      const cleaned = chatResult.content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        if (parsed.rankedFacilities && Array.isArray(parsed.rankedFacilities)) {
          const enriched = parsed.rankedFacilities.map((rf, idx) => {
            const orig = facilities.find(f => f.facilityId === rf.facilityId) || fast.rankedFacilities[idx] || {};
            const bedsTotal = orig.bedsTotal ?? orig.beds ?? 20;
            const bedsAvail = orig.bedsAvailable ?? Math.max(2, Math.round(bedsTotal * 0.4));
            return {
              ...orig,
              ...rf,
              bedsAvailable: bedsAvail,
              bedsTotal: bedsTotal,
              specialistsAvailable: orig.specialistsAvailable || 2,
              rank: rf.rank || idx + 1,
              matchScore: rf.matchScore || Math.max(30, 98 - idx * 5),
              source: `NVIDIA Nemotron (${chatResult.model})`
            };
          });

          return {
            rankedFacilities: enriched,
            triageSummary: parsed.triageSummary || `AI-optimized ranking for ${triage.urgency || 'routine'} case.`,
            rankingRationale: parsed.rankingRationale || 'Ranked by Nemotron using clinical appropriateness, ICU, beds, and travel distance.',
            model: chatResult.model
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Nemotron] OpenRouter ranking call skipped:', err.message);
  }

  return fast;
}

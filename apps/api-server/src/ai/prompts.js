/**
 * @file prompts.js — System prompt builder and response parser for lnkling
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * Keeps all AI instructions isolated in one place.
 * No imports from other server files — this module is self-contained.
 */

// ─── Multilingual glossary ─────────────────────────────────────────────────────
// Keeps medical action terms consistent across languages
const GLOSSARY = {
  token:    { en: 'token number',    hi: 'टोकन नंबर',        mr: 'टोकन क्रमांक',     te: 'టోకెన్ నంబర్',        kn: 'ಟೋಕನ್ ಸಂಖ್ಯೆ' },
  phc:      { en: 'PHC (health centre)', hi: 'PHC (स्वास्थ्य केंद्र)', mr: 'PHC (आरोग्य केंद्र)', te: 'PHC (ప్రాథమిక ఆరోగ్య కేంద్రం)', kn: 'PHC (ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ)' },
  referral: { en: 'referral',        hi: 'रेफरल',            mr: 'रेफरल',            te: 'రిఫరల్',             kn: 'ರೆಫರಲ್' },
  doctor:   { en: 'doctor',          hi: 'डॉक्टर',           mr: 'डॉक्टर',           te: 'డాక్టర్',            kn: 'ವೈದ್ಯರು' },
  asha:     { en: 'ASHA worker',     hi: 'आशा कार्यकर्ता',   mr: 'आशा कार्यकर्ती',   te: 'ఆశా కార్యకర్త',       kn: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ' },
  hospital: { en: 'hospital',        hi: 'अस्पताल',          mr: 'रुग्णालय',          te: 'ఆసుపత్రి',           kn: 'ಆಸ್ಪತ್ರೆ' },
  call108:  { en: 'call 108',        hi: '108 पर कॉल करें',  mr: '108 वर कॉल करा',   te: '108 కి కాల్ చేయండి', kn: '108 ಗೆ ಕರೆ ಮಾಡಿ' },
};

/**
 * The system instruction sent to lnkling on every call.
 * Kept short and precise for small model context.
 */
export const SYSTEM_PROMPT = `You are a public-health triage support assistant for rural India (Andhra Pradesh, Karnataka, Maharashtra).
Always respond in the requested language:
- te = Telugu (simple, spoken Telugu style for rural citizens)
- kn = Kannada (simple, spoken Kannada style)
- mr = Marathi (simple, spoken Marathi style)
- hi = Hindi (simple, spoken Hindi style)
- en = English
Support mixed language input. Keep medical advice clear, simple, and jargon-free for low-literacy users.

Return ONLY valid JSON matching this exact schema — no markdown fences, no extra text:
{
  "urgency": "low" | "moderate" | "high",
  "opDepartment": string,
  "priority": "emergency" | "priority" | "normal",
  "specialty": string,
  "reasons": string[],
  "suggestedDiagnostics": string[],
  "patientMessage": string,
  "ashaMessage": string,
  "language": "en" | "hi" | "mr" | "te" | "kn",
  "model": "lnkling",
  "disclaimer": string
}
Rules:
- Decision support only. Never prescribe medicines or make final clinical decisions.
- Prefer PHC/OP handling when safe. Escalate pregnancy + fever/pain to high urgency.
- patientMessage: max 2 short sentences, grade-school simplicity, in the requested language.
- ashaMessage: bullet-style short lines for field-worker use, in the requested language.
- disclaimer must always be: "AI support — confirm with health worker / doctor"
- Write all text fields in the language specified by the "language" field in the user message.`;

/**
 * Build the user message sent to lnkling.
 *
 * @param {import('./types.js').LnklingInput} input
 * @returns {string}
 */
export function buildUserMessage(input) {
  const lang = input.language || 'en';
  const parts = [
    `language: ${lang}`,
    `chiefComplaint: ${input.chiefComplaint || '(not specified)'}`,
  ];
  if (input.notes)       parts.push(`notes: ${input.notes}`);
  if (input.temperature) parts.push(`temperature: ${input.temperature}°C`);
  if (input.severity != null) parts.push(`severity: ${input.severity}/10`);
  if (input.pregnant)    parts.push(`pregnant: true`);
  if (input.age)         parts.push(`age: ${input.age}`);
  return parts.join('\n');
}

/**
 * Parse the model's text response into a LnklingTriageResult.
 * Extracts JSON even if the model wraps it in prose or markdown fences.
 *
 * @param {string} raw - Raw text from the model
 * @param {import('./types.js').LnklingInput} input - Original input for defaults
 * @returns {import('./types.js').LnklingTriageResult | null}
 */
export function parseModelResponse(raw, input) {
  try {
    // Strip <think>...</think> if present
    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Strip markdown code fences if present
    cleaned = cleaned
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Find last matching { ... } or largest JSON block
    const start = cleaned.indexOf('{');
    const end   = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    // Normalise
    return {
      urgency:             ['low', 'moderate', 'high'].includes(parsed.urgency) ? parsed.urgency : 'moderate',
      opDepartment:        String(parsed.opDepartment || parsed.department || 'General OPD'),
      priority:            ['emergency', 'priority', 'normal'].includes(parsed.priority) ? parsed.priority : 'normal',
      specialty:           String(parsed.specialty || 'General Medicine'),
      reasons:             Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 5) : [],
      suggestedDiagnostics: Array.isArray(parsed.suggestedDiagnostics) ? parsed.suggestedDiagnostics.slice(0, 8) : [],
      patientMessage:      String(parsed.patientMessage || ''),
      ashaMessage:         String(parsed.ashaMessage || ''),
      language:            (input.language || 'en'),
      model:               'lnkling',
      disclaimer:          'AI support — confirm with health worker / doctor',
      offline:             false,
    };
  } catch (_) {
    return null;
  }
}

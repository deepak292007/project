/**
 * @file types.js — lnkling AI triage result type definitions
 *
 * ArogyaLink · SIH 2026 · Problem 26133
 *
 * This is the stable response contract exposed to the frontend.
 * UI components map ONLY to these fields.
 * Never change field names without a version bump.
 */

/**
 * @typedef {'low' | 'moderate' | 'high'} LnklingUrgency
 * @typedef {'emergency' | 'priority' | 'normal'} LnklingPriority
 * @typedef {'en' | 'hi' | 'mr' | 'te' | 'kn'} LnklingLang
 */

/**
 * Stable response type from analyzeSymptoms().
 * Must be the same shape whether the model is online or the fallback fires.
 *
 * @typedef {Object} LnklingTriageResult
 * @property {LnklingUrgency}  urgency              - "low" | "moderate" | "high"
 * @property {string}          opDepartment         - OP department name (English)
 * @property {LnklingPriority} priority             - "emergency" | "priority" | "normal"
 * @property {string}          specialty            - Clinical specialty
 * @property {string[]}        reasons              - Short plain-language reasons (2–4 items)
 * @property {string[]}        suggestedDiagnostics - Recommended tests
 * @property {string}          patientMessage       - ≤2 sentences, grade-school simplicity, in lang
 * @property {string}          ashaMessage          - Bullet-style field-worker checklist, in lang
 * @property {LnklingLang}     language             - Language the messages are in
 * @property {'lnkling'}       model                - Always "lnkling"
 * @property {string}          disclaimer           - Mandatory "AI support" disclaimer
 * @property {boolean}         [offline]            - true when fallback mock was used
 */

/**
 * Input shape for analyzeSymptoms().
 *
 * @typedef {Object} LnklingInput
 * @property {string}   chiefComplaint   - Free-text complaint (EN/HI/MR or mixed OK)
 * @property {string}   [notes]          - Additional free-text notes
 * @property {number}   [temperature]    - °C
 * @property {number}   [severity]       - 0–10 subjective severity
 * @property {boolean}  [pregnant]       - Is the patient pregnant?
 * @property {number}   [age]            - Patient age in years
 * @property {LnklingLang} language      - UI language — messages will be returned in this language
 */

export {}; // ESM placeholder — types are JSDoc only, no runtime exports needed

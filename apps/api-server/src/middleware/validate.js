/**
 * validate.js — Request Validation Middleware
 *
 * Lightweight schema validation without external dependencies.
 * Validates required fields, types, and enum values on key routes.
 *
 * Usage:
 *   import { validateBody } from './validate.js';
 *   app.post('/api/patients', validateBody(PATIENT_SCHEMA), handler);
 */

// ─── Schema Definitions ────────────────────────────────────────────────────────

export const SCHEMAS = {
  login: {
    required: ['email', 'password'],
    types: { email: 'string', password: 'string' },
  },
  register: {
    required: ['name', 'email', 'password'],
    types: { name: 'string', email: 'string', password: 'string' },
    minLength: { password: 8 },
  },
  patient: {
    required: ['name'],
    types: { name: 'string', age: 'number' },
    enums: {
      gender: ['M', 'F', 'O'],
      riskCategory: ['high', 'moderate', 'low'],
      rationCardCategory: ['BPL', 'AAY', 'APL', 'None'],
    },
  },
  encounter: {
    required: ['patientId'],
    types: { patientId: 'string' },
    enums: {
      type: ['OPD', 'ANC', 'Immunization', 'Teleconsult', 'Emergency', 'FollowUp'],
      status: ['waiting', 'in_progress', 'completed', 'cancelled', 'no_show'],
    },
  },
  referral: {
    required: ['patientId', 'fromFacilityId', 'toFacilityId'],
    types: { patientId: 'string', fromFacilityId: 'string', toFacilityId: 'string' },
    enums: { urgency: ['emergency', 'urgent', 'routine', 'elective'] },
  },
  referralStage: {
    required: ['stage'],
    enums: {
      stage: ['initiated', 'accepted', 'transport_arranged', 'patient_en_route',
              'arrived', 'under_treatment', 'discharged', 'follow_up_due'],
    },
  },
  sync: {
    required: ['id', 'resourceType', 'action'],
    types: { id: 'string', resourceType: 'string', action: 'string' },
    enums: {
      resourceType: ['Patient', 'Encounter', 'ServiceRequest', 'Task', 'Observation', 'ClinicalAssessment'],
      action: ['CREATE', 'UPDATE'],
    },
  },
  clinicalAssessment: {
    required: ['patientId', 'symptoms'],
    types: { patientId: 'string', symptomNarrative: 'string' },
  },
  refresh: {
    required: [],  // refresh token comes from httpOnly cookie; body validation not needed
  },
  capacitySnapshot: {
    required: ['bedsTotal', 'bedsOccupied'],
    types: { bedsTotal: 'number', bedsOccupied: 'number', icuTotal: 'number', icuOccupied: 'number' },
  },
};

// ─── Middleware Factory ────────────────────────────────────────────────────────

/**
 * validateBody(schemaName) — Returns an Express middleware that validates req.body
 * against the named schema. Returns 400 with a descriptive error on failure.
 */
export function validateBody(schemaName) {
  const schema = SCHEMAS[schemaName];
  if (!schema) throw new Error(`Unknown validation schema: ${schemaName}`);

  return function (req, res, next) {
    const body = req.body;
    const errors = [];

    // Required fields
    for (const field of (schema.required || [])) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors.push(`'${field}' is required`);
      }
    }

    // Type checks (only if field is present)
    for (const [field, expectedType] of Object.entries(schema.types || {})) {
      if (body[field] !== undefined && typeof body[field] !== expectedType) {
        errors.push(`'${field}' must be a ${expectedType}`);
      }
    }

    // Enum checks
    for (const [field, allowed] of Object.entries(schema.enums || {})) {
      if (body[field] !== undefined && !allowed.includes(body[field])) {
        errors.push(`'${field}' must be one of: ${allowed.join(', ')}`);
      }
    }

    // Min length checks
    for (const [field, min] of Object.entries(schema.minLength || {})) {
      if (body[field] !== undefined && String(body[field]).length < min) {
        errors.push(`'${field}' must be at least ${min} characters`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

// ─── Sanitize helpers ──────────────────────────────────────────────────────────

/** Sanitize a query string for use in a MongoDB regex filter (escapes regex meta-chars). */
export function sanitizeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Coerce a query-string integer with a safe default and ceiling. */
export function parseIntParam(val, defaultVal, max = 200) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? Math.min(Math.max(1, n), max) : defaultVal;
}

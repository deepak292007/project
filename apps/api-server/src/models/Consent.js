import mongoose from 'mongoose';

/**
 * Consent — ABDM-compatible patient data-sharing consent model.
 *
 * Tracks consent grants for sharing patient health records with:
 *   - Specific facilities or practitioners
 *   - ABDM Health Information Users (HIUs)
 *   - Research or public health aggregation (district_admin only, de-identified)
 *
 * Design notes:
 *   - Consent is append-only; revocation creates a new record with status='revoked'
 *     rather than mutating the original.
 *   - abdmConsentId is populated only when ABDM sandbox credentials are present and
 *     a live consent artefact has been issued. Otherwise it remains null.
 *   - ABDM live integration is NOT active in this build (no credentials).
 *     This schema prepares the payload for future ABDM connectivity.
 */
const ConsentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

  // ── ABDM Consent Artefact ─────────────────────────────────────────────────
  // Null unless ABDM sandbox/production credentials are configured and a
  // live consent artefact has been issued through the Health Data Consent Manager.
  abdmConsentId: { type: String, sparse: true },

  // ── Purpose & Scope ───────────────────────────────────────────────────────
  purposeCode: {
    type: String,
    enum: ['CAREMGT', 'PUBHLTH', 'HPAYMT', 'CLINTRLS', 'PATRQT', 'SYSDEV'],
    default: 'CAREMGT',
  },
  purposeDisplay: String,

  // ── Data Categories ───────────────────────────────────────────────────────
  dataCategories: [{
    type: String,
    enum: ['OPConsultation', 'DiagnosticReport', 'Prescription', 'ImmunizationRecord',
           'WellnessRecord', 'DischargeSummary', 'HealthDocumentRecord'],
  }],
  dateRangeFrom: Date,
  dateRangeTo:   Date,

  // ── Grantee ───────────────────────────────────────────────────────────────
  granteeType: { type: String, enum: ['Facility', 'Practitioner', 'HIU', 'System'], default: 'Facility' },
  granteeId:   String,
  granteeName: String,

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'pending'],
    default: 'active',
    index: true,
  },
  validFrom: { type: Date, default: Date.now },
  validTo:   Date,

  // ── Capture Provenance ────────────────────────────────────────────────────
  capturedAt:    { type: Date, default: Date.now },
  capturedBy:    String,   // Name of person who captured consent
  capturedById:  String,   // userId
  capturedRole:  String,
  capturedMode:  { type: String, enum: ['paper', 'digital', 'verbal', 'abdm_app'], default: 'digital' },

  notes: String,
  _synthetic: Boolean,

}, { timestamps: true });

ConsentSchema.index({ patientId: 1, status: 1, validTo: 1 });

export default mongoose.model('Consent', ConsentSchema);

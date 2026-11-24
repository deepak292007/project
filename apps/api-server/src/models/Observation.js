import mongoose from 'mongoose';

/**
 * Observation — FHIR R4-aligned vitals and lab result model.
 *
 * Covers: vital signs (BP, SpO2, temp, pulse, weight), lab results (CBC, glucose, Hb),
 * and imaging results. Each observation is linked to patient, encounter, facility,
 * actor, device, and timestamp for full provenance.
 *
 * Category codes align with FHIR Observation.category:
 *   vital-signs  — bedside measurements
 *   laboratory   — lab/PoCT results
 *   imaging      — X-ray, USG findings (textual summary)
 *   social-history — MUAC, nutritional screening
 */
const ObservationSchema = new mongoose.Schema({
  // ── FHIR linkage ──────────────────────────────────────────────────────────
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },

  // ── Classification ────────────────────────────────────────────────────────
  category: {
    type: String,
    enum: ['vital-signs', 'laboratory', 'imaging', 'social-history'],
    required: true,
  },
  // LOINC code string, e.g. '8480-6' for systolic BP; '59408-5' for SpO2
  loincCode:   String,
  loincDisplay: String,
  // Free-text label for non-LOINC coded observations
  name: { type: String, required: true },

  // ── Result ────────────────────────────────────────────────────────────────
  value: mongoose.Schema.Types.Mixed,  // Number or string
  valueUnit: String,                   // e.g. 'mmHg', 'g/dL', '%', '°C'
  interpretation: {
    type: String,
    enum: ['normal', 'low', 'high', 'critical-low', 'critical-high', 'abnormal', 'indeterminate'],
  },
  referenceRangeLow: Number,
  referenceRangeHigh: Number,
  notes: String,

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['preliminary', 'final', 'amended', 'cancelled'],
    default: 'final',
  },

  // ── Provenance ────────────────────────────────────────────────────────────
  facilityId:   String,
  facilityName: String,
  recordedAt:   { type: Date, default: Date.now },
  recordedBy:   String,   // Name of clinician / ASHA worker
  recordedById: String,   // userId
  recordedRole: String,
  deviceId:     String,   // Bluetooth / PoCT device ID if applicable
  method:       String,   // e.g. 'manual', 'bluetooth-poct', 'lab-analyser'
  _synthetic:   Boolean,  // true for seeded demo records

}, { timestamps: true });

ObservationSchema.index({ patientId: 1, recordedAt: -1 });
ObservationSchema.index({ encounterId: 1, category: 1 });
ObservationSchema.index({ category: 1, loincCode: 1, recordedAt: -1 });

export default mongoose.model('Observation', ObservationSchema);

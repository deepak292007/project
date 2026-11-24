import mongoose from 'mongoose';

/**
 * Condition — ICD-10 coded diagnosis model.
 *
 * Records active and historical diagnoses for a patient.
 * Immutable once status reaches 'confirmed' — amendments create new records.
 */
const ConditionSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },

  // ── Coding ────────────────────────────────────────────────────────────────
  code:    { type: String, required: true },  // ICD-10 or SNOMED code
  display: { type: String, required: true },  // Human-readable name
  system:  { type: String, enum: ['ICD-10', 'SNOMED-CT', 'local'], default: 'ICD-10' },

  // ── Clinical Status ───────────────────────────────────────────────────────
  clinicalStatus: {
    type: String,
    enum: ['active', 'recurrence', 'relapse', 'resolved', 'remission', 'inactive'],
    default: 'active',
  },
  verificationStatus: {
    type: String,
    enum: ['provisional', 'confirmed', 'differential', 'refuted'],
    default: 'provisional',
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
  },
  category: {
    type: String,
    enum: ['problem-list-item', 'encounter-diagnosis', 'health-concern'],
    default: 'encounter-diagnosis',
  },

  // ── Dates ─────────────────────────────────────────────────────────────────
  onsetDate:      Date,
  abatementDate:  Date,  // When condition resolved
  recordedDate:   { type: Date, default: Date.now },

  notes: String,

  // ── Provenance ────────────────────────────────────────────────────────────
  facilityId:   String,
  facilityName: String,
  recordedBy:   String,
  recordedById: String,
  recordedRole: { type: String, enum: ['phc_doctor', 'hospital_doctor', 'hospital_admin', 'district_admin'] },
  _synthetic:   Boolean,

}, { timestamps: true });

ConditionSchema.index({ patientId: 1, clinicalStatus: 1, recordedDate: -1 });

export default mongoose.model('Condition', ConditionSchema);

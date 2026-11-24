import mongoose from 'mongoose';

/**
 * CarePlan — Structured care plan for ongoing management.
 *
 * Covers: ANC/PNC maternal care, IMCI child nutrition, NCD (HTN/T2DM),
 * TB-DOTS, and general preventive care.
 *
 * Activities capture scheduled interventions (medications, visits, tests).
 */
const CarePlanActivitySchema = new mongoose.Schema({
  kind:        String,   // 'ServiceRequest', 'Task', 'MedicationRequest'
  title:       String,
  description: String,
  scheduledDate: Date,
  status:      { type: String, enum: ['not-started', 'in-progress', 'completed', 'cancelled'], default: 'not-started' },
  performedBy: String,
  completedAt: Date,
}, { _id: false });

const CarePlanSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },

  // ── Classification ────────────────────────────────────────────────────────
  category: {
    type: String,
    enum: ['ANC', 'PNC', 'IMCI', 'NCD_HTN', 'NCD_DM', 'TB_DOTS', 'Immunization', 'General'],
    required: true,
  },
  title:       String,
  description: String,

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'active', 'on-hold', 'completed', 'revoked'],
    default: 'active',
  },
  intent: {
    type: String,
    enum: ['proposal', 'plan', 'order', 'option'],
    default: 'plan',
  },

  // ── Period ────────────────────────────────────────────────────────────────
  periodStart: { type: Date, default: Date.now },
  periodEnd:   Date,

  // ── Activities ────────────────────────────────────────────────────────────
  activities: [CarePlanActivitySchema],

  // ── Provenance ────────────────────────────────────────────────────────────
  authoredBy:   String,
  authoredById: String,
  authoredRole: String,
  facilityId:   String,
  facilityName: String,
  notes:        String,
  _synthetic:   Boolean,

}, { timestamps: true });

CarePlanSchema.index({ patientId: 1, status: 1, category: 1 });

export default mongoose.model('CarePlan', CarePlanSchema);

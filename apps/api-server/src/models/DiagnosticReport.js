import mongoose from 'mongoose';

/**
 * DiagnosticReport — Lab test results linked to DiagnosticOrder.
 *
 * Stores individual test results with reference ranges and abnormality flags.
 * Clinician review status tracked — reports marked 'reviewed' are immutable.
 */
const TestResultSchema = new mongoose.Schema({
  code:           String,
  name:           { type: String, required: true },
  value:          mongoose.Schema.Types.Mixed,   // Number or string
  valueUnit:      String,
  referenceRangeLow:  Number,
  referenceRangeHigh: Number,
  referenceRangeText: String,
  isAbnormal:     { type: Boolean, default: false },
  interpretation: {
    type: String,
    enum: ['N', 'L', 'H', 'LL', 'HH', 'A', 'NEG', 'POS', 'IND'],
  },
  notes: String,
}, { _id: false });

const DiagnosticReportSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticOrder', index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },

  // ── Classification ────────────────────────────────────────────────────────
  category: {
    type: String,
    enum: ['Hematology', 'Biochemistry', 'Microbiology', 'Radiology',
           'Cardiology', 'PoCT', 'Immunology'],
    default: 'PoCT',
  },
  reportTitle: String,

  // ── Results ───────────────────────────────────────────────────────────────
  results:        { type: [TestResultSchema], required: true },
  overallStatus:  {
    type: String,
    enum: ['all-normal', 'some-abnormal', 'critical', 'indeterminate'],
    default: 'indeterminate',
  },
  interpretation: String,  // Free-text summary by lab technician
  attachmentUrl:  String,  // Link to scan/image/PDF

  // ── Report Status ─────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['preliminary', 'final', 'amended', 'cancelled'],
    default: 'preliminary',
  },
  reportedAt:  { type: Date, default: Date.now },
  reportedBy:  String,
  labFacilityId:   String,
  labFacilityName: String,

  // ── Clinician Review ──────────────────────────────────────────────────────
  // Once reviewed, the report is effectively immutable.
  clinicianReview: {
    reviewedBy:   String,
    reviewedById: String,
    reviewedAt:   Date,
    note:         String,
  },

  // ── Provenance ────────────────────────────────────────────────────────────
  _synthetic: Boolean,

}, { timestamps: true });

DiagnosticReportSchema.index({ patientId: 1, reportedAt: -1 });
DiagnosticReportSchema.index({ orderId: 1 }, { unique: true, sparse: true });

export default mongoose.model('DiagnosticReport', DiagnosticReportSchema);

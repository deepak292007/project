import mongoose from 'mongoose';

/**
 * DiagnosticOrder — Lab test orders (outbound from PHC/Sub-Centre to hub lab).
 *
 * Supports the Rwanda hub-and-spoke model: samples collected at peripheral facilities,
 * dispatched to district hospital lab, results returned digitally.
 */
const OrderedTestSchema = new mongoose.Schema({
  code:       String,    // LOINC or local lab code
  name:       { type: String, required: true },
  urgency:    { type: String, enum: ['stat', 'urgent', 'routine'], default: 'routine' },
  specimen:   String,    // 'blood', 'urine', 'sputum', etc.
  sampleId:   String,    // Tube/bag label ID
}, { _id: false });

const DiagnosticOrderSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },

  // ── Order Details ─────────────────────────────────────────────────────────
  tests:    { type: [OrderedTestSchema], required: true },
  priority: { type: String, enum: ['stat', 'urgent', 'routine'], default: 'routine' },
  clinicalReason: String,

  // ── Status Lifecycle ──────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['ordered', 'specimen-collected', 'specimen-dispatched', 'received-at-lab',
           'in-analysis', 'completed', 'cancelled'],
    default: 'ordered',
  },

  // ── Facility Chain ────────────────────────────────────────────────────────
  orderingFacilityId:   { type: String, required: true },
  orderingFacilityName: String,
  labFacilityId:        String,   // Receiving lab facility
  labFacilityName:      String,

  // ── Timestamps ────────────────────────────────────────────────────────────
  orderedAt:       { type: Date, default: Date.now },
  collectionAt:    Date,  // Sample collected
  dispatchedAt:    Date,  // Sample sent to lab
  receivedAtLabAt: Date,
  completedAt:     Date,

  // ── Provenance ────────────────────────────────────────────────────────────
  orderedBy:    String,
  orderedById:  String,
  orderedRole:  String,
  notes:        String,
  _synthetic:   Boolean,

}, { timestamps: true });

DiagnosticOrderSchema.index({ patientId: 1, orderedAt: -1 });
DiagnosticOrderSchema.index({ orderingFacilityId: 1, status: 1 });

export default mongoose.model('DiagnosticOrder', DiagnosticOrderSchema);

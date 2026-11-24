import mongoose from 'mongoose';

/**
 * MedicationRequest Schema — FHIR R4 Compliant E-Prescription Model
 * Supports digitally signed prescriptions, dosage, frequency, and dispensing status.
 */
const MedicationItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: {
    type: String,
    enum: ['Once a day', 'Twice a day', 'Three times a day', 'Four times a day', 'As needed (SOS)'],
    default: 'Twice a day'
  },
  durationDays: { type: Number, default: 5 },
  instructions: String,
  isAvailableAtPHC: { type: Boolean, default: true }
}, { _id: false });

const MedicationRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },
  facilityId: { type: String, required: true },
  facilityName: String,
  prescribedBy: { type: String, required: true },
  prescribedById: String,
  prescriberRole: { type: String, enum: ['phc_doctor', 'hospital_doctor', 'specialist'], default: 'phc_doctor' },
  prescriberRegNo: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'on-hold'],
    default: 'active',
    index: true
  },
  intent: { type: String, default: 'order' },
  medications: [MedicationItemSchema],
  adviceAndLifestyle: [String],
  followUpDate: Date,
  dispensedStatus: {
    type: String,
    enum: ['pending', 'partially-dispensed', 'fully-dispensed'],
    default: 'pending'
  },
  dispensedAt: Date,
  dispensedBy: String,
  signatureHash: String, // SHA-256 digital signature hash
  authoredOn: { type: Date, default: Date.now }
}, { timestamps: true });

MedicationRequestSchema.index({ patientId: 1, authoredOn: -1 });

export default mongoose.model('MedicationRequest', MedicationRequestSchema);

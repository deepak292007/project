import mongoose from 'mongoose';

const MedicineItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  dosage: { type: String, default: 'As prescribed / standard OTC' },
  quantity: { type: Number, default: 1 },
  instructions: String
}, { _id: false });

const MedicineDeliveryRequestSchema = new mongoose.Schema({
  requestId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  abhaId: { type: String, default: 'ABHA-2026-CITIZEN' },
  village: { type: String, default: 'Inavolu Village' },
  district: { type: String, default: 'Guntur / Amaravati' },
  state: { type: String, default: 'Andhra Pradesh' },
  deliveryAddress: { type: String, required: true },
  symptoms: [String],
  clinicalUrgency: { type: String, enum: ['routine', 'mild', 'urgent'], default: 'routine' },
  prescribedMedicines: [MedicineItemSchema],
  dispensingFacilityId: { type: String, default: 'VIT-AP-HC-01' },
  dispensingFacilityName: { type: String, default: 'VIT-AP Health Centre' },
  assignedAshaId: { type: String, default: 'ASHA-REKHA-01' },
  assignedAshaName: { type: String, default: 'Rekha Patil / Lakshmi Devi' },
  assignedAshaPhone: { type: String, default: '9848011223' },
  status: {
    type: String,
    enum: ['requested', 'phc_approved', 'dispatched_with_asha', 'delivered', 'cancelled'],
    default: 'requested'
  },
  estimatedDeliveryHours: { type: Number, default: 4 },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  dispatchedAt: Date,
  deliveredAt: Date,
  notes: String,
  _synthetic: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('MedicineDeliveryRequest', MedicineDeliveryRequestSchema);

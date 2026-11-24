import mongoose from 'mongoose';

const STAGES = [
  'initiated',          // ASHA / PHC creates referral
  'accepted',           // Receiving facility accepts
  'transport_arranged', // Ambulance / 108 booked
  'patient_en_route',   // On the way
  'arrived',            // Reached receiving facility
  'under_treatment',    // Doctor attending
  'discharged',         // Discharged from receiving facility
  'follow_up_due'       // Closed loop — ASHA to visit
];

const StageHistorySchema = new mongoose.Schema({
  stage: String,
  updatedBy: String,
  role: String,
  facilityId: String,
  notes: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ReferralSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
  fromFacilityId: { type: String, required: true },
  fromFacilityName: String,
  toFacilityId: { type: String, required: true },
  toFacilityName: String,
  urgency: { type: String, enum: ['emergency', 'urgent', 'routine', 'elective'], default: 'routine' },
  reason: String,
  diagnosis: [String],
  diagnosticsRequested: [String],
  specialistRequired: String,
  currentStage: { type: String, enum: STAGES, default: 'initiated' },
  stageHistory: [StageHistorySchema],
  ambulanceNumber: String,
  driverPhone: String,
  estimatedArrival: Date,
  dischargeNotes: String,
  followUpDate: Date,
  followUpCompleted: Boolean,
  initiatedAt: { type: Date, default: Date.now },
  initiatedBy: String,
  closedAt: Date,
}, { timestamps: true });

export default mongoose.model('Referral', ReferralSchema);

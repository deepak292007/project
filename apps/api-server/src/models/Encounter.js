import mongoose from 'mongoose';

const EncounterSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  facilityId: String,
  facilityName: String,
  type: { type: String, enum: ['OPD', 'ANC', 'Immunization', 'Teleconsult', 'Emergency', 'FollowUp'], default: 'OPD' },
  department: String,
  token: String,
  queuePosition: Number,
  status: { type: String, enum: ['waiting', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'waiting' },
  chiefComplaint: String,
  complaints: [String],
  vitals: {
    bp: String, pulse: Number, temp: Number, spo2: Number,
    weight: Number, height: Number
  },
  triageResult: {
    urgency: { type: String, enum: ['emergency', 'urgent', 'routine', 'elective'] },
    suggestedDept: String,
    suggestedFacilityLevel: String,
    clinicalReasoning: String,
    diagnosticsNeeded: [String],
    aiModel: String,
    confirmedByDoctor: Boolean,
    doctorName: String,
    confirmedAt: Date
  },
  // ─── lnkling AI Triage Support (optional, additive) ────────────────────────
  // Stores LnklingTriageResult from the AI service. Does not override triageResult.
  triageAi: { type: mongoose.Schema.Types.Mixed },
  triageConfirmedBy: String,   // health worker / doctor who confirmed the AI triage
  triageConfirmedAt: Date,     // timestamp of clinical confirmation

  notes: String,
  diagnosis: [String],
  icd10: [String],
  prescriptionId: mongoose.Schema.Types.ObjectId,
  referralId: mongoose.Schema.Types.ObjectId,
  conductedAt: { type: Date, default: Date.now },
  conductedBy: String,
  role: String
}, { timestamps: true });

export default mongoose.model('Encounter', EncounterSchema);

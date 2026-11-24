import mongoose from 'mongoose';

/**
 * Feedback & Grievance Schema — Citizen Health Vigilance & Service Quality
 * Tracks complaints (e.g. Doctor absent despite app showing present, medicine stockout, emergency denial)
 */
const FeedbackSchema = new mongoose.Schema({
  grievanceId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  patientPhone: String,
  facilityId: { type: String, required: true },
  facilityName: String,
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
  category: { 
    type: String, 
    enum: ['OPD', 'Referral', 'Teleconsult', 'ASHA', 'Emergency', 'General', 'Grievance'], 
    default: 'General' 
  },
  complaintType: {
    type: String,
    enum: [
      'none',
      'doctor_absent_on_duty',          // Doctor marked present in app but absent in hospital
      'emergency_service_denied',       // Denied emergency/maternity admission
      'free_medicine_unavailable',      // Demanded out-of-pocket payment for free govt drugs
      'ambulance_delayed_or_denied',    // 108 ambulance delayed > 45 mins
      'staff_misbehavior_or_bribe',     // Extortion / misbehavior
      'unhygienic_ward_facilities',     // Poor cleanliness
      'other'
    ],
    default: 'none'
  },
  targetDoctorOrStaff: String,
  rating: { type: Number, min: 1, max: 5, default: 4 },
  waitTimeRating: { type: Number, min: 1, max: 5 },
  staffBehaviorRating: { type: Number, min: 1, max: 5 },
  cleanliness: { type: Number, min: 1, max: 5 },
  comment: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['lodged', 'under_inquiry', 'action_taken', 'resolved', 'dismissed'], 
    default: 'lodged' 
  },
  actionTakenNotes: String,
  autoRosterCorrectionTriggered: { type: Boolean, default: false },
  anonymous: { type: Boolean, default: false },
  lang: { type: String, enum: ['en', 'hi', 'mr'], default: 'mr' },
  submittedAt: { type: Date, default: Date.now },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model('Feedback', FeedbackSchema);

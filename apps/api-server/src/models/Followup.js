import mongoose from 'mongoose';

const FollowupSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  ashaWorker: String,
  ashaPhone: String,
  facilityId: String,
  type: { type: String, enum: ['ANC', 'Immunization', 'NCD', 'PostDischarge', 'PostReferral', 'Routine'], default: 'Routine' },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['high', 'moderate', 'low'], default: 'moderate' },
  notes: String,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  completedBy: String,
  visitNotes: String,
  nextDueDate: Date,
  reminders: [{ sentAt: Date, channel: String }],
}, { timestamps: true });

export default mongoose.model('Followup', FollowupSchema);

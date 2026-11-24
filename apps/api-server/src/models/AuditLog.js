import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },   // e.g. 'REFERRAL_STAGE_UPDATED'
  entityType: String,                          // 'Referral', 'Patient', etc.
  entityId: String,
  performedBy: String,
  role: String,
  facilityId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

export default mongoose.model('AuditLog', AuditLogSchema);

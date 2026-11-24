import mongoose from 'mongoose';

/**
 * ConflictRecord Schema — Audit of sync conflicts and resolutions
 * Ensures clinical overrides and data safety are immutably logged.
 */
const ConflictRecordSchema = new mongoose.Schema({
  clientEventId: { type: String, required: true },
  deviceId: String,
  resourceType: { type: String, required: true },
  resourceId: String,
  clientAction: String,
  clientPayload: mongoose.Schema.Types.Mixed,
  serverStateSnapshot: mongoose.Schema.Types.Mixed,
  resolution: {
    type: String,
    enum: ['clinician_final_preserved', 'server_wins', 'client_wins', 'merged', 'rejected'],
    required: true
  },
  reason: String,
  resolvedBy: { type: String, default: 'system_rule_engine' },
  resolvedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ConflictRecordSchema.index({ resourceId: 1, createdAt: -1 });

export default mongoose.model('ConflictRecord', ConflictRecordSchema);

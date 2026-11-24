import mongoose from 'mongoose';

/**
 * SyncEvent Schema — Idempotent sync transaction record
 * Tracks client-generated event IDs, resource types, actions, timestamps,
 * per-device sync status, and conflict resolution details.
 */
const SyncEventSchema = new mongoose.Schema({
  clientEventId: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, index: true },
  userId: String,
  resourceType: {
    type: String,
    enum: ['Patient', 'Encounter', 'ServiceRequest', 'Task', 'Observation', 'ClinicalAssessment', 'EmergencySOS'],
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true
  },
  resourceId: String,
  status: {
    type: String,
    enum: ['completed', 'conflict_resolved', 'failed'],
    required: true
  },
  conflictResolution: {
    type: String,
    enum: ['none', 'client_wins', 'server_wins', 'clinician_final_preserved', 'merged'],
    default: 'none'
  },
  retryCount: { type: Number, default: 0 },
  lastRetryAt: Date,
  serverTimestamp: { type: Date, default: Date.now },
  errorMessage: String,
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true });

SyncEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days retention

export default mongoose.model('SyncEvent', SyncEventSchema);

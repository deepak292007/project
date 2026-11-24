import mongoose from 'mongoose';

/**
 * OfflineDevice Schema — Device Registration and Sync Telemetry
 * Tracks frontline ASHA/ANM devices, app versions, battery/storage, and sync state.
 */
const OfflineDeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  userName: String,
  role: { type: String, required: true },
  facilityId: String,
  facilityName: String,
  appVersion: { type: String, default: '1.0.0' },
  platform: { type: String, default: 'web-pwa' },
  userAgent: String,
  lastSyncAt: Date,
  lastSyncSequence: { type: Number, default: 0 },
  pendingQueueSize: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'revoked'], default: 'active' },
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('OfflineDevice', OfflineDeviceSchema);

import mongoose from 'mongoose';

/**
 * DailyFacilityCapacitySnapshot — Real-time capacity state at a facility.
 *
 * Recorded at most once per hour by hospital_admin or hospital_doctor.
 * The facility matching algorithm uses the LATEST snapshot within 4 hours.
 * If no recent snapshot exists, the algorithm falls back to the Facility.resources field.
 *
 * Design: immutable append-only. Corrections create a new snapshot.
 * ClinicalAssessment.facilityMatches stores the snapshotId used for full audit trail.
 */
const DailyFacilityCapacitySnapshotSchema = new mongoose.Schema({
  facilityId:   { type: String, required: true, index: true },
  facilityName: String,

  // ── Beds ──────────────────────────────────────────────────────────────────
  bedsTotal:    { type: Number, default: 0 },
  bedsOccupied: { type: Number, default: 0 },

  // ── ICU ───────────────────────────────────────────────────────────────────
  icuTotal:    { type: Number, default: 0 },
  icuOccupied: { type: Number, default: 0 },

  // ── Oxygen Beds ───────────────────────────────────────────────────────────
  oxygenBeds:     { type: Number, default: 0 },
  oxygenOccupied: { type: Number, default: 0 },

  // ── Ventilators ───────────────────────────────────────────────────────────
  ventilators:      { type: Number, default: 0 },
  ventilatorsInUse: { type: Number, default: 0 },

  // ── Ambulances ────────────────────────────────────────────────────────────
  ambulancesTotal:    { type: Number, default: 0 },
  ambulancesAvail:    { type: Number, default: 0 },

  // ── OPD Queue ─────────────────────────────────────────────────────────────
  opdQueueLength:    { type: Number, default: 0 },
  activeCounters:    { type: Number, default: 1 },
  avgServiceTimeMin: { type: Number, default: 8 },

  // ── Blood Bank ────────────────────────────────────────────────────────────
  bloodBankAvailable: { type: Boolean, default: false },
  bloodUnitsA: Number, bloodUnitsB: Number, bloodUnitsO: Number, bloodUnitsAB: Number,

  // ── Staff on Duty ─────────────────────────────────────────────────────────
  doctorsOnDuty: { type: Number, default: 0 },
  nursesOnDuty:  { type: Number, default: 0 },
  referralAcceptingEmergency: { type: Boolean, default: true },

  // ── Metadata ──────────────────────────────────────────────────────────────
  snapshotDate: { type: Date, default: Date.now },
  recordedAt:   { type: Date, default: Date.now },
  recordedBy:   String,
  recordedById: String,
  recordedRole: String,
  notes:        String,
  _synthetic:   Boolean,

}, { timestamps: true });

DailyFacilityCapacitySnapshotSchema.index({ facilityId: 1, snapshotDate: -1 });
// TTL: remove snapshots older than 365 days automatically
DailyFacilityCapacitySnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export default mongoose.model('DailyFacilityCapacitySnapshot', DailyFacilityCapacitySnapshotSchema);

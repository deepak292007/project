import mongoose from 'mongoose';

/**
 * User Schema — Government Healthcare Identity & Credential Store
 *
 * Supports Email/Password (scrypt), ABHA Health ID, and Role-Based RBAC.
 *
 * Security notes:
 *   - `password` field (plaintext) has been removed. All credentials use scrypt hashing.
 *   - `passwordHash` and `refreshTokenHash` are never returned by default (select: false).
 *   - `refreshTokenHash` is rotated on every token refresh (old tokens invalidated).
 *   - `failedLoginAttempts` and `lockedUntil` implement account lockout after 10 failures.
 */
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },

  // ── Credentials (never returned in queries by default) ──────────────────────
  // NOTE: The `password` (plaintext) field has been intentionally removed.
  // All passwords are stored as scrypt hashes only.
  passwordHash: { type: String, select: false },
  refreshTokenHash: { type: String, select: false },  // scrypt hash of current refresh token

  // ── Identity ────────────────────────────────────────────────────────────────
  name: { type: String, required: true },
  nameMarathi: String,
  nameHindi: String,

  // ── Role & Facility ─────────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['patient', 'asha', 'anm', 'phc_doctor', 'hospital_admin', 'hospital_doctor', 'district_admin'],
    required: true,
  },
  facilityId: String,
  facilityName: String,
  department: String,
  designation: String,
  districtId: String,

  // ── ASHA-specific scope ──────────────────────────────────────────────────────
  // Patient IDs of households assigned to this ASHA worker for privacy scoping.
  assignedHouseholds: { type: [String], default: [] },

  // ── Contact & Health ID ─────────────────────────────────────────────────────
  phone: String,
  abhaId: String,
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // For role='patient': linked patient record

  // ── Security ─────────────────────────────────────────────────────────────────
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockedUntil: { type: Date, select: false },
  lastLoginAt: Date,
  lastLoginIp: { type: String, select: false },

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ facilityId: 1, role: 1 });
UserSchema.index({ abhaId: 1 }, { sparse: true });

// ── Instance methods ──────────────────────────────────────────────────────────

/** Returns true if the account is currently locked due to failed login attempts. */
UserSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

/** Increment failed login counter; lock account after 10 failures for 30 minutes. */
UserSchema.methods.incrementFailedLogin = async function () {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 10) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  await this.save();
};

/** Reset failed login counter on successful login. */
UserSchema.methods.resetFailedLogin = async function (ip) {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
  await this.save();
};

export default mongoose.model('User', UserSchema);

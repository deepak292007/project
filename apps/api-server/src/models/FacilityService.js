import mongoose from 'mongoose';

/**
 * FacilityService — Permanent capability directory for a facility.
 *
 * Separate from real-time availability (DailyFacilityCapacitySnapshot).
 * Records what a facility CAN offer — its licensed, accredited services.
 * Real-time availability is tracked in DailyFacilityCapacitySnapshot.
 *
 * Used by facility matching algorithm to determine capability eligibility
 * before checking real-time capacity.
 */
const FacilityServiceSchema = new mongoose.Schema({
  facilityId:   { type: String, required: true, index: true },
  facilityName: String,

  // ── Service Classification ─────────────────────────────────────────────────
  serviceCode:  { type: String, required: true },  // e.g. 'ANC_CLINIC', 'EMERGENCY_24H', 'USG'
  name:         { type: String, required: true },
  category: {
    type: String,
    enum: ['Outpatient', 'Inpatient', 'Emergency', 'Diagnostic', 'Maternal',
           'Pediatric', 'NCD', 'Surgical', 'Teleconsult', 'Rehabilitation'],
    required: true,
  },

  // ── Availability ──────────────────────────────────────────────────────────
  isActive:      { type: Boolean, default: true },
  availableDays: [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],
  operatingHoursStart: String,  // 'HH:MM'
  operatingHoursEnd:   String,
  is24h:               { type: Boolean, default: false },

  // ── Requirements ──────────────────────────────────────────────────────────
  requiresReferral:   { type: Boolean, default: false },
  qualifiedStaff:     [String],  // e.g. ['MBBS', 'MD Obstetrics', 'Staff Nurse']
  equipmentRequired:  [String],  // e.g. ['Ultrasound', 'ECG Machine']

  // ── Charges ───────────────────────────────────────────────────────────────
  chargeType: { type: String, enum: ['free', 'subsidized', 'chargeable'], default: 'free' },
  chargeNote: String,

  // ── Provenance ────────────────────────────────────────────────────────────
  createdBy:    String,
  createdById:  String,
  _synthetic:   Boolean,

}, { timestamps: true });

FacilityServiceSchema.index({ facilityId: 1, isActive: 1, category: 1 });
FacilityServiceSchema.index({ serviceCode: 1 });

export default mongoose.model('FacilityService', FacilityServiceSchema);

import mongoose from 'mongoose';

/**
 * Appointment — Scheduled patient visits or teleconsults.
 *
 * Tracks booking → confirmation → attendance lifecycle.
 * Linked to patient and facility; optionally to an encounter after completion.
 */
const AppointmentSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  facilityId:  { type: String, required: true, index: true },
  facilityName: String,
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' }, // Set after visit

  // ── Schedule ──────────────────────────────────────────────────────────────
  scheduledAt:     { type: Date, required: true },
  durationMinutes: { type: Number, default: 15 },
  slotToken:       String,   // OPD queue token

  // ── Classification ────────────────────────────────────────────────────────
  serviceType: {
    type: String,
    enum: ['OPD', 'ANC', 'PNC', 'Immunization', 'NCD_Followup', 'Teleconsult',
           'Diagnostic', 'PostDischarge', 'SpecialistReferral'],
    default: 'OPD',
  },
  specialty:        String,
  practitionerName: String,
  practitionerId:   String,

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'arrived', 'fulfilled', 'cancelled', 'no-show'],
    default: 'booked',
  },
  cancellationReason: String,
  reminderSent:       { type: Boolean, default: false },
  reminderSentAt:     Date,

  notes:      String,
  _synthetic: Boolean,

  // ── Booking provenance ────────────────────────────────────────────────────
  bookedBy:    String,
  bookedById:  String,
  bookedRole:  String,

}, { timestamps: true });

AppointmentSchema.index({ patientId: 1, scheduledAt: 1 });
AppointmentSchema.index({ facilityId: 1, scheduledAt: 1, status: 1 });

export default mongoose.model('Appointment', AppointmentSchema);

import mongoose from 'mongoose';

/**
 * OPBooking Schema — Outpatient Appointment & Dynamic Queue Token System
 * Uses Queueing Theory (M/M/c model) to compute dynamic patient waiting times.
 */
const OPBookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  tokenNumber: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String, required: true },
  abhaId: String,
  phone: String,
  facilityId: { type: String, required: true },
  facilityName: { type: String, required: true },
  department: { type: String, default: 'General OPD' },
  doctorName: String,
  bookingDate: { type: Date, default: Date.now },
  slotTime: String,
  queuePosition: { type: Number, required: true },
  estimatedWaitMinutes: { type: Number, required: true },
  priorityScore: { type: Number, default: 50 },
  symptoms: [String],
  clinicalUrgency: { type: String, enum: ['emergency', 'urgent', 'routine', 'home_care'], default: 'routine' },
  status: {
    type: String,
    enum: ['confirmed', 'called_in', 'in_consultation', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  consultationFee: { type: Number, default: 0 } // Free public healthcare (NHM / Aarogyasri)
}, { timestamps: true });

export default mongoose.model('OPBooking', OPBookingSchema);

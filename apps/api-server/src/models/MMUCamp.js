import mongoose from 'mongoose';

/**
 * MMUCamp Schema — Mobile Medical Unit (MMU) Outreach Schedule
 * Government of Maharashtra NHM Mobile Health Teams visiting remote tribal hamlets
 */
const MMUCampSchema = new mongoose.Schema({
  campId: { type: String, unique: true, required: true },
  village: { type: String, required: true },
  block: { type: String, required: true },
  district: { type: String, default: 'Palghar' },
  locationCoordinates: {
    lat: Number,
    lng: Number
  },
  scheduledDate: { type: Date, required: true },
  timings: { type: String, default: '09:30 AM - 03:30 PM' },
  teamLeadDoctor: String,
  specialtiesAvailable: [String], // e.g. ['General Physician', 'Gynecologist', 'Pediatrician', 'Ophthalmology']
  equipmentOnboard: [String], // e.g. ['Portable Ultrasound', 'ECG', 'Rapid Blood Analyzer', 'Free Pharmacy']
  targetVillagesCovered: [String],
  ashaContact: String,
  ashaPhone: String,
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'rescheduled'], default: 'scheduled' }
}, { timestamps: true });

export default mongoose.model('MMUCamp', MMUCampSchema);

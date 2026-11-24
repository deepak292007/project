import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  bedsTotal: Number,
  bedsOccupied: Number,
  icuTotal: Number,
  icuOccupied: Number,
  oxygenBeds: Number,
  oxygenOccupied: Number,
  ventilators: Number,
  ventilatorsInUse: Number,
  ambulances: Number,
  ambulancesAvailable: Number,
  operatingTheatres: Number,
  otAvailable: Number,
}, { _id: false });

const DiagnosticSchema = new mongoose.Schema({
  name: String,          // e.g. 'X-Ray', 'Sonography', 'CBC'
  available: Boolean,
  slots: Number,         // remaining today
  waitHrs: Number
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialty: String,
  availableToday: Boolean,
  teleconsultAvailable: Boolean,
  nextSlot: String
}, { _id: false });

const FacilitySchema = new mongoose.Schema({
  facilityId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  nameMarathi: String,
  nameTelugu: String,
  nameKannada: String,
  nameHindi: String,
  type: String, // e.g. "Tertiary / Government Medical College Hospital", "Private Multi-Specialty", "Area Hospital"
  level: { type: String, default: 'phc' },
  block: String,
  district: { type: String, default: 'Palghar' },
  city: String,
  state: { type: String, default: 'Andhra Pradesh' },
  address: String,
  phone: String,
  lat: Number,
  lng: Number,
  beds: { type: Number, default: 20 },
  icuBeds: { type: Number, default: 2 },
  oxygenAvailable: { type: Boolean, default: true },
  specialties: [String],
  specialistsAvailableToday: [String],
  currentOPLoad: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  empanelledSchemes: { type: [String], default: ['Ayushman Bharat', 'Dr. NTR Vaidya Seva'] },
  isEmergencyCapable: { type: Boolean, default: true },
  equipment: [String],
  currentOpdQueue: {
    queueLength: { type: Number, default: 8 },
    activeCounters: { type: Number, default: 2 },
    avgServiceTimeMin: { type: Number, default: 7 }
  },
  resources: ResourceSchema,
  diagnostics: [DiagnosticSchema],
  doctors: [DoctorSchema],
  departments: [String],
  emergencyOpen24h: { type: Boolean, default: false },
  nhsFacilityCode: String,
  hmisCode: String,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Facility', FacilitySchema);

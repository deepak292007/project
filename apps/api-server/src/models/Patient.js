import mongoose from 'mongoose';

const VitalSchema = new mongoose.Schema({
  bp: String, pulse: Number, temp: Number, spo2: Number,
  weight: Number, height: Number, recordedAt: Date, recordedBy: String
}, { _id: false });

const PatientSchema = new mongoose.Schema({
  abhaId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  nameMarathi: String,
  age: Number,
  gender: { type: String, enum: ['M', 'F', 'O'] },
  dob: Date,
  village: String,
  block: String,
  district: { type: String, default: 'Palghar' },
  state: { type: String, default: 'Maharashtra' },
  phone: String,
  asha: String,          // ASHA worker name
  ashaPhone: String,
  rationCardCategory: { type: String, enum: ['BPL', 'AAY', 'APL', 'None'], default: 'None' },
  riskCategory: { type: String, enum: ['high', 'moderate', 'low'], default: 'low' },
  conditions: [String],  // e.g. ['ANC', 'HTN', 'T2DM']
  latestVitals: VitalSchema,
  registeredAt: { type: Date, default: Date.now },
  lastSeen: Date,
  photo: String,
}, { timestamps: true });

export default mongoose.model('Patient', PatientSchema);

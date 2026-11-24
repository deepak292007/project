import mongoose from 'mongoose';

/**
 * CareTeam Schema — Multi-disciplinary care team for a patient
 * (ASHA, ANM, Medical Officer, Specialist Doctor, Community Health Officer)
 */
const CareTeamMemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['asha', 'anm', 'cho', 'phc_doctor', 'hospital_doctor', 'specialist', 'caregiver'],
    required: true
  },
  facilityId: String,
  facilityName: String,
  phone: String,
  isPrimary: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const CareTeamSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  name: { type: String, default: 'Primary Rural Care Team' },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  category: {
    type: String,
    enum: ['maternal_child', 'ncd_chronic', 'emergency_trauma', 'general'],
    default: 'general'
  },
  members: [CareTeamMemberSchema],
  managingOrganization: { type: String, default: 'National Health Mission' },
  notes: String,
  periodStart: { type: Date, default: Date.now },
  periodEnd: Date
}, { timestamps: true });

CareTeamSchema.index({ patientId: 1, status: 1 });

export default mongoose.model('CareTeam', CareTeamSchema);

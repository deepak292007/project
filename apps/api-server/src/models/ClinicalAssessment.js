import mongoose from 'mongoose';

const RecommendationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['test_kit', 'machine', 'service'], required: true },
  priority: { type: String, enum: ['stat', 'same_day', 'routine'], default: 'routine' },
  reason: String,
}, { _id: false });

const FacilityMatchSchema = new mongoose.Schema({
  facilityId: { type: String, required: true }, facilityName: String, distanceKm: Number,
  travelMinutes: Number, matchScore: Number, matchedResources: [String], missingResources: [String],
  emergencyOpen24h: Boolean, bedsAvailable: Number,
}, { _id: false });

// Append-only decision-support snapshot: preserves what ASHA, hospital and patient saw at assessment time.
const ClinicalAssessmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', index: true },
  source: { type: String, enum: ['patient', 'asha', 'anm', 'doctor', 'system'], required: true },
  capturedBy: { name: String, userId: String, role: String, facilityId: String },
  language: { type: String, default: 'en' }, symptoms: [String], symptomNarrative: { type: String, maxlength: 4000 },
  vitals: { bp: String, pulse: Number, temp: Number, spo2: Number, weight: Number, recordedAt: Date },
  ai: {
    provider: { type: String, default: 'ArogyaLink Clinical CDS' }, version: { type: String, default: '1.0' }, summary: String,
    urgency: { type: String, enum: ['emergency', 'urgent', 'routine', 'home_care'], required: true }, urgencyReason: String,
    redFlags: [String], suggestedDepartment: String, recommendedFacilityLevel: String, confidence: Number,
    requiresClinicianReview: { type: Boolean, default: true },
  },
  recommendations: [RecommendationSchema], facilityMatches: [FacilityMatchSchema], selectedFacilityId: String,
  clinicianReview: { status: { type: String, enum: ['pending', 'accepted', 'overridden'], default: 'pending' }, reviewedBy: String, reviewedAt: Date, note: String },
  consent: { decisionSupportAcceptedAt: Date, capturedBy: String },
}, { timestamps: true });

ClinicalAssessmentSchema.index({ patientId: 1, createdAt: -1 });
ClinicalAssessmentSchema.index({ 'ai.urgency': 1, createdAt: -1 });
export default mongoose.model('ClinicalAssessment', ClinicalAssessmentSchema);

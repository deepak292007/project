import mongoose from 'mongoose';

/**
 * DiagnosticSample Schema — Rwanda Babyl/Zipline & China Hub-and-Spoke Lab Model
 * Allows remote village patients to have blood/urine samples collected at Sub-Centre/PHC
 * Courier/drone transit routes the sample to District Hospital Central Lab.
 * Digital report uploads straight to the patient's ABHA longitudinal record.
 * Eliminates out-of-pocket travel for diagnostics.
 */
const DiagnosticSampleSchema = new mongoose.Schema({
  sampleBarcode: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: String,
  abhaId: String,
  collectedAtFacilityId: { type: String, required: true },
  collectedAtFacilityName: String,
  collectedBy: String, // ASHA or ANM
  testTypes: [String], // e.g. ['CBC', 'Serum Ferritin', 'HbA1c', 'LFT/KFT', 'Thyroid TSH']
  urgency: { type: String, enum: ['emergency', 'urgent', 'routine'], default: 'routine' },
  status: {
    type: String,
    enum: ['collected', 'in_transit_courier', 'received_at_hub_lab', 'processing', 'completed', 'report_ready'],
    default: 'collected'
  },
  destinationLabId: { type: String, default: 'DH-PALGHAR-01' },
  destinationLabName: { type: String, default: 'District Hospital Palghar Central Laboratory' },
  transitDetails: {
    courierName: String,
    courierPhone: String,
    transitMethod: { type: String, enum: ['cold_chain_bike', 'hub_van', 'drone_air'], default: 'cold_chain_bike' },
    pickupTime: Date,
    estArrivalAtLab: Date,
    temperatureMaintainedCelsius: Number // Cold chain verification (e.g. 4°C)
  },
  results: [
    {
      testName: String,
      value: String,
      unit: String,
      normalRange: String,
      isAbnormal: Boolean,
      verifiedByPathologist: String
    }
  ],
  digitalReportPdfUrl: String,
  collectedAt: { type: Date, default: Date.now },
  reportCompletedAt: Date
}, { timestamps: true });

export default mongoose.model('DiagnosticSample', DiagnosticSampleSchema);

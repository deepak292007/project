import mongoose from 'mongoose';

/**
 * TransportDispatch Schema — Long-Distance Rural Health Access Solution
 * Combines 108 Emergency Medical Transport, Janani Express (JSSK), and Inter-Facility Transit Waypoints
 * Inspired by global rural emergency networks and India NHM 108 protocol.
 */
const TransportDispatchSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  abhaId: String,
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral' },
  serviceType: { 
    type: String, 
    enum: ['108_emergency', '102_janani_maternity', 'mmu_shuttle', 'patient_transport_voucher'], 
    default: '108_emergency' 
  },
  pickupLocation: {
    village: String,
    facilityId: String,
    facilityName: String,
    lat: Number,
    lng: Number,
    address: String
  },
  dropoffLocation: {
    facilityId: String,
    facilityName: String,
    lat: Number,
    lng: Number,
    address: String
  },
  intermediateWaypoint: {
    facilityId: String,
    facilityName: String,
    facilityLevel: String,
    reason: String, // e.g. 'Intermediate stabilization: Oxygen check and IV fluid top-up'
    kmFromPickup: Number,
    estArrivalMin: Number
  },
  vehicleNumber: String,
  driverName: String,
  driverPhone: String,
  emtName: String, // Emergency Medical Technician on board
  emtPhone: String,
  currentStatus: { 
    type: String, 
    enum: ['dispatched', 'at_pickup', 'stabilizing_at_waypoint', 'en_route', 'arrived_hospital', 'completed', 'cancelled'], 
    default: 'dispatched' 
  },
  liveTelemetry: {
    currentLat: Number,
    currentLng: Number,
    speedKmph: Number,
    lastPingAt: Date,
    etaMinutes: Number,
    distanceRemainingKm: Number,
    oxygenSupplyAvailable: Boolean,
    vitalsMonitoredInTransit: {
      spo2: Number,
      pulse: Number,
      bp: String
    }
  },
  govSchemeCovered: {
    schemeName: { type: String, default: 'Janani Shishu Suraksha Karyakram (JSSK) / MH 108 Emergency' },
    isFreeOfCost: { type: Boolean, default: true },
    voucherCode: String,
    beneficiarySubsidyAmt: { type: Number, default: 0 } // Free under govt mandate
  },
  requestedBy: String,
  role: String,
  dispatchedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true });

export default mongoose.model('TransportDispatch', TransportDispatchSchema);

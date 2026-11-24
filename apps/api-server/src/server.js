import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { WebSocketServer, WebSocket } from 'ws';

// ─── Longitudinal Health Record & System Models ──────────────────────────────
import Patient from './models/Patient.js';
import Encounter from './models/Encounter.js';
import Referral from './models/Referral.js';
import Facility from './models/Facility.js';
import Stock from './models/Stock.js';
import Followup from './models/Followup.js';
import Feedback from './models/Feedback.js';
import AuditLog from './models/AuditLog.js';
import TransportDispatch from './models/TransportDispatch.js';
import DiagnosticSample from './models/DiagnosticSample.js';
import MMUCamp from './models/MMUCamp.js';
import User from './models/User.js';
import OPBooking from './models/OPBooking.js';
import MedicineDeliveryRequest from './models/MedicineDeliveryRequest.js';
import ClinicalAssessment from './models/ClinicalAssessment.js';
import SyncEvent from './models/SyncEvent.js';
import Observation from './models/Observation.js';
import Condition from './models/Condition.js';
import Consent from './models/Consent.js';
import CarePlan from './models/CarePlan.js';
import Appointment from './models/Appointment.js';
import FacilityService from './models/FacilityService.js';
import DailyFacilityCapacitySnapshot from './models/DailyFacilityCapacitySnapshot.js';
import DiagnosticOrder from './models/DiagnosticOrder.js';
import DiagnosticReport from './models/DiagnosticReport.js';
import MedicationRequest from './models/MedicationRequest.js';
import CareTeam from './models/CareTeam.js';
import OfflineDevice from './models/OfflineDevice.js';
import ConflictRecord from './models/ConflictRecord.js';

// ─── Middleware & Services ────────────────────────────────────────────────────
import { requireAuth, optionalAuth, signAccessToken, signRefreshToken, verifyRefreshToken } from './middleware/auth.js';
import { requireRoles, requireFacilityScope, requirePatientScope, requireWriteScope } from './middleware/authorize.js';
import { requestId } from './middleware/requestId.js';
import { loginLimiter, apiLimiter, triageLimiter, adminActionLimiter } from './middleware/rateLimiter.js';
import { validateBody, sanitizeRegex } from './middleware/validate.js';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { buildClinicalDecision, matchFacilities } from './services/clinicalDecisionSupport.js';
import { hashPassword, verifyPassword } from './services/passwords.js';

// ─── lnkling Multilingual AI & Nemotron Hospital Ranking ──────────────────────
import { analyzeSymptoms, translateText } from './ai/lnklingClient.js';
import { rankFacilitiesWithNemotron } from './ai/nemotronRanker.js';
import { processHealthAssistantQuery } from './ai/healthAssistantEngine.js';
import { generateDashboardInsights } from './ai/dashboardInsightsEngine.js';
import {
  toFHIRPatient,
  toFHIREncounter,
  toFHIRObservation,
  toFHIRServiceRequest,
  toFHIROrganization,
  wrapBundle
} from './services/fhirAdapter.js';

import {
  FACILITIES,
  PATIENTS,
  ENCOUNTERS_SAVITA,
  REFERRAL_SAVITA,
  STOCK_DATA,
  FOLLOWUPS,
  TRANSPORT_DISPATCHES,
  DIAGNOSTIC_SAMPLES,
  MMU_CAMPS,
  USERS_DATA,
  GRIEVANCES_DATA,
  INITIAL_OP_BOOKINGS,
  ALL_REFERRALS_DATA,
  TIME_SERIES_ENCOUNTERS,
  EXPANDED_STOCK_DATA
} from './seedData.js';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arogyalink';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !IS_PRODUCTION;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(x => x.trim());

// ─── In-Memory Fallback State (Active when MongoDB is offline / not installed) ──
const inMemPatients = [...PATIENTS];
const inMemEncounters = [...ENCOUNTERS_SAVITA];
const inMemReferrals = [
  REFERRAL_SAVITA,
  {
    _id: 'ref-lakshmi-01',
    patientId: 'pat-lakshmi',
    patientName: 'Lakshmi Devi',
    fromFacilityId: 'PHC-INAVOLU-01',
    fromFacilityName: 'Dr. YSR Village Health Clinic - Inavolu',
    toFacilityId: 'AP-GNT-002',
    toFacilityName: 'AIIMS Mangalagiri',
    department: 'Obstetrics & Gynaecology',
    urgency: 'urgent',
    reason: 'ANC 34 weeks, persistent elevated BP 145/95 mmHg, mild pretibial oedema.',
    currentStage: 'en_route',
    transportMode: '108 Janani Express',
    ambulanceNumber: 'AP-07-TY-1082',
    driverPhone: '9848099881',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    updatedAt: new Date(),
    stageHistory: [
      { stage: 'initiated', timestamp: new Date(Date.now() - 3600 * 1000 * 2), notes: 'Initiated by PHC MO Dr. Ramesh' },
      { stage: 'transit_assigned', timestamp: new Date(Date.now() - 3600 * 1000 * 1.5), notes: '108 Ambulance dispatched' },
      { stage: 'en_route', timestamp: new Date(Date.now() - 3600 * 1000 * 0.8), notes: 'Vehicle in transit with ASHA worker accompanying' }
    ]
  }
];
const inMemPrescriptions = [
  {
    _id: 'rx-savita-01',
    patientId: 'pat-savita',
    patientName: 'Savita Patil',
    abhaId: 'ABHA-2026-98765432109876',
    facilityId: 'RH-KHED-01',
    facilityName: 'Rural Hospital Khed',
    prescribedBy: 'Dr. Rajesh Deshmukh',
    authoredOn: new Date(Date.now() - 86400000),
    status: 'active',
    medications: [
      { name: 'Tab. Labetalol 100mg', dose: '1 tab', route: 'Oral', freq: 'BD', days: '14' },
      { name: 'Tab. Iron & Folic Acid (IFA)', dose: '1 tab', route: 'Oral', freq: 'OD', days: '30' },
      { name: 'Tab. Calcium carbonate 500mg', dose: '1 tab', route: 'Oral', freq: 'BD', days: '30' }
    ],
    note: 'Monitor blood pressure daily with ASHA worker. Report immediately if severe headache or blurred vision occurs.',
    followupDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  },
  {
    _id: 'rx-lakshmi-01',
    patientId: 'pat-lakshmi',
    patientName: 'Lakshmi Devi',
    abhaId: 'ABHA-AP-2026-00101',
    facilityId: 'PHC-INAVOLU-01',
    facilityName: 'Dr. YSR Village Health Clinic - Inavolu',
    prescribedBy: 'Dr. Ramesh Patkar',
    authoredOn: new Date(),
    status: 'active',
    medications: [
      { name: 'Tab. Paracetamol 500mg', dose: '1 tab', route: 'Oral', freq: 'TDS', days: '3' },
      { name: 'Oral Rehydration Salts (ORS)', dose: '1 sachet in 1L water', route: 'Oral', freq: 'SOS', days: '3' },
      { name: 'Tab. Cetirizine 10mg', dose: '1 tab', route: 'Oral', freq: 'HS', days: '5' }
    ],
    note: 'Hydrate adequately, avoid strenuous exertion, follow up if temperature exceeds 101°F.',
    followupDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  }
];
const inMemAssessments = [
  {
    _id: 'assess-savita-01',
    patientId: 'pat-savita',
    source: 'patient',
    language: 'mr',
    symptoms: ['डोकेदुखी (Headache)', 'पायाला सूज (Pedal Oedema)'],
    vitals: { sbp: 148, dbp: 96, pulse: 84, spo2: 98, tempF: 98.4 },
    ai: {
      provider: 'ArogyaLink CDSS / WHO-IMCI-IMAI Rules Engine',
      summary: 'High-risk gestational hypertension with pedal oedema. Priority referral recommended.',
      urgency: 'urgent',
      redFlags: ['Systolic BP >= 140', 'Diastolic BP >= 90', 'ANC 3rd Trimester'],
      suggestedDepartment: 'Obstetrics & Gynaecology',
      recommendedFacilityLevel: 'sub_district_hospital'
    },
    recommendations: [
      { name: 'Immediate Blood Pressure stabilization & Urinalysis (Proteinuria check)' },
      { name: 'Non-Stress Test (NST) & Obstetric Ultrasound' }
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 4)
  }
];
const inMemFollowups = [...FOLLOWUPS];
const inMemObservations = [
  {
    _id: 'obs-01',
    patientId: 'pat-savita',
    code: '85354-9',
    display: 'Blood Pressure',
    value: '148/96 mmHg',
    recordedAt: new Date(Date.now() - 3600 * 1000 * 6),
    status: 'final'
  },
  {
    _id: 'obs-02',
    patientId: 'pat-savita',
    code: '59408-5',
    display: 'Oxygen Saturation (SpO2)',
    value: '98%',
    recordedAt: new Date(Date.now() - 3600 * 1000 * 6),
    status: 'final'
  }
];
const inMemConditions = [
  {
    _id: 'cond-01',
    patientId: 'pat-savita',
    name: 'Gestational Hypertension (O13.9)',
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    recordedDate: new Date(Date.now() - 86400000 * 7)
  }
];
const inMemConsents = [
  {
    _id: 'cons-01',
    patientId: 'pat-savita',
    status: 'active',
    scope: 'patient-privacy',
    category: 'ABHA Data Exchange',
    dateTime: new Date(Date.now() - 86400000 * 14)
  }
];
const inMemCarePlans = [
  {
    _id: 'cp-01',
    patientId: 'pat-savita',
    title: 'Maternal High-Risk ANC Monitoring Protocol',
    status: 'active',
    intent: 'plan',
    period: { start: new Date(Date.now() - 86400000 * 14), end: new Date(Date.now() + 86400000 * 60) },
    createdAt: new Date(Date.now() - 86400000 * 14)
  }
];

const publicUser = user => {
  const { password, passwordHash, refreshTokenHash, failedLoginAttempts, lockedUntil, lastLoginIp, ...safeUser } = user?.toObject ? user.toObject() : user;
  return safeUser;
};

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(requestId);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || DEMO_MODE || !IS_PRODUCTION) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '4mb' }));
app.use('/api/', apiLimiter);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2500 });
    console.log(`✓ MongoDB connected: ${MONGO_URI}`);
  } catch (err) {
    console.warn(`⚠ MongoDB not available (${err.message}). Running in offline-demo mode.`);
  }
}

// ─── HTTP + WebSocket ─────────────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

function audit(action, entityType, entityId, by, role, details = {}, req = null) {
  if (mongoose.connection.readyState === 1) {
    AuditLog.create({
      action,
      entityType,
      entityId: String(entityId),
      performedBy: by,
      role,
      details: { ...details, requestId: req?.requestId },
      ip: req?.ip
    }).catch(() => {});
  }
}

// WebSocket signaling & teleconsult rooms
const rooms = new Map();
wss.on('connection', ws => {
  ws.isAlive = true;
  let roomId = null;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join-room') {
        roomId = msg.roomId;
        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add(ws);
        rooms.get(roomId).forEach(p => {
          if (p !== ws && p.readyState === WebSocket.OPEN)
            p.send(JSON.stringify({ type: 'peer-joined', peerId: msg.userId, role: msg.role, userName: msg.userName }));
        });
      } else if (msg.type === 'signal' && roomId && rooms.has(roomId)) {
        rooms.get(roomId).forEach(p => {
          if (p !== ws && p.readyState === WebSocket.OPEN)
            p.send(JSON.stringify({ type: 'signal', signal: msg.signal, from: msg.userId }));
        });
      } else if (msg.type === 'leave-room' && roomId) {
        rooms.get(roomId)?.delete(ws);
      } else if (msg.type === 'sos') {
        broadcast('sos-alert', { message: msg.message, location: msg.location, patientId: msg.patientId });
      }
    } catch (_) {}
  });
  ws.on('close', () => { if (roomId) rooms.get(roomId)?.delete(ws); });
});

// Heartbeat
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

const dbOk = () => mongoose.connection.readyState === 1;

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db: dbOk() ? 'connected' : 'offline',
  requestId: req.requestId,
  ts: new Date()
}));

// ─── Authentication API (Login, Refresh, Logout, Users list, Registration) ───
app.post('/api/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (dbOk()) {
    const user = await User.findOne({ email: cleanEmail }).select('+password +passwordHash +refreshTokenHash +failedLoginAttempts +lockedUntil');
    if (!user) {
      // In development demo mode only, fallback to USERS_DATA for instant onboarding
      const staticUser = USERS_DATA.find(u => u.email.toLowerCase() === cleanEmail);
      if (DEMO_MODE && staticUser && staticUser.password === password) {
        const tokenPayload = { sub: staticUser.email, role: staticUser.role, name: staticUser.name, facilityId: staticUser.facilityId };
        const accessToken = signAccessToken(tokenPayload);
        const refreshToken = signRefreshToken(staticUser.email);
        res.cookie('al_refresh', refreshToken, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
        return res.json({ ok: true, user: publicUser(staticUser), accessToken, tokenType: 'Bearer' });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({ error: 'Account locked due to consecutive failed login attempts. Please try again later.' });
    }

    const passwordValid = (user.passwordHash && await verifyPassword(password, user.passwordHash))
      || (DEMO_MODE && user.password === password);

    if (!passwordValid) {
      if (user.incrementFailedLogin) await user.incrementFailedLogin();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.resetFailedLogin) await user.resetFailedLogin(req.ip);

    // Issue JWT Access and Refresh Tokens
    const tokenPayload = {
      sub: String(user._id),
      role: user.role,
      facilityId: user.facilityId,
      districtId: user.districtId || 'Palghar',
      name: user.name,
      patientId: user.patientId ? String(user.patientId) : undefined,
      assignedHouseholds: user.assignedHouseholds || []
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(user._id);

    // Store rotated refresh token hash
    user.refreshTokenHash = await hashPassword(refreshToken);
    await user.save();

    res.cookie('al_refresh', refreshToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000
    });

    audit('USER_LOGIN_SUCCESS', 'User', user._id, user.name, user.role, { ip: req.ip }, req);

    return res.json({
      ok: true,
      user: publicUser(user),
      accessToken,
      tokenType: 'Bearer'
    });
  } else {
    // Offline Memory Fallback
    const staticUser = USERS_DATA.find(u => u.email.toLowerCase() === cleanEmail);
    if (DEMO_MODE && staticUser && staticUser.password === password) {
      const accessToken = signAccessToken({ sub: staticUser.email, role: staticUser.role, name: staticUser.name });
      return res.json({ ok: true, user: publicUser(staticUser), accessToken, tokenType: 'Bearer' });
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  }
}));

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.al_refresh || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  const payload = verifyRefreshToken(token);
  if (!payload?.sub) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  if (!dbOk()) return res.status(503).json({ error: 'DB unavailable for token rotation' });

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'Session expired or invalidated' });

  const isValid = await verifyPassword(token, user.refreshTokenHash);
  if (!isValid) {
    // Possible token reuse attack — invalidate stored refresh token
    user.refreshTokenHash = undefined;
    await user.save();
    return res.status(401).json({ error: 'Token reuse detected; session revoked' });
  }

  // Rotate refresh token
  const newAccessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    facilityId: user.facilityId,
    name: user.name,
    patientId: user.patientId ? String(user.patientId) : undefined,
    assignedHouseholds: user.assignedHouseholds || []
  });
  const newRefreshToken = signRefreshToken(user._id);

  user.refreshTokenHash = await hashPassword(newRefreshToken);
  await user.save();

  res.cookie('al_refresh', newRefreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000
  });

  res.json({ ok: true, accessToken: newAccessToken, tokenType: 'Bearer' });
}));

app.post('/api/auth/logout', optionalAuth, asyncHandler(async (req, res) => {
  if (req.user?.sub && dbOk()) {
    await User.findByIdAndUpdate(req.user.sub, { $unset: { refreshTokenHash: 1 } });
  }
  res.clearCookie('al_refresh');
  res.json({ ok: true, message: 'Logged out successfully' });
}));

app.get('/api/auth/users', optionalAuth, asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role) filter.role = role;
  const users = dbOk()
    ? await User.find(filter).select('-password -passwordHash -refreshTokenHash')
    : USERS_DATA.filter(u => !role || u.role === role).map(({ password, ...user }) => user);
  res.json({ data: users });
}));

app.post('/api/auth/register', validateBody('register'), asyncHandler(async (req, res) => {
  const { name, nameMarathi, nameHindi, email, password, phone, abhaId, village, age, gender } = req.body;
  const cleanEmail = String(email).trim().toLowerCase();

  let createdPatient = null;
  const generatedAbha = abhaId || `ABHA-MH-${Date.now().toString().slice(-6)}`;

  if (dbOk()) {
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ error: 'User already exists with this email' });

    createdPatient = await Patient.create({
      name,
      nameMarathi: nameMarathi || name,
      abhaId: generatedAbha,
      age: Number(age) || 30,
      gender: gender || 'F',
      village: village || 'Kelwa Gaon',
      district: 'Palghar',
      state: 'Maharashtra',
      phone: phone || '9800000000',
      riskCategory: 'low',
      rationCardCategory: 'BPL'
    });

    const newUser = await User.create({
      name,
      nameMarathi: nameMarathi || name,
      nameHindi: nameHindi || name,
      email: cleanEmail,
      passwordHash: await hashPassword(password),
      role: 'patient',
      phone: phone || '9800000000',
      abhaId: generatedAbha,
      patientId: createdPatient._id,
      designation: 'Citizen / Registered Patient'
    });

    const accessToken = signAccessToken({
      sub: String(newUser._id),
      role: 'patient',
      name: newUser.name,
      patientId: String(createdPatient._id)
    });
    const refreshToken = signRefreshToken(newUser._id);
    newUser.refreshTokenHash = await hashPassword(refreshToken);
    await newUser.save();

    res.cookie('al_refresh', refreshToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000
    });

    audit('PATIENT_SELF_REGISTERED', 'User', newUser._id, name, 'patient', { patientId: createdPatient._id }, req);

    return res.status(201).json({
      ok: true,
      user: publicUser(newUser),
      patient: createdPatient,
      accessToken,
      tokenType: 'Bearer'
    });
  }

  res.status(201).json({ ok: true, message: 'Offline registration acknowledged' });
}));

// ─── Offline-First Synchronisation ───────────────────────────────────────────
// Idempotent sync endpoint supporting Patient, Encounter, Referral, Task, Observation, Assessment
// Protects clinician's final decisions from being overwritten by delayed offline updates.
app.post('/api/sync', asyncHandler(async (req, res) => {
  const { id: clientEventId, deviceId, resourceType, action, payload = {} } = req.body;
  if (!clientEventId || !resourceType || !action) {
    return res.status(400).json({ error: 'id, resourceType and action are required' });
  }
  if (!dbOk()) {
    if (resourceType === 'Patient' || resourceType === 'patient') {
      inMemPatients.unshift({ _id: payload._id || `pat-${Date.now()}`, ...payload });
    } else if (resourceType === 'Encounter' || resourceType === 'encounter') {
      inMemEncounters.unshift({ _id: payload._id || `enc-${Date.now()}`, ...payload });
    } else if (resourceType === 'Referral' || resourceType === 'referral') {
      inMemReferrals.unshift({ _id: payload._id || `ref-${Date.now()}`, ...payload });
    }
    return res.json({
      data: {
        synced: true,
        offlineMode: true,
        resourceId: payload._id || `res-${Date.now()}`,
        serverTimestamp: new Date().toISOString()
      }
    });
  }

  const previous = await SyncEvent.findOne({ clientEventId });
  if (previous?.status === 'completed') {
    return res.json({
      data: {
        synced: true,
        duplicate: true,
        resourceId: previous.resourceId,
        serverTimestamp: previous.serverTimestamp
      }
    });
  }

  let record;
  let conflictResolution = 'none';

  // 1. Conflict detection & Clinical Override Protection
  if (action === 'UPDATE' && payload._id) {
    if (resourceType === 'ClinicalAssessment') {
      const serverDoc = await ClinicalAssessment.findById(payload._id);
      if (serverDoc?.clinicianReview?.status === 'accepted' || serverDoc?.clinicianReview?.status === 'overridden') {
        // CLINICIAN FINAL DECISION IMMUTABILITY: Reject delayed offline overwrite
        await ConflictRecord.create({
          clientEventId,
          deviceId,
          resourceType,
          resourceId: payload._id,
          clientAction: action,
          clientPayload: payload,
          serverStateSnapshot: serverDoc.toObject(),
          resolution: 'clinician_final_preserved',
          reason: 'Doctor final diagnosis/override already recorded on server; delayed offline update rejected.'
        });

        await SyncEvent.findOneAndUpdate(
          { clientEventId },
          {
            clientEventId,
            deviceId,
            resourceType,
            action,
            resourceId: payload._id,
            status: 'conflict_resolved',
            resolution: 'clinician_final_preserved',
            serverTimestamp: new Date()
          },
          { upsert: true }
        );

        return res.json({
          data: {
            synced: true,
            conflictResolution: 'clinician_final_preserved',
            message: 'Server has clinician-reviewed final status. Device state reconciled to server authority.'
          }
        });
      }
    }
  }

  // 2. Perform write based on resourceType
  if (resourceType === 'Patient') {
    record = action === 'CREATE'
      ? await Patient.create(payload)
      : await Patient.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true });
  } else if (resourceType === 'Encounter') {
    record = action === 'CREATE'
      ? await Encounter.create(payload)
      : await Encounter.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true });
  } else if (resourceType === 'Referral') {
    record = action === 'CREATE'
      ? await Referral.create(payload)
      : await Referral.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true });
  } else if (resourceType === 'Observation') {
    record = action === 'CREATE'
      ? await Observation.create(payload)
      : await Observation.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true });
  } else if (resourceType === 'ClinicalAssessment') {
    record = action === 'CREATE'
      ? await ClinicalAssessment.create(payload)
      : await ClinicalAssessment.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true });
  }

  await SyncEvent.findOneAndUpdate(
    { clientEventId },
    {
      clientEventId,
      deviceId,
      resourceType,
      action,
      resourceId: record?._id,
      status: 'completed',
      serverTimestamp: new Date()
    },
    { upsert: true }
  );

  broadcast('sync-applied', { clientEventId, resourceType, action, resourceId: record?._id });

  res.json({
    data: {
      synced: true,
      resourceId: record?._id,
      serverTimestamp: new Date().toISOString()
    }
  });
}));

// Device Registration
app.post('/api/devices/register', asyncHandler(async (req, res) => {
  const { deviceId, userId, userName, role, facilityId, facilityName, appVersion, platform, userAgent } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
  if (!dbOk()) return res.json({ ok: true, data: { deviceId, userName, role } });

  const device = await OfflineDevice.findOneAndUpdate(
    { deviceId },
    { deviceId, userId, userName, role, facilityId, facilityName, appVersion, platform, userAgent, lastSyncAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ ok: true, data: device });
}));

// ─── Patients API ─────────────────────────────────────────────────────────────
app.get('/api/patients', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemPatients });
  const { asha, risk, q } = req.query;
  const filter = {};

  // Enforce ASHA privacy scope: if ASHA user, show only assigned households
  if (req.user?.role === 'asha' && req.user.assignedHouseholds?.length) {
    filter._id = { $in: req.user.assignedHouseholds };
  } else if (asha) {
    filter.asha = asha;
  }

  // Enforce Patient privacy scope: patients see only themselves
  if (req.user?.role === 'patient' && req.user.patientId) {
    filter._id = req.user.patientId;
  }

  if (risk) filter.riskCategory = risk;
  if (q) {
    const cleanQ = sanitizeRegex(q);
    filter.$or = [{ name: { $regex: cleanQ, $options: 'i' } }, { abhaId: { $regex: cleanQ, $options: 'i' } }];
  }
  const data = await Patient.find(filter).sort({ riskCategory: 1, lastSeen: -1 }).limit(100);
  res.json({ data });
}));

app.get('/api/patients/:id', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const found = inMemPatients.find(p => p._id === req.params.id || p.name === req.params.id || p.abhaId === req.params.id);
    return found ? res.json({ data: found }) : res.status(404).json({ error: 'Patient not found' });
  }
  const p = await Patient.findById(req.params.id).catch(() => null);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json({ data: p });
}));

app.post('/api/patients', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const newPat = {
      _id: `pat-${Date.now()}`,
      abhaId: req.body.abhaId || `ABHA-2026-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      name: req.body.name || 'New Patient',
      age: req.body.age || 30,
      gender: req.body.gender || 'F',
      village: req.body.village || 'Inavolu',
      phone: req.body.phone || '9848011223',
      rationCardCategory: req.body.rationCardCategory || 'BPL',
      riskCategory: req.body.riskCategory || 'moderate',
      conditions: Array.isArray(req.body.conditions) ? req.body.conditions : (req.body.conditions ? [req.body.conditions] : []),
      ...req.body
    };
    inMemPatients.unshift(newPat);
    broadcast('patient-new', { id: newPat._id, name: newPat.name });
    return res.status(201).json({ data: newPat });
  }
  const p = await Patient.create(req.body);
  audit('PATIENT_CREATED', 'Patient', p._id, req.body.createdBy || req.user?.name || 'CHW', req.body.role || req.user?.role || 'asha', {}, req);
  broadcast('patient-new', { id: p._id, name: p.name });
  res.status(201).json({ data: p });
}));

app.patch('/api/patients/:id', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const idx = inMemPatients.findIndex(p => p._id === req.params.id || p.name === req.params.id);
    if (idx !== -1) {
      inMemPatients[idx] = { ...inMemPatients[idx], ...req.body };
      return res.json({ data: inMemPatients[idx] });
    }
    return res.json({ data: req.body });
  }
  const p = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ data: p });
}));

// ─── Encounters API ────────────────────────────────────────────────────────────
app.get('/api/encounters', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    let list = [...inMemEncounters];
    const { patientName, patientId, facilityId, status } = req.query;
    if (patientName) {
      list = list.filter(e => e.patientName?.toLowerCase().includes(patientName.toLowerCase()) || e.chiefComplaint?.toLowerCase().includes(patientName.toLowerCase()));
    }
    if (patientId) {
      list = list.filter(e => e.patientId === patientId);
    }
    if (facilityId) {
      list = list.filter(e => e.facilityId === facilityId);
    }
    if (status) {
      list = list.filter(e => e.status === status);
    }
    return res.json({ data: list });
  }
  const { patientId, patientName, abhaId, facilityId, status } = req.query;
  const filter = {};
  if (patientId) filter.patientId = patientId;
  if (facilityId) filter.facilityId = facilityId;
  if (status) filter.status = status;
  if (abhaId) filter.abhaId = abhaId;
  
  if (patientName && !patientId) {
    const patientDoc = await Patient.findOne({ name: new RegExp(patientName.trim(), 'i') });
    if (patientDoc) {
      filter.$or = [{ patientId: patientDoc._id }, { abhaId: patientDoc.abhaId }];
    }
  }

  const data = await Encounter.find(filter).sort({ conductedAt: -1 }).populate('patientId', 'name abhaId').limit(100);
  res.json({ data });
}));

app.post('/api/encounters', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const newEnc = {
      _id: `enc-${Date.now()}`,
      conductedAt: new Date(),
      status: 'waiting',
      ...req.body
    };
    inMemEncounters.unshift(newEnc);
    broadcast('encounter-new', { encounterId: newEnc._id, facilityId: newEnc.facilityId, token: newEnc.token });
    return res.status(201).json({ data: newEnc });
  }
  const e = await Encounter.create(req.body);
  broadcast('encounter-new', { encounterId: e._id, facilityId: e.facilityId, token: e.token });
  audit('ENCOUNTER_RECORDED', 'Encounter', e._id, req.user?.name || req.body.conductedBy || 'Doctor', req.user?.role || 'phc_doctor', {}, req);
  res.status(201).json({ data: e });
}));

app.patch('/api/encounters/:id', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const idx = inMemEncounters.findIndex(e => e._id === req.params.id);
    if (idx !== -1) {
      inMemEncounters[idx] = { ...inMemEncounters[idx], ...req.body };
      return res.json({ data: inMemEncounters[idx] });
    }
    return res.json({ data: req.body });
  }
  const e = await Encounter.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!e) return res.status(404).json({ error: 'Not found' });
  res.json({ data: e });
}));

// ─── Referrals API ────────────────────────────────────────────────────────────
app.get('/api/referrals', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemReferrals });
  const { toFacilityId, fromFacilityId, stage, urgency } = req.query;
  const filter = {};
  if (toFacilityId) filter.toFacilityId = toFacilityId;
  if (fromFacilityId) filter.fromFacilityId = fromFacilityId;
  if (stage) filter.currentStage = stage;
  if (urgency) filter.urgency = urgency;
  const data = await Referral.find(filter).sort({ updatedAt: -1 }).populate('patientId', 'name abhaId age gender phone').limit(100);
  res.json({ data });
}));

app.post('/api/referrals', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const newRef = {
      _id: `ref-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStage: req.body.currentStage || 'initiated',
      stageHistory: [{ stage: 'initiated', timestamp: new Date(), notes: req.body.reason || 'Referral created' }],
      ...req.body
    };
    inMemReferrals.unshift(newRef);
    broadcast('referral-new', { referralId: newRef._id, to: newRef.toFacilityId, urgency: newRef.urgency });
    return res.status(201).json({ data: newRef });
  }
  const r = await Referral.create(req.body);
  audit('REFERRAL_CREATED', 'Referral', r._id, req.body.initiatedBy || req.user?.name || 'CHW', req.body.role || req.user?.role || 'asha', {}, req);
  broadcast('referral-new', { referralId: r._id, to: r.toFacilityId, urgency: r.urgency });
  res.status(201).json({ data: r });
}));

app.patch('/api/referrals/:id/stage', optionalAuth, asyncHandler(async (req, res) => {
  const { stage, updatedBy, role, notes, ambulanceNumber, driverPhone } = req.body;
  if (!dbOk()) {
    const found = inMemReferrals.find(r => r._id === req.params.id);
    if (found) {
      found.currentStage = stage;
      found.stageHistory = found.stageHistory || [];
      found.stageHistory.push({ stage, updatedBy: updatedBy || 'Clinician', role: role || 'doctor', notes, timestamp: new Date() });
      if (ambulanceNumber) found.ambulanceNumber = ambulanceNumber;
      if (driverPhone) found.driverPhone = driverPhone;
      broadcast('referral-stage', { referralId: found._id, stage, patientId: found.patientId });
      return res.json({ data: found });
    }
    return res.json({ data: { _id: req.params.id, currentStage: stage } });
  }
  const r = await Referral.findById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  r.currentStage = stage;
  r.stageHistory.push({ stage, updatedBy: updatedBy || req.user?.name, role: role || req.user?.role, notes, timestamp: new Date() });
  if (ambulanceNumber) r.ambulanceNumber = ambulanceNumber;
  if (driverPhone) r.driverPhone = driverPhone;
  if (stage === 'follow_up_due') r.closedAt = new Date();
  await r.save();
  audit('REFERRAL_STAGE_UPDATED', 'Referral', r._id, updatedBy || req.user?.name, role || req.user?.role, { stage, notes }, req);
  broadcast('referral-stage', { referralId: r._id, stage, patientId: r.patientId });
  res.json({ data: r });
}));

// ─── Longitudinal Records (Observations, Conditions, Consents, CarePlans, Orders) ──
app.get('/api/patients/:patientId/observations', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemObservations.filter(o => o.patientId === req.params.patientId) });
  const data = await Observation.find({ patientId: req.params.patientId }).sort({ recordedAt: -1 }).limit(100);
  res.json({ data });
}));

app.post('/api/patients/:patientId/observations', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const doc = { _id: `obs-${Date.now()}`, ...req.body, patientId: req.params.patientId, recordedAt: new Date() };
    inMemObservations.unshift(doc);
    return res.status(201).json({ data: doc });
  }
  const doc = await Observation.create({ ...req.body, patientId: req.params.patientId });
  res.status(201).json({ data: doc });
}));

app.get('/api/patients/:patientId/conditions', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemConditions.filter(c => c.patientId === req.params.patientId) });
  const data = await Condition.find({ patientId: req.params.patientId }).sort({ recordedDate: -1 });
  res.json({ data });
}));

app.post('/api/patients/:patientId/conditions', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const doc = { _id: `cond-${Date.now()}`, ...req.body, patientId: req.params.patientId, recordedDate: new Date() };
    inMemConditions.unshift(doc);
    return res.status(201).json({ data: doc });
  }
  const doc = await Condition.create({ ...req.body, patientId: req.params.patientId });
  res.status(201).json({ data: doc });
}));

app.get('/api/patients/:patientId/consents', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemConsents.filter(c => c.patientId === req.params.patientId) });
  const data = await Consent.find({ patientId: req.params.patientId, status: 'active' });
  res.json({ data });
}));

app.post('/api/patients/:patientId/consents', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const doc = { _id: `cons-${Date.now()}`, ...req.body, patientId: req.params.patientId, status: 'active' };
    inMemConsents.unshift(doc);
    return res.status(201).json({ data: doc });
  }
  const doc = await Consent.create({ ...req.body, patientId: req.params.patientId });
  res.status(201).json({ data: doc });
}));

app.get('/api/patients/:patientId/care-plans', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: inMemCarePlans.filter(c => c.patientId === req.params.patientId) });
  const data = await CarePlan.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
  res.json({ data });
}));

app.get('/api/patients/:patientId/prescriptions', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const found = inMemPrescriptions.filter(p => !req.params.patientId || p.patientId === req.params.patientId);
    return res.json({ data: found });
  }
  const data = await MedicationRequest.find({ patientId: req.params.patientId }).sort({ authoredOn: -1 });
  res.json({ data });
}));

app.post('/api/prescriptions', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const doc = {
      _id: `rx-${Date.now()}`,
      authoredOn: new Date(),
      status: 'active',
      intent: 'order',
      prescribedBy: req.user?.name || req.body.prescribedBy || 'Attending Physician',
      ...req.body
    };
    inMemPrescriptions.unshift(doc);
    return res.status(201).json({ data: doc, message: 'Prescription recorded successfully.' });
  }
  const doc = await MedicationRequest.create(req.body);
  audit('PRESCRIPTION_CREATED', 'MedicationRequest', doc._id, req.user?.name || req.body.prescribedBy, req.user?.role || 'phc_doctor', {}, req);
  res.status(201).json({ data: doc, message: 'Prescription recorded successfully.' });
}));

// ─── Facilities & Live Capacity Snapshots ─────────────────────────────────────
app.get('/api/facilities', asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: FACILITIES });
  const data = await Facility.find({}).sort({ level: 1 });
  res.json({ data: data.length ? data : FACILITIES });
}));

app.get('/api/facilities/:id', asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const f = FACILITIES.find(x => x.facilityId === req.params.id);
    return f ? res.json({ data: f }) : res.status(404).json({ error: 'Not found' });
  }
  const f = await Facility.findOne({ facilityId: req.params.id });
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json({ data: f });
}));

app.post('/api/facilities/:id/capacity-snapshot', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) {
    const fac = FACILITIES.find(f => f.facilityId === req.params.id);
    if (fac && fac.resources) {
      if (req.body.bedsTotal !== undefined) fac.resources.bedsTotal = req.body.bedsTotal;
      if (req.body.bedsOccupied !== undefined) fac.resources.bedsOccupied = req.body.bedsOccupied;
      if (req.body.icuTotal !== undefined) fac.resources.icuTotal = req.body.icuTotal;
      if (req.body.icuOccupied !== undefined) fac.resources.icuOccupied = req.body.icuOccupied;
    }
    return res.status(201).json({ data: req.body });
  }
  const snapshot = await DailyFacilityCapacitySnapshot.create({
    ...req.body,
    facilityId: req.params.id,
    recordedBy: req.user?.name || req.body.recordedBy || 'Hospital Admin',
    recordedRole: req.user?.role || 'hospital_admin'
  });
  // Update facility resources
  await Facility.findOneAndUpdate(
    { facilityId: req.params.id },
    {
      'resources.bedsTotal': snapshot.bedsTotal,
      'resources.bedsOccupied': snapshot.bedsOccupied,
      'resources.icuTotal': snapshot.icuTotal,
      'resources.icuOccupied': snapshot.icuOccupied,
      'resources.oxygenBeds': snapshot.oxygenBeds,
      'resources.oxygenOccupied': snapshot.oxygenOccupied
    }
  );
  broadcast('capacity-snapshot-updated', { facilityId: req.params.id, snapshot });
  res.status(201).json({ data: snapshot });
}));

// ─── Clinician-Governed Decision Support & Capacity Matching ──────────────────
app.post('/api/ai/clinical-assessments', triageLimiter, asyncHandler(async (req, res) => {
  const {
    patientId, symptoms = [], symptomNarrative = '', vitals = {}, latitude, longitude,
    source = 'patient', capturedBy = {}, encounterId, referralId, language = 'en', consent = {}
  } = req.body;
  if (!patientId || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'patientId and symptoms[] are required' });
  }
  if (!dbOk()) {
    const decision = buildClinicalDecision({ symptoms, symptomNarrative, vitals, patient: { name: 'Savita Patil', age: 28, gender: 'F' } });
    const mockAssessment = {
      _id: `assess-${Date.now()}`,
      patientId,
      source,
      language,
      symptoms,
      vitals,
      ai: {
        provider: 'ArogyaLink CDSS / WHO-IMCI-IMAI Rules Engine',
        summary: decision.summary || 'Clinical assessment recorded.',
        urgency: decision.urgency,
        redFlags: decision.redFlags,
        suggestedDepartment: decision.department,
        recommendedFacilityLevel: decision.level
      },
      recommendations: decision.recommendations,
      createdAt: new Date()
    };
    inMemAssessments.unshift(mockAssessment);
    return res.status(201).json({ data: mockAssessment });
  }

  const patient = await Patient.findById(patientId).lean();
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const decision = buildClinicalDecision({ symptoms, symptomNarrative, vitals, patient });
  const facilities = await Facility.find({}).lean();
  const recentSnapshots = await DailyFacilityCapacitySnapshot.find({
    recordedAt: { $gte: new Date(Date.now() - 6 * 3600 * 1000) }
  }).lean();

  const lat = Number(latitude), lng = Number(longitude);
  const facilityMatches = matchFacilities(facilities, decision, lat, lng, recentSnapshots);

  const assessment = await ClinicalAssessment.create({
    patientId, encounterId, referralId, source, capturedBy, language, symptoms, symptomNarrative,
    vitals: { ...vitals, recordedAt: vitals.recordedAt || new Date() },
    ai: {
      provider: 'ArogyaLink CDSS / WHO-IMCI-IMAI Rules Engine',
      version: decision.ruleVersion || '2.1.0',
      summary: decision.summary || 'Recorded for medical officer assessment.',
      urgency: decision.urgency,
      urgencyReason: decision.redFlags.length ? decision.redFlags.join('; ') : 'No emergency red flags detected.',
      redFlags: decision.redFlags,
      suggestedDepartment: decision.department,
      recommendedFacilityLevel: decision.level,
      confidence: decision.confidence,
      requiresClinicianReview: decision.requiresClinicianReview
    },
    recommendations: decision.recommendations,
    facilityMatches,
    selectedFacilityId: facilityMatches[0]?.facilityId,
    consent: { decisionSupportAcceptedAt: consent.decisionSupportAcceptedAt || new Date(), capturedBy: consent.capturedBy || capturedBy.name }
  });

  await Patient.findByIdAndUpdate(patientId, { lastSeen: new Date(), latestVitals: vitals });
  audit('CLINICAL_ASSESSMENT_CREATED', 'ClinicalAssessment', assessment._id, capturedBy.name || 'system', capturedBy.role || source, { urgency: decision.urgency }, req);
  broadcast('clinical-assessment-created', { assessmentId: assessment._id, patientId, urgency: decision.urgency });
  res.status(201).json({ data: assessment });
}));

app.get('/api/patients/:patientId/clinical-assessments', asyncHandler(async (req, res) => {
  if (!dbOk()) {
    return res.json({ data: inMemAssessments.filter(a => a.patientId === req.params.patientId) });
  }
  const data = await ClinicalAssessment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 }).limit(100);
  res.json({ data });
}));

// ─── Stock & Followups ────────────────────────────────────────────────────────
app.get('/api/stock', asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: STOCK_DATA });
  const { facilityId, status } = req.query;
  const filter = {};
  if (facilityId) filter.facilityId = facilityId;
  if (status) filter.status = status;
  const data = await Stock.find(filter).sort({ status: -1 });
  res.json({ data: data.length ? data : STOCK_DATA });
}));

app.get('/api/followups', asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: FOLLOWUPS });
  const { ashaWorker, completed } = req.query;
  const filter = {};
  if (ashaWorker) filter.ashaWorker = ashaWorker;
  if (completed !== undefined) filter.completed = completed === 'true';
  const data = await Followup.find(filter).sort({ dueDate: 1 }).populate('patientId', 'name abhaId village phone conditions');
  res.json({ data });
}));

// ─── Haversine Distance & Priority Engine ─────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

app.get('/api/distance', asyncHandler(async (req, res) => {
  const { lat, lng, level, district, specialty, urgency } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const filter = {};
  if (level) filter.level = level;
  if (district) filter.district = new RegExp(district, 'i');

  const facilities = dbOk() ? await Facility.find(filter).lean() : FACILITIES;
  const userLat = Number(lat);
  const userLng = Number(lng);

  const results = facilities.filter(f => f.lat && f.lng).map(f => {
    const distKm = haversineKm(userLat, userLng, f.lat, f.lng);
    const travelMin = Math.round(distKm * 2.8 + 5);
    const bedsTotal = f.beds ?? f.resources?.bedsTotal ?? (f.level === 'district_hospital' ? 250 : f.level === 'rural_hospital' ? 50 : 24);
    const bedsOccupied = f.resources?.bedsOccupied ?? Math.round(bedsTotal * 0.6);
    const avail = Math.max(2, bedsTotal - bedsOccupied);
    const icuTotal = f.icuBeds ?? f.resources?.icuTotal ?? (f.level === 'district_hospital' ? 16 : f.level === 'rural_hospital' ? 4 : 2);
    const icuOccupied = f.resources?.icuOccupied ?? Math.round(icuTotal * 0.5);
    const icuAvail = Math.max(1, icuTotal - icuOccupied);
    const rawSpecialists = (f.specialistsAvailableToday || (f.doctors || []).filter(d => d.availableToday).map(d => d.specialty || d.name));
    const specialistsAvailable = Math.max(1, rawSpecialists.length || (f.level === 'district_hospital' ? 8 : f.level === 'rural_hospital' ? 4 : 2));

    let score = Math.round(100 - (distKm * 1.2) + (avail > 0 ? 10 : 0) + (f.isEmergencyCapable || f.emergencyOpen24h ? 10 : 0) + (specialistsAvailable * 4));
    if (specialty && (f.specialties || f.departments || []).some(s => s.toLowerCase().includes(String(specialty).toLowerCase()))) {
      score += 15;
    }

    return {
      facilityId: f.facilityId,
      name: f.name,
      nameTelugu: f.nameTelugu || f.name,
      nameKannada: f.nameKannada || f.name,
      nameMarathi: f.nameMarathi || f.name,
      nameHindi: f.nameHindi || f.name,
      type: f.type || (f.level === 'district_hospital' ? 'Tertiary / District Hospital' : f.level === 'phc' ? 'Primary Health Centre' : 'Healthcare Facility'),
      level: f.level || 'phc',
      district: f.district || 'Andhra Pradesh',
      city: f.city || f.district || '',
      state: f.state || 'Andhra Pradesh',
      phone: f.phone || '0863-2370000',
      address: f.address || '',
      lat: f.lat,
      lng: f.lng,
      distKm: Math.round(distKm * 10) / 10,
      travelMin,
      emergencyOpen24h: Boolean(f.emergencyOpen24h || f.isEmergencyCapable),
      isEmergencyCapable: Boolean(f.isEmergencyCapable || f.emergencyOpen24h),
      bedsAvailable: avail,
      bedsTotal,
      icuAvailable: icuAvail,
      icuBeds: icuTotal,
      oxygenAvailable: Boolean(f.oxygenAvailable || f.resources?.oxygenBeds || true),
      specialties: f.specialties || f.departments || ['General Medicine'],
      specialistsAvailableToday: rawSpecialists.length ? rawSpecialists : ['General Physician', 'Medical Officer'],
      currentOPLoad: f.currentOPLoad || (f.currentOpdQueue?.queueLength > 15 ? 'High' : 'Medium'),
      empanelledSchemes: f.empanelledSchemes || ['Ayushman Bharat', 'Dr. NTR Vaidya Seva'],
      specialistsAvailable,
      matchScore: Math.min(99, Math.max(15, score))
    };
  }).sort((a, b) => a.distKm - b.distKm);

  res.json({ data: results });
}));

// ─── Equipment Knowledge Base for DSA Matching ─────────────────────────────────
const SYMPTOM_EQUIPMENT_MAP = {
  fever: {
    equipment: ['Semi-Auto Blood Glucose Analyzer', 'Rapid Antigen / Dengue / Typhoid Kits', 'Multi-Parameter Vital Signs Monitor'],
    dept: 'General OPD',
    specialty: 'General Medicine',
    medicines: [
      { medicineName: 'Paracetamol Tab 500mg (IP)', dosage: '1 tab TID after meals for 3 days', quantity: 10, instructions: 'Take for fever > 38°C' },
      { medicineName: 'Oral Rehydration Salts (ORS) Sachet 21.8g', dosage: '1 sachet in 1L clean water', quantity: 2, instructions: 'Drink plenty of fluids' },
      { medicineName: 'Vitamin C 500mg + Zinc Tab', dosage: '1 tab once daily', quantity: 5, instructions: 'Immune support' }
    ]
  },
  headache: {
    equipment: ['Automated BP Monitor', 'Multi-Parameter Vital Signs Monitor'],
    dept: 'General OPD',
    specialty: 'General Medicine',
    medicines: [
      { medicineName: 'Paracetamol Tab 500mg (IP)', dosage: '1 tab SOS when headache occurs', quantity: 6, instructions: 'Rest in a quiet, dark room' }
    ]
  },
  cough: {
    equipment: ['Pulse Oximetry & BP', 'High-Flow Oxygen Cylinders & Nebulizers', 'Nebulization & Oxygen Station'],
    dept: 'Chest & Respiratory OPD',
    specialty: 'Pulmonology',
    medicines: [
      { medicineName: 'Cetirizine Tab 10mg', dosage: '1 tab at bedtime', quantity: 5, instructions: 'May cause drowsiness' },
      { medicineName: 'Dextromethorphan Cough Syrup 100ml', dosage: '10ml TID with warm water', quantity: 1, instructions: 'Shake well before use' }
    ]
  },
  bodyache: {
    equipment: ['Multi-Parameter Vital Signs Monitor'],
    dept: 'General OPD',
    specialty: 'General Medicine',
    medicines: [
      { medicineName: 'Paracetamol 500mg + Ibuprofen 400mg', dosage: '1 tab twice daily after food', quantity: 6, instructions: 'Avoid on empty stomach' },
      { medicineName: 'Vitamin B-Complex with B12 Tab', dosage: '1 tab once daily', quantity: 10, instructions: 'General wellness' }
    ]
  },
  diarrhoea: {
    equipment: ['Semi-Auto Blood Glucose Analyzer', 'IV Infusion Sets'],
    dept: 'General OPD',
    specialty: 'General Medicine',
    medicines: [
      { medicineName: 'Oral Rehydration Salts (ORS) Sachet 21.8g (WHO formula)', dosage: 'Mix 1 pack in 1L boiled and cooled water', quantity: 4, instructions: 'Sip continuously after every loose stool' },
      { medicineName: 'Zinc Sulphate Tab 20mg', dosage: '1 tab once daily for 14 days', quantity: 14, instructions: 'Prevents gut dehydration' }
    ]
  },
  chest_pain: {
    equipment: ['12-Lead Digital ECG Machine', 'High-Flow Oxygen Cylinders & Nebulizers', 'Automated External Defibrillator (AED)', 'Multi-Parameter Vital Signs Monitor'],
    dept: 'Cardiology & Emergency Bay',
    specialty: 'Cardiology',
    medicines: []
  },
  difficulty_breathing: {
    equipment: ['High-Flow Oxygen Cylinders & Nebulizers', 'Pulse Oximetry & BP', 'Mechanical Ventilator', 'Nebulization & Oxygen Station'],
    dept: 'Pulmonology / Emergency',
    specialty: 'Pulmonology',
    medicines: []
  },
  routine_anc: {
    equipment: ['Fetal Doppler & Ultrasound', 'Automated BP Monitor', 'Urine Protein Dipstick Analyzer', 'Semi-Auto Blood Glucose Analyzer'],
    dept: 'Obstetrics & Gynaecology (ANC)',
    specialty: 'Obstetrics & Gynaecology',
    medicines: [
      { medicineName: 'Iron & Folic Acid Tab (IFA Large)', dosage: '1 tab daily after meals', quantity: 30, instructions: 'Do not take with tea/coffee' },
      { medicineName: 'Calcium Carbonate 500mg + Vit D3 Tab', dosage: '1 tab daily after lunch', quantity: 30, instructions: 'For bone and fetal development' }
    ]
  }
};

// ─── Hospital Prioritization with DSA Equipment Match ─────────────────────────
app.get('/api/opd/hospitals/prioritize', asyncHandler(async (req, res) => {
  const { lat, lng, symptoms = '' } = req.query;
  const userLat = Number(lat) || 16.4971; // Default Amaravati/Vijayawada
  const userLng = Number(lng) || 80.5003;
  const rawSymptoms = String(symptoms).toLowerCase();
  const symptomList = rawSymptoms.split(',').map(s => s.trim()).filter(Boolean);

  // Extract all required equipment for symptoms with multilingual keyword mapping
  const requiredEquipmentSet = new Set();
  let recommendedDept = 'General OPD';
  let recommendedSpecialty = 'General Medicine';

  const checkMatch = (sx, key) => {
    if (sx.includes(key) || key.includes(sx)) return true;
    if (key === 'fever' && (sx.includes('ताप') || sx.includes('बुखार') || sx.includes('జ్వరం') || sx.includes('ಜ್ವರ'))) return true;
    if (key === 'headache' && (sx.includes('डोकेदुखी') || sx.includes('सिरदर्द') || sx.includes('తలనొప్పి') || sx.includes('ತಲೆನೋವು'))) return true;
    if (key === 'cough' && (sx.includes('खोकला') || sx.includes('खांसी') || sx.includes('దగ్గు') || sx.includes('కెమ్ము') || sx.includes('cold') || sx.includes('సర్ది') || sx.includes('జలుబు'))) return true;
    if (key === 'chest_pain' && (sx.includes('छातीत') || sx.includes('सीने') || sx.includes('గుండె') || sx.includes('ఛాతీ') || sx.includes('cardiac') || sx.includes('chest'))) return true;
    if (key === 'difficulty_breathing' && (sx.includes('श्वास') || sx.includes('सांस') || sx.includes('శ్వాస') || sx.includes('breath'))) return true;
    if (key === 'routine_anc' && (sx.includes('गरोदर') || sx.includes('प्रसव') || sx.includes('గర్భ') || sx.includes('anc') || sx.includes('pregnan'))) return true;
    if (key === 'bodyache' && (sx.includes('अंगदुखी') || sx.includes('बदन') || sx.includes('నొప్పులు') || sx.includes('fatigue') || sx.includes('tired'))) return true;
    if (key === 'diarrhoea' && (sx.includes('जुलाब') || sx.includes('दस्त') || sx.includes('విరేచనాలు') || sx.includes('vomit') || sx.includes('వాంతి'))) return true;
    return false;
  };

  for (const sx of symptomList) {
    for (const [key, mapping] of Object.entries(SYMPTOM_EQUIPMENT_MAP)) {
      if (checkMatch(sx, key)) {
        mapping.equipment.forEach(eq => requiredEquipmentSet.add(eq));
        recommendedDept = mapping.dept;
        recommendedSpecialty = mapping.specialty;
      }
    }
  }

  if (requiredEquipmentSet.size === 0) {
    requiredEquipmentSet.add('Automated BP Monitor');
    requiredEquipmentSet.add('Multi-Parameter Vital Signs Monitor');
  }

  const requiredEquipment = Array.from(requiredEquipmentSet);

  let rawFacilities = dbOk() ? await Facility.find({}).lean() : [];
  if (!rawFacilities || rawFacilities.length === 0) {
    rawFacilities = FACILITIES;
  } else {
    // Merge in-memory facilities to guarantee high-detail local facilities exist
    const map = new Map(rawFacilities.map(f => [f.facilityId, f]));
    for (const f of FACILITIES) {
      if (!map.has(f.facilityId)) {
        map.set(f.facilityId, f);
      }
    }
    rawFacilities = Array.from(map.values());
  }

  const prioritized = rawFacilities.filter(f => f.lat && f.lng).map(f => {
    const distKm = Math.round(haversineKm(userLat, userLng, f.lat, f.lng) * 10) / 10;
    const travelMin = Math.round(distKm * 2.8 + 4);
    const qLen = f.currentOpdQueue?.queueLength || (f.level === 'district_hospital' ? 18 : f.level === 'rural_hospital' ? 8 : 4);
    const counters = Math.max(1, f.currentOpdQueue?.activeCounters || (f.level === 'district_hospital' ? 4 : 2));
    const avgServiceTime = f.currentOpdQueue?.avgServiceTimeMin || 6;

    // M/M/c Queueing Theory dynamic wait time estimation
    const estimatedWaitMinutes = Math.max(5, Math.round((qLen * avgServiceTime) / counters));

    const bedsTotal = f.beds ?? f.resources?.bedsTotal ?? (f.level === 'district_hospital' ? 250 : f.level === 'rural_hospital' ? 50 : 24);
    const bedsOccupied = f.resources?.bedsOccupied ?? Math.round(bedsTotal * 0.6);
    const bedsAvail = Math.max(2, bedsTotal - bedsOccupied);
    const icuTotal = f.icuBeds ?? f.resources?.icuTotal ?? (f.level === 'district_hospital' ? 16 : f.level === 'rural_hospital' ? 4 : 2);
    const icuOccupied = f.resources?.icuOccupied ?? Math.round(icuTotal * 0.5);
    const icuAvail = Math.max(1, icuTotal - icuOccupied);

    // Equipment Match
    const facilityEquipment = (f.equipment || []).map(e => String(e).toLowerCase());
    const matchedEquipment = requiredEquipment.filter(reqEq =>
      facilityEquipment.some(fe => fe.includes(reqEq.toLowerCase()) || reqEq.toLowerCase().includes(fe))
    );
    const missingEquipment = requiredEquipment.filter(reqEq => !matchedEquipment.includes(reqEq));
    const equipmentScore = Math.round((matchedEquipment.length / requiredEquipment.length) * 100);

    // Doctors available today
    const availableDoctors = (f.doctors || []).filter(d => d.availableToday !== false).map(d => ({
      name: d.name,
      specialty: d.specialty || 'General Medicine',
      nextSlot: d.nextSlot || '10:00 AM'
    }));

    // Multi-criteria Priority Score
    // Weightings: Equipment (35%), Distance (30%), Bed Availability (20%), Wait Time (15%)
    const distScore = Math.max(0, 100 - distKm * 1.5);
    const capScore = bedsAvail > 0 ? 90 : 30;
    const waitScore = Math.max(0, 100 - estimatedWaitMinutes * 1.5);
    const priorityScore = Math.round(equipmentScore * 0.35 + distScore * 0.30 + capScore * 0.20 + waitScore * 0.15);

    return {
      facilityId: f.facilityId,
      name: f.name,
      nameMarathi: f.nameMarathi || f.name,
      nameTelugu: f.nameTelugu || f.name,
      nameKannada: f.nameKannada || f.name,
      nameHindi: f.nameHindi || f.name,
      level: f.level || 'phc',
      type: f.type || 'Healthcare Facility',
      district: f.district || 'Andhra Pradesh',
      city: f.city || f.district || '',
      state: f.state || 'Andhra Pradesh',
      phone: f.phone || '0863-2370000',
      address: f.address || '',
      lat: f.lat,
      lng: f.lng,
      distKm,
      travelMin,
      estimatedWaitMinutes,
      currentQueueLength: qLen,
      activeCounters: counters,
      emergencyOpen24h: Boolean(f.emergencyOpen24h || f.isEmergencyCapable),
      bedsAvailable: bedsAvail,
      bedsTotal,
      icuAvailable: icuAvail,
      icuBeds: icuTotal,
      oxygenAvailable: Boolean(f.oxygenAvailable || f.resources?.oxygenBeds),
      matchedEquipment,
      missingEquipment,
      equipmentScore,
      priorityScore,
      availableDoctors,
      recommendedDepartment: recommendedDept,
      specialties: f.specialties || f.departments || [recommendedSpecialty],
      empanelledSchemes: f.empanelledSchemes || ['Ayushman Bharat', 'Dr. NTR Vaidya Seva']
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  res.json({
    ok: true,
    data: prioritized,
    requiredEquipmentDetected: requiredEquipment,
    recommendedDepartment: recommendedDept
  });
}));

// ─── OP Booking & Queue Management ────────────────────────────────────────────
app.post('/api/opd/book', asyncHandler(async (req, res) => {
  const {
    patientName, abhaId, phone, facilityId, facilityName,
    department, doctorName, symptoms = [], clinicalUrgency = 'routine'
  } = req.body;

  if (!patientName || !facilityId) {
    return res.status(400).json({ error: 'patientName and facilityId are required' });
  }

  // Find or create patient record for longitudinal history
  let patientDoc = null;
  if (dbOk()) {
    patientDoc = await Patient.findOne({ $or: [{ abhaId: abhaId || '' }, { phone: phone || '' }, { name: patientName }] });
    if (!patientDoc) {
      patientDoc = await Patient.create({
        name: patientName,
        abhaId: abhaId || `ABHA-2026-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        phone: phone || '9848011223',
        gender: 'F',
        age: 28,
        village: 'Inavolu Village',
        district: 'Guntur',
        state: 'Andhra Pradesh',
        riskCategory: clinicalUrgency === 'emergency' ? 'high' : clinicalUrgency === 'urgent' ? 'moderate' : 'low'
      });
    }
  }

  // Calculate dynamic queue position and M/M/c multi-server wait time
  const facility = dbOk() ? await Facility.findOne({ facilityId }).lean() : FACILITIES.find(f => f.facilityId === facilityId);
  const activeCounters = Math.max(1, facility?.currentOpdQueue?.activeCounters || (facility?.level === 'district_hospital' ? 4 : 2));
  const avgServiceTime = facility?.currentOpdQueue?.avgServiceTimeMin || 6;
  const currentCount = dbOk() ? await OPBooking.countDocuments({ facilityId, status: 'confirmed' }) : (facility?.currentOpdQueue?.queueLength || 4);
  const queuePosition = currentCount + 1;
  const waitTimeMin = Math.max(5, Math.round((queuePosition * avgServiceTime) / activeCounters));
  const tokenNumber = `OPD-${facilityId.slice(0, 3).toUpperCase()}-${String(queuePosition).padStart(3, '0')}`;
  const bookingId = `OP-AP-${Date.now().toString().slice(-6)}`;

  const newBooking = {
    bookingId,
    tokenNumber,
    patientId: patientDoc?._id || `pat-${Date.now()}`,
    patientName,
    abhaId: patientDoc?.abhaId || abhaId || 'ABHA-2026-CITIZEN',
    phone: phone || patientDoc?.phone || '9848011223',
    facilityId,
    facilityName: facilityName || facility?.name || 'Health Facility',
    department: department || 'General OPD',
    doctorName: doctorName || 'Attending Medical Officer',
    bookingDate: new Date(),
    slotTime: new Date(Date.now() + waitTimeMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    queuePosition,
    estimatedWaitMinutes: waitTimeMin,
    clinicalUrgency,
    symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
    status: 'confirmed',
    consultationFee: 0
  };

  const doc = dbOk() ? await OPBooking.create(newBooking) : newBooking;

  // Mirror to in-memory store
  INITIAL_OP_BOOKINGS.unshift(newBooking);
  const inMemFac = FACILITIES.find(f => f.facilityId === facilityId);
  if (inMemFac && inMemFac.currentOpdQueue) {
    inMemFac.currentOpdQueue.queueLength = (inMemFac.currentOpdQueue.queueLength || 0) + 1;
  }

  // ── Longitudinal Integration: Write Encounter to Patient History ─────────────
  const encData = {
    patientId: patientDoc?._id,
    abhaId: patientDoc?.abhaId || abhaId || 'ABHA-2026-CITIZEN',
    facilityId,
    facilityName: facilityName || facility?.name || 'Health Facility',
    department: department || 'General OPD',
    type: clinicalUrgency === 'emergency' ? 'Emergency' : 'OPD',
    status: 'waiting',
    token: tokenNumber,
    chiefComplaint: Array.isArray(symptoms) ? symptoms.join(', ') : String(symptoms || 'Outpatient Consultation'),
    conductedAt: new Date(),
    doctorName: doctorName || 'Medical Officer',
    priority: clinicalUrgency === 'emergency' ? 'emergency' : 'routine',
    _synthetic: true
  };

  if (dbOk()) {
    await Encounter.create(encData).catch(() => {});
    await Facility.findOneAndUpdate(
      { facilityId },
      { $inc: { 'currentOpdQueue.queueLength': 1 } }
    ).catch(() => {});

    if (clinicalUrgency === 'emergency' || clinicalUrgency === 'urgent') {
      await Followup.create({
        patientId: patientDoc?._id,
        patientName: patientName,
        type: 'OPD_Urgent_Escalation',
        dueDate: new Date(),
        reason: `Urgent OP booking created at ${facilityName} for ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}`,
        assignedAshaName: 'Rekha Patil / Field Worker',
        completed: false
      }).catch(() => {});
    }
  } else {
    inMemEncounters.unshift({ ...encData, _id: `enc-${Date.now()}` });
    ENCOUNTERS_SAVITA.unshift({ ...encData, _id: `enc-${Date.now()}` });
  }

  broadcast('opd-token-booked', doc);
  broadcast('encounter-new', encData);
  broadcast('queue-updated', { facilityId, queuePosition, waitTimeMin });

  res.status(201).json({
    ok: true,
    data: doc,
    message: `OP Token ${tokenNumber} booked successfully. Added to your ABHA health record.`
  });
}));

app.get('/api/opd/bookings', asyncHandler(async (req, res) => {
  const { patientName, phone, facilityId } = req.query;
  const filter = {};
  if (patientName) filter.patientName = new RegExp(patientName, 'i');
  if (phone) filter.phone = phone;
  if (facilityId) filter.facilityId = facilityId;

  let bookings = dbOk()
    ? await OPBooking.find(filter).sort({ createdAt: -1 }).limit(50)
    : [...INITIAL_OP_BOOKINGS];

  if (!dbOk()) {
    if (patientName) {
      bookings = bookings.filter(b => b.patientName?.toLowerCase().includes(patientName.toLowerCase()));
    }
    if (facilityId) {
      bookings = bookings.filter(b => b.facilityId === facilityId);
    }
  }

  res.json({ data: bookings });
}));

// Live Queue Status
app.get('/api/opd/queue/:facilityId', asyncHandler(async (req, res) => {
  const { facilityId } = req.params;
  const facility = dbOk() ? await Facility.findOne({ facilityId }).lean() : FACILITIES.find(f => f.facilityId === facilityId);
  const queueCount = dbOk() ? await OPBooking.countDocuments({ facilityId, status: 'confirmed' }) : 4;
  const activeCounters = facility?.currentOpdQueue?.activeCounters || 2;
  const avgServiceTime = facility?.currentOpdQueue?.avgServiceTimeMin || 6;
  const currentWait = Math.max(5, Math.round((queueCount * avgServiceTime) / activeCounters));

  res.json({
    facilityId,
    facilityName: facility?.name || 'Health Facility',
    activeCounters,
    totalWaiting: queueCount,
    estimatedWaitMinutes: currentWait,
    currentlyServingToken: `OPD-${facilityId.slice(0, 3).toUpperCase()}-001`,
    avgServiceTimeMin: avgServiceTime
  });
}));

// ─── Essential Medicine Delivery via ASHA / PHC ───────────────────────────────
app.post('/api/medicines/request-delivery', asyncHandler(async (req, res) => {
  const {
    patientName, patientPhone, abhaId, deliveryAddress,
    village = 'Inavolu Village', district = 'Guntur / Amaravati',
    symptoms = ['Fever'], clinicalUrgency = 'routine', notes
  } = req.body;

  if (!patientName || !patientPhone || !deliveryAddress) {
    return res.status(400).json({ error: 'patientName, patientPhone, and deliveryAddress are required' });
  }

  // Determine standard government medicine kit based on symptoms
  const prescribedMedicines = [];
  const symptomList = Array.isArray(symptoms) ? symptoms : [symptoms];

  for (const sx of symptomList) {
    for (const [key, mapping] of Object.entries(SYMPTOM_EQUIPMENT_MAP)) {
      if (sx.toLowerCase().includes(key) && mapping.medicines) {
        mapping.medicines.forEach(m => {
          if (!prescribedMedicines.some(pm => pm.medicineName === m.medicineName)) {
            prescribedMedicines.push(m);
          }
        });
      }
    }
  }

  // Default standard kit if none matched
  if (prescribedMedicines.length === 0) {
    prescribedMedicines.push(
      { medicineName: 'Paracetamol Tab 500mg (IP)', dosage: '1 tab TID after meals', quantity: 10, instructions: 'For relief of fever / bodyache' },
      { medicineName: 'Oral Rehydration Salts (ORS) Sachet 21.8g', dosage: 'Mix in 1L drinking water', quantity: 2, instructions: 'Hydration support' },
      { medicineName: 'Vitamin B-Complex Tab', dosage: '1 tab once daily', quantity: 10, instructions: 'Nutritional wellness' }
    );
  }

  // Check stock at primary health center
  let dispensingFacilityId = 'VIT-AP-HC-01';
  let dispensingFacilityName = 'VIT-AP Health Centre (Spoke)';
  if (dbOk()) {
    const stockItems = await Stock.find({ status: 'adequate' }).limit(1);
    if (stockItems.length > 0) {
      dispensingFacilityId = stockItems[0].facilityId;
      dispensingFacilityName = stockItems[0].facilityName;
    }
  }

  const requestId = `MED-AP-${Date.now().toString().slice(-6)}`;
  const deliveryRequest = {
    requestId,
    patientName,
    patientPhone,
    abhaId: abhaId || 'ABHA-2026-CITIZEN',
    village,
    district,
    state: 'Andhra Pradesh',
    deliveryAddress,
    symptoms: symptomList,
    clinicalUrgency,
    prescribedMedicines,
    dispensingFacilityId,
    dispensingFacilityName,
    assignedAshaId: 'ASHA-REKHA-01',
    assignedAshaName: 'Lakshmi Devi (ASHA Worker - Inavolu Sector)',
    assignedAshaPhone: '9848011223',
    status: 'requested',
    estimatedDeliveryHours: 3,
    requestedAt: new Date(),
    notes: notes || 'Essential OTC medicine kit dispensation requested via ASHA frontline network.'
  };

  const doc = dbOk() ? await MedicineDeliveryRequest.create(deliveryRequest) : deliveryRequest;

  // Auto-generate ASHA task
  if (dbOk()) {
    await Followup.create({
      patientName,
      type: 'Medicine Delivery',
      dueDate: new Date(Date.now() + 3 * 3600000),
      reason: `Deliver essential medicine kit (${prescribedMedicines.map(m => m.medicineName.split(' ')[0]).join(', ')}) to ${patientName} at ${deliveryAddress}`,
      assignedAshaName: 'Lakshmi Devi (ASHA)',
      completed: false
    }).catch(() => {});
  }

  broadcast('medicine-delivery-requested', doc);

  res.status(201).json({
    ok: true,
    data: doc,
    message: `Medicine delivery request ${requestId} created. ASHA worker assigned for home dispatch.`
  });
}));

app.get('/api/medicines/delivery-requests', asyncHandler(async (req, res) => {
  const { phone, status } = req.query;
  const filter = {};
  if (phone) filter.patientPhone = phone;
  if (status) filter.status = status;

  const data = dbOk()
    ? await MedicineDeliveryRequest.find(filter).sort({ requestedAt: -1 }).limit(50)
    : [];

  res.json({ data });
}));

app.patch('/api/medicines/delivery-requests/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateFields = { status };
  if (status === 'phc_approved') updateFields.approvedAt = new Date();
  if (status === 'dispatched_with_asha') updateFields.dispatchedAt = new Date();
  if (status === 'delivered') updateFields.deliveredAt = new Date();

  const doc = dbOk()
    ? await MedicineDeliveryRequest.findOneAndUpdate({ requestId: id }, updateFields, { new: true })
    : { requestId: id, status };

  broadcast('medicine-delivery-status-changed', doc);
  res.json({ ok: true, data: doc });
}));

// ─── Long-Distance Transport Coordinator ──────────────────────────────────────
app.get('/api/long-distance/overview', asyncHandler(async (req, res) => {
  const [activeDispatches, pendingSamples, mmuCamps] = await Promise.all([
    dbOk() ? TransportDispatch.find({ currentStatus: { $ne: 'completed' } }) : TRANSPORT_DISPATCHES,
    dbOk() ? DiagnosticSample.find({}).sort({ collectedAt: -1 }).limit(10) : DIAGNOSTIC_SAMPLES,
    dbOk() ? MMUCamp.find({ status: { $ne: 'completed' } }).sort({ scheduledDate: 1 }) : MMU_CAMPS
  ]);

  res.json({
    data: {
      activeDispatches,
      pendingSamples,
      mmuCamps,
      globalSolutions: {
        rwandaHubAndSpoke: { title: 'Hub-and-Spoke Sample Collection', activeSamplesInTransit: pendingSamples.filter(s => s.status !== 'report_ready').length },
        chinaGreenChannel: { title: 'Pre-Arrival Green Channel Bed & Token Guarantee' },
        india108Telematics: { title: '108 & Janani Express GPS Emergency Transit', activeVehicles: activeDispatches.length }
      }
    }
  });
}));

app.post('/api/long-distance/transport/book', asyncHandler(async (req, res) => {
  const bookingId = `TR-MH-${Date.now().toString().slice(-6)}`;
  const dispatchData = { ...req.body, bookingId, vehicleNumber: 'MH-04-108-5678', driverPhone: '108', currentStatus: 'dispatched' };
  const doc = dbOk() ? await TransportDispatch.create(dispatchData) : dispatchData;
  broadcast('transport-dispatched', doc);
  res.status(201).json({ data: doc });
}));

// ─── Teleconsult API ──────────────────────────────────────────────────────────
app.post('/api/teleconsult/start', asyncHandler(async (req, res) => {
  const roomId = `TC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const session = { ...req.body, roomId, status: 'waiting', startedAt: new Date().toISOString() };
  broadcast('teleconsult-incoming', session);
  res.json({ data: session });
}));

app.post('/api/teleconsult/end', asyncHandler(async (req, res) => {
  broadcast('teleconsult-ended', req.body);
  res.json({ data: { roomId: req.body.roomId, status: 'ended' } });
}));

// ─── Multilingual Clinical Decision Support / Triage ──────────────────────────
app.post('/api/triage', triageLimiter, asyncHandler(async (req, res) => {
  const {
    symptoms = [], vitals = {}, lang = 'en',
    chiefComplaint, notes, pregnant, age, severity
  } = req.body;

  // ── Existing rules-based CDS (always runs) ─────────────────────────────────
  const decision = buildClinicalDecision({ symptoms, vitals });

  // ── lnkling multilingual enrichment (non-blocking, feature-flagged) ─────────
  const lnklingInput = {
    chiefComplaint: chiefComplaint || symptoms.join(', '),
    notes: notes || vitals ? `BP:${vitals.bp || ''} Temp:${vitals.temp || ''} SpO2:${vitals.spo2 || ''}` : undefined,
    temperature: Number(vitals.temp) || undefined,
    severity: severity ? Number(severity) : undefined,
    pregnant: Boolean(pregnant),
    age: age ? Number(age) : undefined,
    language: ['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en',
  };
  const lnkling = await analyzeSymptoms(lnklingInput);

  // ── Merge — existing fields win, lnkling adds optional enrichment ────────────
  // Urgency: lnkling 'high' → maps to existing 'emergency'/'urgent' when stronger
  const lnklingUrgencyScore = lnkling.urgency === 'high' ? 90 : lnkling.urgency === 'moderate' ? 65 : 30;
  const finalUrgencyScore = Math.max(
    decision.urgency === 'emergency' ? 95 : decision.urgency === 'urgent' ? 75 : 35,
    lnklingUrgencyScore
  );

  // Merge diagnostics (dedup)
  const mergedDiagnostics = [
    ...decision.recommendations.map(r => r.name),
    ...lnkling.suggestedDiagnostics
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Auto-save to patient's longitudinal record in MongoDB or in-memory
  const triageEncounterData = {
    patientId: 'pat-savita',
    abhaId: req.body.abhaId || 'ABHA-AP-2026-00101',
    facilityId: 'PHC-INAVOLU-01',
    facilityName: 'Dr. YSR Village Health Clinic - Inavolu',
    department: lnkling.opDepartment || decision.department || 'General OPD',
    type: decision.urgency === 'emergency' ? 'Emergency' : 'OPD',
    status: 'waiting',
    chiefComplaint: lnklingInput.chiefComplaint || 'Clinical Analyse Assessment',
    conductedAt: new Date(),
    triageResult: {
      urgency: decision.urgency,
      suggestedDept: lnkling.opDepartment || decision.department,
      vitals,
      notes: lnkling.patientMessage || decision.notes,
      ashaChecklist: lnkling.ashaMessage,
      suggestedDiagnostics: mergedDiagnostics
    }
  };

  if (dbOk()) {
    try {
      const pName = req.body.patientName || req.body.context || 'Lakshmi Devi';
      let patientDoc = await Patient.findOne({ $or: [{ name: pName }, { abhaId: req.body.abhaId || '' }] });
      if (!patientDoc) {
        patientDoc = await Patient.create({
          name: pName,
          abhaId: req.body.abhaId || `ABHA-2026-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
          phone: req.body.phone || '9848011223',
          gender: 'F',
          age: Number(age) || 28,
          village: 'Inavolu Village',
          district: 'Guntur',
          state: 'Andhra Pradesh',
          riskCategory: decision.urgency === 'emergency' ? 'high' : decision.urgency === 'urgent' ? 'moderate' : 'low'
        });
      }
      await Encounter.create({
        ...triageEncounterData,
        patientId: patientDoc._id,
        abhaId: patientDoc.abhaId
      });
    } catch (err) {
      console.warn('[triage] Could not persist encounter to MongoDB:', err.message);
    }
  } else {
    inMemEncounters.unshift({ ...triageEncounterData, _id: `enc-${Date.now()}` });
  }

  res.json({
    data: {
      urgency: decision.urgency,
      urgencyScore: finalUrgencyScore,
      department: lnkling.opDepartment || decision.department,
      priority: lnkling.priority || (decision.urgency === 'emergency' ? 'emergency' : 'normal'),
      specialty: lnkling.specialty || decision.specialty || 'General Medicine',
      recommendedAction: decision.recommendedAction || (decision.urgency === 'emergency' ? 'immediate_emergency_transit' : 'phc_primary_care'),
      recommendations: decision.recommendations || [],
      suggestedDiagnostics: mergedDiagnostics,
      reasons: [...(decision.reasons || []), ...(lnkling.reasons || [])].filter((v, i, a) => a.indexOf(v) === i),
      redFlags: decision.redFlags || [],
      vitalWarnings: decision.vitalWarnings || [],
      patientMessage: lnkling.patientMessage,
      ashaMessage: lnkling.ashaMessage,
      disclaimer: lnkling.disclaimer || 'AI clinical decision support — please confirm with on-duty medical officer.',
      model: lnkling.model,
      offline: lnkling.offline ?? false
    }
  });
}));

// ─── AI Health Assistant Conversational Agent (Multilingual CDS) ──────────────
app.post('/api/ai/chat', asyncHandler(async (req, res) => {
  const { message, lang = 'en', role = 'patient', patientName, userLocation } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const reply = await processHealthAssistantQuery({
    message,
    lang,
    role,
    patientName,
    userLocation
  });

  res.json({
    ok: true,
    data: {
      reply,
      language: lang,
      model: 'nvidia/nemotron-3.5-lightning:free + ArogyaLink Clinical CDS'
    }
  });
}));

// ─── NVIDIA Nemotron 3 Ultra Hospital Ranking Engine ──────────────────────────
app.post('/api/ai/rank-facilities', triageLimiter, asyncHandler(async (req, res) => {
  const { triage = {}, userLocation = {}, level, district, limit = 10 } = req.body;
  const userLat = Number(userLocation.lat) || 16.5062; // Default Vijayawada/AP
  const userLng = Number(userLocation.lng) || 80.6480;

  const filter = {};
  if (level) filter.level = level;
  if (district) filter.district = new RegExp(district, 'i');

  const allFacilities = dbOk() ? await Facility.find(filter).lean() : FACILITIES;

  // Calculate Haversine distance and travel estimates for candidates
  const candidatesWithDist = allFacilities.filter(f => f.lat && f.lng).map(f => {
    const distKm = Math.round(haversineKm(userLat, userLng, f.lat, f.lng) * 10) / 10;
    const travelMin = Math.round(distKm * 2.8 + 5);
    const bedsTotal = f.beds ?? f.resources?.bedsTotal ?? 20;
    const bedsOccupied = f.resources?.bedsOccupied ?? Math.round(bedsTotal * 0.6);
    const bedsAvailable = Math.max(0, bedsTotal - bedsOccupied);
    const icuTotal = f.icuBeds ?? f.resources?.icuTotal ?? 2;
    const icuOccupied = f.resources?.icuOccupied ?? Math.round(icuTotal * 0.5);
    const icuAvailable = Math.max(0, icuTotal - icuOccupied);

    return {
      ...f,
      distKm,
      travelMin,
      bedsAvailable,
      bedsTotal,
      icuAvailable,
      icuBeds: icuTotal,
      oxygenAvailable: Boolean(f.oxygenAvailable || f.resources?.oxygenBeds),
      isEmergencyCapable: Boolean(f.isEmergencyCapable || f.emergencyOpen24h)
    };
  }).sort((a, b) => a.distKm - b.distKm).slice(0, 20);

  const rankingResult = await rankFacilitiesWithNemotron({
    triage,
    facilities: candidatesWithDist,
    userLocation: { lat: userLat, lng: userLng, district: userLocation.district || 'Andhra Pradesh' }
  });

  res.json({
    ok: true,
    data: rankingResult.rankedFacilities.slice(0, Number(limit) || 10),
    triageSummary: rankingResult.triageSummary,
    rankingRationale: rankingResult.rankingRationale,
    model: rankingResult.model || 'nvidia/nemotron-3-ultra-550b-a55b:free'
  });
}));

// ─── Location & Automatic Language Detection ──────────────────────────────────
app.post('/api/location/detect-language', asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const userLat = Number(lat);
  const userLng = Number(lng);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.json({
      state: 'Andhra Pradesh',
      district: 'Amaravati / NTR',
      language: 'te',
      languageName: 'Telugu (తెలుగు)'
    });
  }

  // Geofence detection for Indian states:
  // 1. Karnataka: Lat 11.5–18.5, Lng 74.0–78.6
  // 2. Andhra Pradesh & Telangana: Lat 12.5–19.9, Lng 76.5–84.8
  // 3. Maharashtra: Lat 15.6–22.1, Lng 72.6–80.9
  let state = 'Andhra Pradesh';
  let district = 'Vijayawada / NTR';
  let language = 'te';
  let languageName = 'Telugu (తెలుగు)';

  if (userLat >= 11.5 && userLat <= 18.5 && userLng >= 74.0 && userLng <= 78.4) {
    state = 'Karnataka';
    district = 'Bengaluru / Ballari';
    language = 'kn';
    languageName = 'Kannada (ಕನ್ನಡ)';
  } else if (userLat >= 15.6 && userLat <= 22.1 && userLng >= 72.6 && userLng <= 80.5 && userLng < 77.0) {
    state = 'Maharashtra';
    district = 'Palghar / Mumbai';
    language = 'mr';
    languageName = 'Marathi (मराठी)';
  } else if (userLat >= 12.5 && userLat <= 19.9 && userLng >= 76.5 && userLng <= 84.8) {
    state = 'Andhra Pradesh';
    district = userLat > 17 ? 'Visakhapatnam' : userLat > 16 ? 'Amaravati / Vijayawada' : 'Tirupati / Rayalaseema';
    language = 'te';
    languageName = 'Telugu (తెలుగు)';
  } else {
    state = 'India';
    district = 'National Health Network';
    language = 'en';
    languageName = 'English';
  }

  res.json({
    state,
    district,
    language,
    languageName,
    lat: userLat,
    lng: userLng
  });
}));

// ─── FHIR Interoperability & Data Management ─────────────────────────────────
app.get('/api/data/management/stats', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ status: 'offline', data: {} });
  const [patientCount, facilityCount, referralCount, encounterCount, opBookingCount, feedbackCount] = await Promise.all([
    Patient.countDocuments(), Facility.countDocuments(), Referral.countDocuments(),
    Encounter.countDocuments(), OPBooking.countDocuments(), Feedback.countDocuments()
  ]);

  res.json({
    ok: true,
    database: 'MongoDB (arogyalink)',
    collections: { patients: patientCount, facilities: facilityCount, referrals: referralCount, encounters: encounterCount, opBookings: opBookingCount, grievances: feedbackCount },
    analytics: { highRiskCohortSize: await Patient.countDocuments({ riskCategory: 'high' }), fhirResourcesExportable: (patientCount + encounterCount + referralCount) * 3 }
  });
}));

app.get('/api/data/management/export-fhir', optionalAuth, asyncHandler(async (req, res) => {
  const patients = dbOk() ? await Patient.find({}).limit(50) : PATIENTS;
  const encounters = dbOk() ? await Encounter.find({}).limit(50) : [];
  const referrals = dbOk() ? await Referral.find({}).limit(50) : [];

  const fhirResources = [
    ...patients.map(p => toFHIRPatient(p)),
    ...encounters.map(e => toFHIREncounter(e)),
    ...referrals.map(r => toFHIRServiceRequest(r))
  ].filter(Boolean);

  res.json(wrapBundle(fhirResources, 'collection'));
}));

// FHIR $everything operation for full patient longitudinal bundle
app.get('/api/fhir/Patient/:id/\\$everything', optionalAuth, asyncHandler(async (req, res) => {
  if (!dbOk()) return res.status(503).json({ error: 'DB offline' });
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const [encounters, observations, conditions, referrals, prescriptions] = await Promise.all([
    Encounter.find({ patientId: patient._id }),
    Observation.find({ patientId: patient._id }),
    Condition.find({ patientId: patient._id }),
    Referral.find({ patientId: patient._id }),
    MedicationRequest.find({ patientId: patient._id })
  ]);

  const bundle = wrapBundle([
    toFHIRPatient(patient),
    ...encounters.map(e => toFHIREncounter(e, patient)),
    ...observations.map(o => toFHIRObservation(o)),
    ...referrals.map(r => toFHIRServiceRequest(r))
  ].filter(Boolean), 'searchset');

  res.json(bundle);
}));

// Admin & Synthetic Data Generator (district_admin or demo mode)
app.post('/api/data/management/generate-synthetic', adminActionLimiter, optionalAuth, asyncHandler(async (req, res) => {
  if (IS_PRODUCTION && req.user?.role !== 'district_admin') {
    return res.status(403).json({ error: 'Only district administrators can generate synthetic test cohorts' });
  }
  const { batchSize = 10, region = 'Palghar' } = req.body;
  const count = Math.min(Number(batchSize) || 10, 50);
  const newPatients = [];

  for (let i = 1; i <= count; i++) {
    const isHigh = i % 3 === 0;
    newPatients.push({
      abhaId: `ABHA-MH-SYN-${Date.now().toString().slice(-4)}${i}`,
      name: `Beneficiary Synthetic ${i}`,
      age: 20 + (i * 3) % 50,
      gender: i % 2 === 0 ? 'F' : 'M',
      village: ['Kelwa Gaon', 'Nandgaon', 'Shirgaon', 'Tembhode', 'Boisar'][i % 5],
      district: 'Palghar', state: 'Maharashtra',
      phone: `98220${String(10000 + i).slice(-5)}`,
      riskCategory: isHigh ? 'high' : 'low',
      conditions: isHigh ? ['Hypertension Stage 2', 'ANC High Risk'] : ['Routine Care'],
      _synthetic: true
    });
  }

  if (dbOk()) await Patient.insertMany(newPatients);
  audit('SYNTHETIC_DATA_GENERATED', 'Patient', 'batch', req.user?.name || 'admin', req.user?.role || 'district_admin', { count }, req);
  res.status(201).json({ ok: true, count: newPatients.length, message: `Generated ${newPatients.length} synthetic patient records.` });
}));

// Feedback & Grievance API
app.get('/api/feedback', asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: GRIEVANCES_DATA });
  const data = await Feedback.find({}).sort({ submittedAt: -1 }).limit(100);
  res.json({ data: data.length ? data : GRIEVANCES_DATA });
}));

app.post('/api/feedback', asyncHandler(async (req, res) => {
  const grievanceId = `GRV-MH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const docData = { ...req.body, grievanceId, submittedAt: new Date() };
  const doc = dbOk() ? await Feedback.create(docData) : docData;
  broadcast('grievance-new', doc);
  res.status(201).json({ ok: true, data: doc });
}));

// Emergency SOS Sync
app.post('/api/emergency/offline-payload', asyncHandler(async (req, res) => {
  const bookingId = `SOS-OFFLINE-${Date.now().toString().slice(-6)}`;
  const sosDispatch = {
    bookingId, serviceType: '108_emergency',
    pickupLocation: { village: 'Remote Rural Zone', address: `GPS: ${req.body.localGps?.lat}, ${req.body.localGps?.lng}` },
    dropoffLocation: { facilityName: 'Nearest 24x7 Emergency Centre' },
    vehicleNumber: 'MH-04-108-EMERGENCY', currentStatus: 'dispatched', dispatchedAt: new Date()
  };
  if (dbOk()) await TransportDispatch.create(sosDispatch);
  broadcast('sos-alert', { type: 'OFFLINE_SOS_SYNCED', bookingId, location: req.body.localGps });
  res.json({ ok: true, bookingId, status: '108 Emergency vehicle dispatched.' });
}));

// ─── Analytics KPI & AI Chart Board API ───────────────────────────────────────
app.get('/api/analytics/kpis', asyncHandler(async (req, res) => {
  if (!dbOk()) return res.json({ data: {} });

  const [
    totalPatients,
    highRisk,
    allPatients,
    referrals,
    stockItems,
    pendingFollowups,
    opBookings,
    encounters,
    facilities
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.countDocuments({ riskCategory: 'high' }),
    Patient.find({}).lean(),
    Referral.find({}).lean(),
    Stock.find({}).lean(),
    Followup.countDocuments({ completed: false }),
    OPBooking.find({}).lean(),
    Encounter.find({}).lean(),
    Facility.find({}).lean()
  ]);

  // 1. Referral stage breakdown & metrics
  const referralsByStage = {
    initiated: 0,
    triage_reviewed: 0,
    accepted: 0,
    transport_arranged: 0,
    in_transit: 0,
    admitted: 0,
    specialist_consulted: 0,
    procedure_done: 0,
    discharged: 0,
    follow_up_due: 0
  };
  const urgencyMix = { emergency: 0, urgent: 0, routine: 0, elective: 0 };
  let completedReferrals = 0;

  for (const r of referrals) {
    if (r.currentStage && referralsByStage[r.currentStage] !== undefined) {
      referralsByStage[r.currentStage]++;
    }
    if (['discharged', 'procedure_done', 'follow_up_due'].includes(r.currentStage)) {
      completedReferrals++;
    }
    if (r.urgency && urgencyMix[r.urgency] !== undefined) {
      urgencyMix[r.urgency]++;
    }
  }

  const referralCompletionRate = referrals.length > 0 ? Math.round((completedReferrals / referrals.length) * 100) : 0;
  const avgTAT = 3.8; // hours average turnaround time

  // 2. High-risk patients breakdown
  const riskCategories = {
    highANC: 0,
    hypertension: 0,
    diabetes: 0,
    pediatric: 0,
    cardiac: 0
  };
  for (const p of allPatients) {
    const conds = (p.conditions || []).join(' ').toLowerCase();
    if (conds.includes('anc') || conds.includes('pregnant') || conds.includes('eclampsia')) riskCategories.highANC++;
    if (conds.includes('htn') || conds.includes('hypertension')) riskCategories.hypertension++;
    if (conds.includes('dm') || conds.includes('diabetes')) riskCategories.diabetes++;
    if (conds.includes('pediatric') || conds.includes('sam') || conds.includes('child') || (p.age && p.age < 12)) riskCategories.pediatric++;
    if (conds.includes('cardiac') || conds.includes('heart') || conds.includes('stemi') || conds.includes('angina')) riskCategories.cardiac++;
  }

  const riskBreakdown = [
    { name: 'High-Risk (ANC / NCD)', value: highRisk, color: 'var(--col-red)' },
    { name: 'Moderate Risk', value: Math.max(0, allPatients.length - highRisk - Math.floor(allPatients.length * 0.4)), color: 'var(--col-amber)' },
    { name: 'Low / Routine Care', value: Math.max(1, Math.floor(allPatients.length * 0.4)), color: 'var(--col-teal)' }
  ].filter(d => d.value > 0);

  // 3. OP Queue status by department
  const depts = [
    { key: 'General Medicine', dept: 'General Medicine', match: (d) => !d || d.toLowerCase().includes('general') || d.toLowerCase().includes('medicine') },
    { key: 'Obstetrics & Gynaecology', dept: 'Obstetrics & Gynaecology', match: (d) => (d || '').toLowerCase().includes('anc') || (d || '').toLowerCase().includes('gyn') || (d || '').toLowerCase().includes('matern') || (d || '').toLowerCase().includes('obg') },
    { key: 'Paediatrics', dept: 'Paediatrics & Neonatology', match: (d) => (d || '').toLowerCase().includes('paed') || (d || '').toLowerCase().includes('child') },
    { key: 'Orthopaedics', dept: 'Orthopaedics & Trauma', match: (d) => (d || '').toLowerCase().includes('ortho') || (d || '').toLowerCase().includes('trauma') },
    { key: 'Cardiology', dept: 'Cardiology & NCD', match: (d) => (d || '').toLowerCase().includes('cardio') || (d || '').toLowerCase().includes('ncd') },
    { key: 'Emergency Bay', dept: 'Emergency Bay (24x7)', match: (d) => (d || '').toLowerCase().includes('emerg') }
  ];

  const opQueueByDept = depts.map(d => {
    const queueOps = opBookings.filter(b => d.match(b.department));
    const queueEncs = encounters.filter(e => d.match(e.department) && (e.status === 'waiting' || !e.status));
    return {
      dept: d.dept,
      waiting: Math.max(1, queueOps.length + queueEncs.length),
      emergency: queueOps.filter(b => b.clinicalUrgency === 'emergency').length + queueEncs.filter(e => e.priority === 'emergency').length
    };
  });

  // 4. Daily patient footfall (last 7-14 days trend)
  const footfallMap = new Map();
  for (const enc of encounters) {
    const dStr = enc.conductedAt ? new Date(enc.conductedAt).toISOString().split('T')[0] : (enc.createdAt ? new Date(enc.createdAt).toISOString().split('T')[0] : '2026-08-28');
    const prev = footfallMap.get(dStr) || { date: dStr, total: 0, opd: 0, emergency: 0, completed: 0 };
    prev.total++;
    if (enc.type === 'Emergency' || enc.priority === 'emergency') prev.emergency++;
    else prev.opd++;
    if (enc.status === 'completed') prev.completed++;
    footfallMap.set(dStr, prev);
  }

  let dailyFootfall = Array.from(footfallMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  if (dailyFootfall.length < 5) {
    dailyFootfall = [
      { date: 'Aug 20', total: 42, opd: 36, emergency: 6, completed: 38 },
      { date: 'Aug 22', total: 58, opd: 50, emergency: 8, completed: 52 },
      { date: 'Aug 24', total: 64, opd: 55, emergency: 9, completed: 59 },
      { date: 'Aug 26', total: 72, opd: 61, emergency: 11, completed: 66 },
      { date: 'Aug 28', total: 85, opd: 73, emergency: 12, completed: 78 },
      { date: 'Aug 30', total: 94, opd: 80, emergency: 14, completed: 88 }
    ];
  }

  // 5. Medicine Stock Alerts Breakdown
  const criticalStockList = stockItems.filter(s => s.status === 'critical' || s.status === 'stockout');
  const stockBreakdown = [
    { name: 'Adequate Stock', value: stockItems.filter(s => s.status === 'adequate').length, color: 'var(--col-green)' },
    { name: 'Critical / Low Buffer', value: stockItems.filter(s => s.status === 'critical').length, color: 'var(--col-amber)' },
    { name: 'Zero Stockout', value: stockItems.filter(s => s.status === 'stockout').length, color: 'var(--col-red)' }
  ].filter(d => d.value > 0);

  // 6. Facility load comparison
  let totalBeds = 0;
  let totalOccupied = 0;
  const facilityLoad = facilities.slice(0, 8).map(f => {
    const bedsTotal = f.resources?.bedsTotal || f.beds || 100;
    const bedsOccupied = f.resources?.bedsOccupied || Math.floor(bedsTotal * (f.currentOPLoad === 'High' ? 0.88 : f.currentOPLoad === 'Low' ? 0.45 : 0.72));
    const occupancyPct = bedsTotal > 0 ? Math.round((bedsOccupied / bedsTotal) * 100) : 0;
    totalBeds += bedsTotal;
    totalOccupied += bedsOccupied;
    return {
      facilityId: f.facilityId,
      name: f.name.replace(/\s*\([^)]*\)/, '').replace(/\/.*$/, '').trim(),
      district: f.district,
      bedsTotal,
      bedsOccupied,
      occupancyPct,
      currentOPLoad: f.currentOPLoad || 'Medium',
      queueLength: f.currentOpdQueue?.queueLength || (f.currentOPLoad === 'High' ? 28 : f.currentOPLoad === 'Low' ? 6 : 14)
    };
  });

  const avgBedOccupancy = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 74;

  const dashboardPayload = {
    totalPatients,
    highRisk,
    totalReferrals: referrals.length,
    completedReferrals,
    referralCompletionRate,
    avgTAT,
    stockAlerts: criticalStockList.length,
    pendingFollowups,
    avgBedOccupancy,
    referralsByStage,
    urgencyMix,
    riskBreakdown,
    highRiskSummary: {
      ancHighRisk: riskCategories.highANC,
      hypertension: riskCategories.hypertension,
      diabetes: riskCategories.diabetes,
      pediatric: riskCategories.pediatric,
      cardiac: riskCategories.cardiac
    },
    opQueueByDept,
    dailyFootfall,
    stockBreakdown,
    criticalStockList: criticalStockList.map(s => ({
      medicineName: s.medicineName,
      facilityName: s.facilityName,
      category: s.category,
      quantityInHand: s.quantityInHand,
      reorderLevel: s.reorderLevel,
      unit: s.unit,
      status: s.status
    })),
    facilityLoad
  };

  // Generate short intelligent insights via NVIDIA Nemotron (with fallback)
  const aiInsightsResult = await generateDashboardInsights({
    kpis: dashboardPayload,
    opQueueByDept,
    dailyFootfall,
    referralSummary: { completionRate: referralCompletionRate },
    highRiskSummary: dashboardPayload.highRiskSummary,
    stockSummary: { criticalCount: criticalStockList.length, criticalList: criticalStockList },
    facilityLoad
  });

  dashboardPayload.aiInsights = aiInsightsResult.insights;
  dashboardPayload.aiInsightsSource = aiInsightsResult.source;
  dashboardPayload.aiInsightsGeneratedAt = aiInsightsResult.generatedAt;
  dashboardPayload.isAI = aiInsightsResult.isAI;

  res.json({ data: dashboardPayload });
}));

// ─── Seed Database (District Admin or Authorized Demo Key Only) ──────────────
app.post('/api/seed', adminActionLimiter, optionalAuth, asyncHandler(async (req, res) => {
  if (IS_PRODUCTION && req.user?.role !== 'district_admin') {
    return res.status(403).json({ error: 'Database seeding is restricted to District Administrators in production' });
  }
  if (!DEMO_MODE && process.env.DEMO_SEED_KEY && req.get('x-demo-seed-key') !== process.env.DEMO_SEED_KEY) {
    return res.status(403).json({ error: 'Unauthorized seed key' });
  }
  if (!dbOk()) return res.status(503).json({ error: 'MongoDB not connected' });

  await Promise.all([
    Patient.deleteMany({}), Encounter.deleteMany({}), Referral.deleteMany({}),
    Facility.deleteMany({}), Stock.deleteMany({}), Followup.deleteMany({}),
    Feedback.deleteMany({}), AuditLog.deleteMany({}), TransportDispatch.deleteMany({}),
    DiagnosticSample.deleteMany({}), MMUCamp.deleteMany({}), User.deleteMany({}),
    OPBooking.deleteMany({}), ClinicalAssessment.deleteMany({}), SyncEvent.deleteMany({}),
    Observation.deleteMany({}), Condition.deleteMany({}), Consent.deleteMany({}),
    CarePlan.deleteMany({}), Appointment.deleteMany({}), FacilityService.deleteMany({}),
    DailyFacilityCapacitySnapshot.deleteMany({}), DiagnosticOrder.deleteMany({}),
    DiagnosticReport.deleteMany({}), MedicationRequest.deleteMany({}), CareTeam.deleteMany({}),
    OfflineDevice.deleteMany({}), ConflictRecord.deleteMany({})
  ]);

  const facilities = await Facility.insertMany(FACILITIES);
  await User.insertMany(await Promise.all(USERS_DATA.map(async ({ password, ...user }) => ({
    ...user,
    passwordHash: await hashPassword(password)
  }))));
  await OPBooking.insertMany(INITIAL_OP_BOOKINGS);
  await Feedback.insertMany(GRIEVANCES_DATA);
  const patients = await Patient.insertMany(PATIENTS);
  const savita = patients.find(p => p.name === 'Savita Patil') || patients[0];

  // Seed baseline Savita encounters + time-series multi-day encounters
  const encounterDocs = await Encounter.insertMany([
    ...ENCOUNTERS_SAVITA.map(e => ({ ...e, patientId: savita._id })),
    ...TIME_SERIES_ENCOUNTERS.map((t, idx) => ({
      patientId: patients[idx % patients.length]._id,
      facilityId: facilities[idx % facilities.length].facilityId,
      facilityName: facilities[idx % facilities.length].name,
      type: t.type,
      department: t.dept,
      token: `OPD-${String(idx + 1).padStart(3, '0')}`,
      status: 'completed',
      chiefComplaint: `Consultation at ${t.dept}`,
      conductedBy: 'Medical Officer on Duty',
      conductedAt: new Date(`${t.date}T10:30:00Z`).toISOString(),
      role: 'hospital_doctor'
    }))
  ]);
  const latestEnc = encounterDocs[0];

  // ── lnkling demo triageAi for Savita Patil (pregnant, fever, swelling) ─────
  await Encounter.findByIdAndUpdate(latestEnc._id, {
    triageAi: {
      urgency: 'high',
      opDepartment: 'Obstetrics & Gynaecology',
      priority: 'emergency',
      specialty: 'Obstetrics & Gynaecology',
      reasons: [
        'Pregnant patient with fever and leg swelling',
        'Elevated BP — risk of pre-eclampsia',
        'Immediate OBG evaluation required'
      ],
      suggestedDiagnostics: [
        'Urine protein dipstick', 'BP monitoring (every 15 min)',
        'Fetal heart rate Doppler', 'Haemoglobin / CBC', 'Ultrasound sonography'
      ],
      patientMessage: 'సవితదేవి, దయచేసి వెంటనే ఆసుపత్రికి వెళ్లండి. మీ ఆరోగ్యానికి వైద్యుల పరిశీలన అత్యవసరం.',
      ashaMessage: '• వెంటనే 108 కు కాల్ చేయండి\n• ప్రతి 15 నిమిషాలకు BP రికార్డ్ చేయండి\n• రోగిని ఎడమవైపుకు పడుకోబెట్టండి\n• మెడికల్ ఆఫీసర్‌కు సమాచారం ఇవ్వండి',
      language: 'te',
      model: 'lnkling',
      disclaimer: 'AI support — confirm with health worker / doctor',
      offline: false,
      _seeded: true
    }
  });

  // Seed referrals across multiple patients and AP facilities
  await Referral.insertMany(ALL_REFERRALS_DATA.map((r, i) => ({
    ...r,
    patientId: patients[i % patients.length]._id,
    encounterId: encounterDocs[i % encounterDocs.length]._id
  })));

  await Stock.insertMany(EXPANDED_STOCK_DATA);
  await Followup.insertMany(FOLLOWUPS.map((f, i) => ({ ...f, patientId: patients[i % patients.length]._id })));
  await TransportDispatch.insertMany(TRANSPORT_DISPATCHES.map(t => ({ ...t, patientId: savita._id })));
  await DiagnosticSample.insertMany(DIAGNOSTIC_SAMPLES.map(s => ({ ...s, patientId: savita._id, abhaId: savita.abhaId })));
  await MMUCamp.insertMany(MMU_CAMPS);

  // Seed Longitudinal Health Records
  if (savita) {
    await Observation.insertMany([
      { patientId: savita._id, encounterId: latestEnc._id, category: 'vital-signs', loincCode: '8480-6', name: 'Systolic BP', value: 148, valueUnit: 'mmHg', recordedBy: 'Rekha Patil', facilityId: 'PHC-KELWA-01', _synthetic: true },
      { patientId: savita._id, encounterId: latestEnc._id, category: 'vital-signs', loincCode: '8462-4', name: 'Diastolic BP', value: 94, valueUnit: 'mmHg', recordedBy: 'Rekha Patil', facilityId: 'PHC-KELWA-01', _synthetic: true },
      { patientId: savita._id, encounterId: latestEnc._id, category: 'vital-signs', loincCode: '59408-5', name: 'SpO2', value: 98, valueUnit: '%', recordedBy: 'Rekha Patil', facilityId: 'PHC-KELWA-01', _synthetic: true }
    ]);
    await Condition.create({
      patientId: savita._id, encounterId: latestEnc._id, code: 'O14.90', display: 'Unspecified pre-eclampsia', system: 'ICD-10',
      clinicalStatus: 'active', verificationStatus: 'confirmed', severity: 'severe', recordedBy: 'Dr. Ramesh Patkar', facilityId: 'PHC-KELWA-01', _synthetic: true
    });
    await CarePlan.create({
      patientId: savita._id, category: 'ANC', title: 'High-Risk ANC Protocol', description: 'Weekly BP monitoring, urine protein check, hospital delivery planning',
      status: 'active', authoredBy: 'Dr. Ramesh Patkar', facilityId: 'PHC-KELWA-01', _synthetic: true
    });
  }

  // Seed Real-time Facility Capacity Snapshots
  for (const f of facilities) {
    await DailyFacilityCapacitySnapshot.create({
      facilityId: f.facilityId, facilityName: f.name,
      bedsTotal: f.resources?.bedsTotal || f.beds || 50,
      bedsOccupied: f.resources?.bedsOccupied || Math.floor((f.beds || 50) * 0.7),
      icuTotal: f.resources?.icuTotal || f.icuBeds || 4,
      icuOccupied: f.resources?.icuOccupied || Math.floor((f.icuBeds || 4) * 0.6),
      oxygenBeds: f.resources?.oxygenBeds || Math.floor((f.beds || 50) * 0.4),
      oxygenOccupied: f.resources?.oxygenOccupied || Math.floor((f.beds || 50) * 0.3),
      ambulancesTotal: f.resources?.ambulances || 2,
      ambulancesAvail: f.resources?.ambulancesAvailable || 1,
      recordedBy: 'District Health Admin AP',
      _synthetic: true
    });
  }

  audit('SEED_DATABASE_COMPLETE', 'Database', 'all', req.user?.name || 'system', req.user?.role || 'district_admin', { patients: patients.length, facilities: facilities.length }, req);

  res.json({
    ok: true,
    patients: patients.length,
    facilities: facilities.length,
    referrals: ALL_REFERRALS_DATA.length,
    stocks: EXPANDED_STOCK_DATA.length,
    opBookings: INITIAL_OP_BOOKINGS.length,
    users: USERS_DATA.length,
    message: `Database successfully seeded with ${facilities.length} Andhra Pradesh & network facilities, complete clinical cohorts, referrals, and live OPD queues.`
  });
}));

// ─── 404 and Global Centralized Error Handlers ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`✓ ArogyaLink API running on http://localhost:${PORT}`);
    console.log(`  Health Check:   GET  /api/health`);
    console.log(`  JWT Auth Login: POST /api/auth/login`);
    console.log(`  Offline Sync:   POST /api/sync`);
    console.log(`  FHIR Export:    GET  /api/data/management/export-fhir`);
    console.log(`  Decision CDS:   POST /api/ai/clinical-assessments`);
  });
}

start().catch(console.error);

export default app;

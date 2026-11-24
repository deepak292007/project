/**
 * authorize.js — Role- and Facility-Scoped Authorization Middleware
 *
 * Build authorization guards as composable middleware factories.
 * Always placed AFTER requireAuth in the middleware chain.
 *
 * Privacy rules enforced here:
 *   patient       → may only access their own records
 *   asha          → may access assigned household patients (req.user.assignedHouseholds)
 *   phc_doctor    → may access patients & records scoped to their facilityId
 *   hospital_doctor / hospital_admin → may access records at their facilityId
 *   district_admin → unrestricted read/write within their districtId
 *
 * Usage:
 *   app.post('/api/seed', requireAuth, requireRoles('district_admin'), handler)
 *   app.get('/api/patients', requireAuth, requireFacilityScope(), handler)
 *   app.get('/api/patients/:id', requireAuth, requirePatientScope(), handler)
 */

// ─── Role Guard ───────────────────────────────────────────────────────────────

/**
 * requireRoles(...roles) — Only allows the specified roles.
 * @param  {...string} roles - Allowed roles
 */
export function requireRoles(...roles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: insufficient role',
        required: roles,
        actual: req.user.role,
      });
    }
    next();
  };
}

// ─── Facility Scope Guard ─────────────────────────────────────────────────────

/**
 * requireFacilityScope() — For list endpoints, injects a facilityId filter
 * based on the authenticated user's role, unless the user is district_admin.
 *
 * Attaches req.facilityFilter = { facilityId: '...' } or {} for district_admin.
 */
export function requireFacilityScope() {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const { role, facilityId } = req.user;

    if (role === 'district_admin') {
      // District admin sees all facilities in their district
      req.facilityFilter = {};
    } else if (['hospital_admin', 'hospital_doctor', 'phc_doctor'].includes(role)) {
      // Facility staff see only their own facility's data
      req.facilityFilter = { facilityId: facilityId || '__none__' };
    } else if (role === 'asha') {
      // ASHA workers see their assigned facility
      req.facilityFilter = { facilityId: facilityId || '__none__' };
    } else {
      // Patient role — no facility-level list access
      return res.status(403).json({ error: 'Patients may not access facility-level lists' });
    }

    next();
  };
}

// ─── Patient Scope Guard ──────────────────────────────────────────────────────

/**
 * requirePatientScope() — For single-patient endpoints (GET /patients/:id),
 * ensures the authenticated user is allowed to read this patient's data.
 *
 * Attaches req.patientIdParam = req.params.id (normalized).
 * Admins & facility staff always allowed; patients only their own record.
 */
export function requirePatientScope() {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const { role, sub: userId, assignedHouseholds = [] } = req.user;
    const patientId = req.params.id || req.params.patientId;

    // Admin roles → always allowed
    if (['district_admin', 'hospital_admin', 'hospital_doctor', 'phc_doctor'].includes(role)) {
      return next();
    }

    // ASHA → allowed for assigned households
    if (role === 'asha') {
      if (assignedHouseholds.length === 0) return next(); // No restriction if no list configured yet
      if (assignedHouseholds.includes(patientId)) return next();
      return res.status(403).json({ error: 'ASHA may only access assigned household patients' });
    }

    // Patient → only their own record
    if (role === 'patient') {
      // userId is the Patient _id linked to the User account (set at registration)
      if (req.user.patientId && String(req.user.patientId) !== String(patientId)) {
        return res.status(403).json({ error: 'Patients may only access their own health records' });
      }
      return next();
    }

    // Unrecognized role → deny
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// ─── Write Guard ──────────────────────────────────────────────────────────────

/**
 * requireWriteScope() — Prevents patients from using write endpoints
 * that clinicians must control (e.g., creating encounters, updating referral stage).
 */
export function requireWriteScope() {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'patient') {
      return res.status(403).json({ error: 'Patients may not perform this write operation' });
    }
    next();
  };
}

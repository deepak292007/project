/**
 * auth.js — JWT Access-Token + Refresh-Token Middleware
 *
 * Access tokens:  15-minute expiry, HS256, returned in login response body.
 * Refresh tokens: 7-day expiry, HS256, stored as hash in User.refreshTokenHash,
 *                 rotated on every use (old token invalidated on refresh).
 *
 * Usage:
 *   app.get('/api/protected', requireAuth, handler)
 *   app.get('/api/optional', optionalAuth, handler)  // attaches user if token present
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'arogyalink-dev-access-secret-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'arogyalink-dev-refresh-secret-change-in-production';
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const IS_PRODUCTION  = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION && ACCESS_SECRET.includes('dev')) {
  console.error('FATAL: JWT_ACCESS_SECRET must be set to a strong random value in production.');
  process.exit(1);
}

// ─── Token Issuance ───────────────────────────────────────────────────────────

/**
 * Create a signed access token for the given user payload.
 * Payload: { sub, role, facilityId, districtId, name }
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    jwtid: randomUUID(),
  });
}

/**
 * Create a signed refresh token.
 * Only sub (userId) and a random jti are included — no sensitive role data.
 */
export function signRefreshToken(userId) {
  return jwt.sign({ sub: String(userId) }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    jwtid: randomUUID(),
  });
}

/**
 * Verify and decode an access token. Returns null on failure.
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}

/**
 * Verify and decode a refresh token. Returns null on failure.
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}

// ─── Express Middleware ───────────────────────────────────────────────────────

/**
 * requireAuth — Rejects requests that do not carry a valid access token.
 * Attaches req.user = { sub, role, facilityId, districtId, name } on success.
 */
export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = payload;
  next();
}

/**
 * optionalAuth — Attaches req.user if a valid token is present; continues either way.
 * Use on routes that existing frontend calls without auth headers.
 */
export function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.user = payload;
  }
  next();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  // Also accept cookie-based access token for SSR scenarios
  if (req.cookies?.al_access) return req.cookies.al_access;
  return null;
}

export { REFRESH_EXPIRY };

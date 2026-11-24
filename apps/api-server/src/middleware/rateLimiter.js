/**
 * rateLimiter.js — Express Rate Limiting Middleware
 *
 * Uses express-rate-limit with in-memory store (suitable for single-instance deployment).
 * For multi-instance deployments, replace with a Redis store (rate-limit-redis).
 *
 * Three limiters exported:
 *   loginLimiter   — strict: 10 attempts per IP per 15 minutes (brute-force protection)
 *   apiLimiter     — general: 200 requests per IP per minute
 *   triageLimiter  — 30 triage/clinical requests per IP per minute (CPU-intensive)
 */

import rateLimit from 'express-rate-limit';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const WINDOW_MS     = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);   // 1 minute
const MAX_REQUESTS  = parseInt(process.env.RATE_LIMIT_MAX       || '200',  10);

// ─── Login Brute-Force Limiter ─────────────────────────────────────────────────
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: IS_PRODUCTION ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,  // Only count failed/4xx attempts
});

// ─── General API Limiter ───────────────────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down your requests.' },
  // Key by IP + user (if authenticated) to prevent sharing IP limits in shared networks
  keyGenerator: (req) => {
    const userId = req.user?.sub;
    return userId ? `${req.ip}:${userId}` : req.ip;
  },
});

// ─── Clinical Triage Limiter ───────────────────────────────────────────────────
export const triageLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Clinical assessment rate limit reached. Please wait before submitting another request.' },
});

// ─── Seed / Admin Action Limiter ────────────────────────────────────────────────
export const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Admin action rate limit reached. Maximum 10 administrative actions per hour.' },
});

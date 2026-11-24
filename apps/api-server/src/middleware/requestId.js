/**
 * requestId.js — Request ID Middleware
 *
 * Generates a unique UUID for every incoming request.
 * Attaches it to:
 *   - req.requestId      (available in route handlers for audit logs)
 *   - res header X-Request-ID  (returned to clients for support tracing)
 *
 * Usage: app.use(requestId)  — place early, before route handlers.
 */

import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  // Re-use the caller's request ID if supplied (e.g. from an upstream API gateway)
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

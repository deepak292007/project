/**
 * errorHandler.js — Centralized Async Error Handler
 *
 * Mount LAST in the Express app (after all routes).
 * Catches errors thrown by route handlers (via next(err) or async throws).
 *
 * Produces structured JSON error responses.
 * In production, internal error details are hidden from clients.
 *
 * Usage:
 *   // After all routes:
 *   app.use(errorHandler);
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * asyncHandler — Wraps an async route handler to forward unhandled rejections to next().
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * errorHandler — Express 4-argument error middleware.
 * Must be the last middleware registered.
 */
export function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  const requestId = req.requestId || 'unknown';

  // Log full error server-side (structured JSON for log aggregation)
  const logEntry = {
    level: 'error',
    requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.sub || null,
    role: req.user?.role || null,
    errorName: err.name,
    errorMessage: err.message,
    stack: IS_PRODUCTION ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(logEntry));

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: `Duplicate value for '${field}'`,
      requestId,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details, requestId });
  }

  // JWT errors (should normally be caught in middleware, but belt-and-suspenders)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token', requestId });
  }

  // Default 500
  const status = err.status || err.statusCode || 500;
  const message = IS_PRODUCTION && status >= 500
    ? 'An internal server error occurred. Please quote the request ID when reporting.'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message, requestId });
}

/**
 * notFoundHandler — Catches unmatched routes and returns a 404.
 * Mount just before errorHandler.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    requestId: req.requestId,
  });
}

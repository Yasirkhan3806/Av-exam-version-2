/**
 * Errors thrown by services that carry their own HTTP status code, so
 * controllers no longer need to hand-roll `if (err.message === "X") return
 * res.status(400)...` string-matching to pick one. Route handlers wrapped in
 * asyncHandler.js just `throw new AppError("message", 404)` (or let a plain
 * Error escape, which falls back to 500) and the central error middleware
 * in app.js reads `err.statusCode` off it.
 *
 * `isOperational: true` marks this as an expected, handled failure (bad
 * input, not-found, etc.) rather than a programming error/crash — reserved
 * for future use if the error middleware ever wants to treat the two
 * differently (e.g. only alerting on non-operational errors).
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

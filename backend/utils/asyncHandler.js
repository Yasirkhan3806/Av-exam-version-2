/**
 * Wraps an async Express route handler so a rejected promise/thrown error
 * is forwarded to next(err) instead of becoming an unhandled rejection.
 * Replaces the try/catch boilerplate every controller used to hand-roll —
 * pair with AppError.js so the central error middleware (app.js) can read
 * err.statusCode instead of controllers string-matching err.message.
 *
 * Usage: router.get("/x", asyncHandler(controller.x))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Set environment variable BEFORE importing the middleware
process.env.JWT_SECRET = process.env.JWT_SECRET;

// Use dynamic import to ensure the middleware picks up the env var
const {
  generateTokenAndSetCookie,
  verifyToken,
  verifyExamToken,
  verifyInstructorToken,
  verifyELibraryToken,
} = await import("../utils/middleware.js");

const secret = process.env.JWT_SECRET;

const createMockRes = () => {
  const res = {
    cookie: (name, token, options) => {
      res.cookieCalled = { name, token, options };
      return res;
    },
    status: (s) => {
      res.statusSent = s;
      return res;
    },
    json: (j) => {
      res.jsonSent = j;
      return res;
    },
    cookieCalled: null,
    statusSent: null,
    jsonSent: null,
  };
  return res;
};

test("Middleware Unit Tests", async (t) => {

  await t.test("MID-U-001: generateTokenAndSetCookie - should sign token (default role) and set httpOnly cookie", () => {
    const user = { _id: "user123", email: "test@example.com", userName: "testuser" };
    const res = createMockRes();

    const token = generateTokenAndSetCookie(user, res);

    assert.ok(token, "Token should be generated");
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, user._id);
    assert.strictEqual(decoded.email, user.email);
    assert.strictEqual(decoded.role, "student", "role defaults to student when not specified");

    // Cookie name defaults to "token" — student and admin sessions share
    // the same cookie name; only the signed role claim distinguishes them.
    assert.strictEqual(res.cookieCalled.name, "token");
    assert.strictEqual(res.cookieCalled.options.httpOnly, true);
    assert.strictEqual(res.cookieCalled.options.maxAge, 3 * 24 * 60 * 60 * 1000);
    assert.strictEqual(res.cookieCalled.options.sameSite, "lax", "sameSite should be lax for credential support");
    assert.strictEqual(res.cookieCalled.options.secure, false, "secure should be false in test environment (non-production)");
  });

  await t.test("MID-U-001b: generateTokenAndSetCookie - should sign the given role and tokenName", () => {
    const user = { _id: "admin123", email: "admin@example.com", userName: "admin" };
    const res = createMockRes();

    const token = generateTokenAndSetCookie(user, res, "token", "admin");

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.role, "admin");
    assert.strictEqual(res.cookieCalled.name, "token");
  });

  await t.test("MID-U-002: verifyToken - should populate req.user for valid token", () => {
    const userPayload = { userId: "user123", email: "test@example.com", role: "student" };
    const token = jwt.sign(userPayload, secret);
    const req = { cookies: { token }, headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    assert.strictEqual(nextCalled, true, "next() should be called");
    assert.strictEqual(req.user.userId, userPayload.userId);
  });

  await t.test("MID-U-003: verifyToken - should return 401 if no token provided", () => {
    const req = { cookies: {}, headers: {} };
    const res = createMockRes();
    const next = () => {};

    verifyToken(req, res, next);

    assert.strictEqual(res.statusSent, 401);
    assert.strictEqual(res.jsonSent.message, "Access denied. No token provided.");
  });

  await t.test("MID-U-004: verifyToken - should return 401 for expired token", () => {
    // Force an expired token by setting iat and expiresIn
    const expiredToken = jwt.sign(
      { userId: "123", iat: Math.floor(Date.now() / 1000) - 10000 },
      secret,
      { expiresIn: "1s" }
    );
    const req = { cookies: { token: expiredToken }, headers: {} };
    const res = createMockRes();

    verifyToken(req, res, () => {});

    assert.strictEqual(res.statusSent, 401);
    assert.strictEqual(res.jsonSent.message, "Token has expired. Please log in again.");
  });

  await t.test("MID-U-005: verifyToken - should return 401 for invalid token", () => {
    const req = { cookies: { token: "invalid-token" }, headers: {} };
    const res = createMockRes();

    verifyToken(req, res, () => {});

    assert.strictEqual(res.statusSent, 401);
    assert.strictEqual(res.jsonSent.message, "Invalid token. Access denied.");
  });

  await t.test("MID-U-006: verifyToken - should fallback to req.headers.cookie", () => {
    const userPayload = { userId: "user123" };
    const token = jwt.sign(userPayload, secret);
    const req = {
      cookies: {},
      headers: { cookie: `token=${token}` }
    };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyToken(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.userId, userPayload.userId);
  });

  await t.test("MID-U-006b: requireRole - allows matching role and blocks mismatched role", async () => {
    const { requireRole } = await import("../utils/middleware.js");

    const okReq = { user: { role: "admin" } };
    const okRes = createMockRes();
    let okNextCalled = false;
    requireRole("admin")(okReq, okRes, () => { okNextCalled = true; });
    assert.strictEqual(okNextCalled, true);

    const blockedReq = { user: { role: "student" } };
    const blockedRes = createMockRes();
    let blockedNextCalled = false;
    requireRole("admin")(blockedReq, blockedRes, () => { blockedNextCalled = true; });
    assert.strictEqual(blockedNextCalled, false);
    assert.strictEqual(blockedRes.statusSent, 403);
  });

  await t.test("MID-U-007: verifyExamToken - should extract from Bearer header and populate req.exam", () => {
    const examPayload = { examId: "exam123" };
    const token = jwt.sign(examPayload, secret);
    const req = { 
      headers: { authorization: `Bearer ${token}` },
      cookies: {}
    };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyExamToken(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.exam.examId, examPayload.examId);
  });

  await t.test("MID-U-008: verifyInstructorToken - should populate req.instructor", () => {
    const instPayload = { instructorId: "inst123" };
    const token = jwt.sign(instPayload, secret);
    const req = { cookies: { instructorToken: token }, headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyInstructorToken(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.instructor.instructorId, instPayload.instructorId);
  });

  await t.test("MID-U-009: verifyELibraryToken - should populate req.eLibraryUser", () => {
    const libPayload = { elibId: "lib123" };
    const token = jwt.sign(libPayload, secret);
    const req = { cookies: { eLibraryToken: token }, headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    verifyELibraryToken(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.eLibraryUser.elibId, libPayload.elibId);
  });
});

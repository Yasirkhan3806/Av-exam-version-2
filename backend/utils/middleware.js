import jwt from "jsonwebtoken";

// Must come from env — no hardcoded fallback. A hardcoded secret here was
// previously committed to source (and to the frontend's two middleware
// copies), meaning anyone with repo access could forge valid tokens. Fail
// fast at boot rather than silently signing/verifying with an empty secret.
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Add it to backend/.env — it must match the " +
      "frontend's JWT_SECRET exactly (see frontend/.env.local)."
  );
}

export const generateTokenAndSetCookie = (
  user,
  res,
  tokenName = "token",
  role = "student",
) => {
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      userName: user.name,
      role,
    },
    JWT_SECRET,
    { expiresIn: "3d" },
  );

  // res.cookie(tokenName, token, {
  //   httpOnly: true,
  //   secure: true, // MUST be true when sameSite is 'none'
  //   sameSite: "none", // Allows cross-origin cookies
  //   maxAge: 3 * 24 * 60 * 60 * 1000,
  //   domain: process.env.COOKIE_DOMAIN || ".testcbe.academicvitality.org", // Share cookie across subdomains (api.testcbe... ↔ testcbe...)
  // });

  //for development use this code 
  res.cookie(tokenName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // or "strict"
    maxAge: 3 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN,
  });


  return token;
};

// Shared implementation behind verifyToken/verifyExamToken/
// verifyInstructorToken/verifyELibraryToken below. The four were previously
// ~90% duplicated copy-paste, differing only in cookie name, which req.*
// property they populate, whether a Bearer-header fallback is supported,
// and their exact response shape/wording — all preserved exactly via the
// config object each one passes in, so this is a pure de-duplication with
// no behavior change (tests/middleware.test.js pins the exact responses).
function makeTokenVerifier({
  cookieName,
  reqProp,
  supportsBearerFallback = false,
  supportsHeaderCookieFallback = false,
  onMissing,
  onExpired,
  onInvalid,
  onOtherError = onInvalid,
}) {
  return (req, res, next) => {
    try {
      let token;

      if (req.cookies && req.cookies[cookieName]) {
        token = req.cookies[cookieName];
      }

      if (!token && supportsBearerFallback && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token && supportsHeaderCookieFallback && req.headers.cookie) {
        const cookieHeader = req.headers.cookie
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${cookieName}=`));
        if (cookieHeader) {
          token = cookieHeader.split("=")[1];
        }
      }

      if (!token) {
        return onMissing(res);
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req[reqProp] = decoded;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return onExpired(res);
      }
      if (err.name === "JsonWebTokenError") {
        return onInvalid(res);
      }
      return onOtherError(res);
    }
  };
}

export const verifyToken = makeTokenVerifier({
  cookieName: "token",
  reqProp: "user",
  supportsHeaderCookieFallback: true,
  onMissing: (res) =>
    res.status(401).json({ success: false, message: "Access denied. No token provided." }),
  onExpired: (res) =>
    res.status(401).json({ success: false, message: "Token has expired. Please log in again." }),
  onInvalid: (res) =>
    res.status(401).json({ success: false, message: "Invalid token. Access denied." }),
  onOtherError: (res) =>
    res.status(500).json({ success: false, message: "Internal server error during token verification." }),
});

// Role check — must run after verifyToken (relies on req.user.role, which
// verifyToken populates from the decoded JWT). Student and admin tokens
// share the same cookie name ("token") and the same verifyToken middleware,
// so this is what actually distinguishes "any logged-in user" from
// "logged in as admin" — verifyToken alone does not.
export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Insufficient permissions.",
    });
  }
  next();
};

export const verifyExamToken = makeTokenVerifier({
  cookieName: "ExamToken",
  reqProp: "exam",
  supportsBearerFallback: true,
  onMissing: (res) => res.status(401).json({ error: "No ExamToken provided" }),
  onExpired: (res) => res.status(401).json({ error: "Invalid or expired ExamToken" }),
  onInvalid: (res) => res.status(401).json({ error: "Invalid or expired ExamToken" }),
});

export const verifyInstructorToken = makeTokenVerifier({
  cookieName: "instructorToken",
  reqProp: "instructor",
  supportsHeaderCookieFallback: true,
  onMissing: (res) => res.status(401).json({ error: "No instructorToken provided" }),
  onExpired: (res) => res.status(401).json({ error: "Instructor token has expired" }),
  onInvalid: (res) => res.status(401).json({ error: "Invalid instructor token" }),
  onOtherError: (res) => res.status(401).json({ error: "Invalid or expired instructorToken" }),
});

export const verifyELibraryToken = makeTokenVerifier({
  cookieName: "eLibraryToken",
  reqProp: "eLibraryUser",
  supportsHeaderCookieFallback: true,
  onMissing: (res) =>
    res.status(401).json({ success: false, message: "Access denied. No eLibrary token provided." }),
  onExpired: (res) =>
    res.status(401).json({ success: false, message: "eLibrary token has expired. Please log in again." }),
  onInvalid: (res) =>
    res.status(401).json({ success: false, message: "Invalid eLibrary token. Access denied." }),
  onOtherError: (res) =>
    res.status(500).json({ success: false, message: "Internal server error during token verification." }),
});

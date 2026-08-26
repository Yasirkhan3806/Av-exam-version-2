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

export const verifyToken = (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="));
      if (cookieHeader) {
        token = cookieHeader.split("=")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Access denied.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during token verification.",
    });
  }
};

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

export const verifyExamToken = (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.ExamToken) {
      token = req.cookies.ExamToken;
    }

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "No ExamToken provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.exam = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired ExamToken" });
  }
};

export const verifyInstructorToken = (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.instructorToken) {
      token = req.cookies.instructorToken;
    }

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("instructorToken="));
      if (cookieHeader) {
        token = cookieHeader.split("=")[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "No instructorToken provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.instructor = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Instructor token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid instructor token" });
    }
    return res
      .status(401)
      .json({ error: "Invalid or expired instructorToken" });
  }
};

export const verifyELibraryToken = (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.eLibraryToken) {
      token = req.cookies.eLibraryToken;
    }

    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("eLibraryToken="));
      if (cookieHeader) {
        token = cookieHeader.split("=")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No eLibrary token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.eLibraryUser = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "eLibrary token has expired. Please log in again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid eLibrary token. Access denied.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during token verification.",
    });
  }
};

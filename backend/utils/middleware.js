import jwt from "jsonwebtoken";

export const JWT_SECRET =
  "08d8d60667a5fceba29530f0de6529ff6ef1aa529c935a579579b63298feeb4c1463a53a4531952c2f2098674bc535f64ef40c523bcb8fa028336239f41e6fa6";

export const generateTokenAndSetCookie = (user, res, tokenName = "token") => {
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      userName: user.name,
    },
    JWT_SECRET,
    { expiresIn: "3d" }
  );

  res.cookie(tokenName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3 * 24 * 60 * 60 * 1000,
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

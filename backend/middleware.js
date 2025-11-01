import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


export const JWT_SECRET = '08d8d60667a5fceba29530f0de6529ff6ef1aa529c935a579579b63298feeb4c1463a53a4531952c2f2098674bc535f64ef40c523bcb8fa028336239f41e6fa6'
const generateTokenAndSetCookie = (user, res, tokenName = 'token') => {

    // Create JWT token with user ID
    const token = jwt.sign(
        { userId: user._id,
            email: user.email,
            userName : user.name
         },
        JWT_SECRET,
        { expiresIn: '3d' } // Token expires in 3 days
    );

    // Set token in cookie
    res.cookie(tokenName, token, {
        httpOnly: true,           // Prevent XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',       // CSRF protection
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
    });

    return token;
};

const verifyToken = (req, res, next) => {
  try {
    let token;
     ("Headers:", req.cookies);

    // 1. Check token from cookies (browser fetch with credentials: 'include')
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Fallback: check token from headers (Next.js server forwarding)
    if (!token && req.headers.cookie) {
      const cookieHeader = req.headers.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="));
      if (cookieHeader) {
        token = cookieHeader.split("=")[1];
      }
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

     ("Verifying token...");

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);


    // Attach user info to request
    req.user = decoded;

    // Continue
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


const verifyExamToken = (req, res, next) => {
  try {
    let token;

    // Check cookie first
    if (req.cookies && req.cookies.ExamToken) {
      token = req.cookies.ExamToken;
    }

    // Fallback: check headers
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "No ExamToken provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.exam = decoded; // attach decoded ExamToken payload
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired ExamToken" });
  }
};


 const verifyInstructorToken = (req, res, next) => {
  try {
    let token;

    // Check cookie first
    if (req.cookies && req.cookies.instructorToken) {
      token = req.cookies.instructorToken;
    }

    // Fallback: raw Cookie header parse
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
    req.instructor = decoded; // attach decoded instructor payload
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Instructor token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid instructor token" });
    }
    return res.status(401).json({ error: "Invalid or expired instructorToken" });
  }
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `TestQuestions/${req.body.subjectId}/${req.body.name}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir); // always (error, value)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Answer_pdfs/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const answerUpload = multer({ storage: answerStorage });



export {generateTokenAndSetCookie, verifyToken,  upload, verifyExamToken, answerUpload, verifyInstructorToken};
import express from "express";
import bcrypt from "bcrypt";
import { TestUser, User,Instructor } from "./schema.js";
import { generateTokenAndSetCookie, verifyToken } from "./middleware.js";

const router = express.Router();

router.get("/",(req,res) => {
return res.status(200).json({ message: "auth is working" });

});


// ✅ Register
router.post("/register", async (req, res) => {
  try {
    const { name, userName, email, password } = req.body;
    if (!name || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await TestUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new TestUser({ name, email, userName, password: hashedPassword });
    await newUser.save();

    // Generate JWT cookie on register
    generateTokenAndSetCookie(newUser, res);

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await TestUser.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set cookie with JWT
    generateTokenAndSetCookie(user, res);

    return res.status(200).json({
      message: "✅ Logged in successfully",
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

const PEPPER = 'c8b378ecb0f4059059036dcc4abd1e76a30bdd72b1429d9c1a2242effbfa19d5'
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email:username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const passwordWithPepper = PEPPER ? password + PEPPER : password;
        const isMatch = await bcrypt.compare(passwordWithPepper, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set cookie with JWT
    generateTokenAndSetCookie(user, res);

    return res.status(200).json({
      message: "✅ Logged in successfully",
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ✅ Verify JWT
router.get("/verifySession", verifyToken, (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    user: req.user,
  });
});


// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "✅ Logged out successfully" });
});

router.post('verifyToken', verifyToken, (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    user: req.user,
  });
});

export default router;

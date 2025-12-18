import * as authService from "../services/authService.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";

export const healthCheck = (req, res) => {
  return res.status(200).json({ message: "auth is working" });
};

export const register = async (req, res) => {
  try {
    const { name, userName, email, password } = req.body;

    if (!name || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = await authService.registerUser(
      name,
      userName,
      email,
      password
    );
    generateTokenAndSetCookie(newUser, res);

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (e) {
    console.error(e);
    if (e.message === "User already exists") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await authService.loginUser(email, password);
    generateTokenAndSetCookie(user, res);

    return res.status(200).json({
      message: "✅ Logged in successfully",
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    if (e.message === "Invalid email or password") {
      return res.status(401).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await authService.adminLogin(username, password);
    generateTokenAndSetCookie(user, res);

    return res.status(200).json({
      message: "✅ Logged in successfully",
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    if (e.message === "Invalid email or password") {
      return res.status(401).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const verifySession = (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    user: req.user,
  });
};

export const getInstructors = async (req, res) => {
  try {
    const instructors = await authService.getInstructors();
    return res.status(200).json({
      message: "✅ Instructors fetched successfully",
      success: true,
      instructors,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "✅ Logged out successfully" });
};

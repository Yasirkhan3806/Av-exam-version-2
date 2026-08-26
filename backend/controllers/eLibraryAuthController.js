import * as eLibraryAuthService from "../services/eLibraryAuthService.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";
import { verifyTurnstileToken } from "../utils/turnstile.js";

export const healthCheck = (req, res) => {
  return res.status(200).json({ message: "eLibrary auth is working" });
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      contactNumber,
      password,
      turnstileToken,
    } = req.body;

    const isTokenValid = await verifyTurnstileToken(turnstileToken);
    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid CAPTCHA" });
    }

    // Validate all required fields
    if (
      !firstName ||
      !lastName ||
      !userName ||
      !email ||
      !contactNumber ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate contact number (basic validation)
    if (contactNumber.length < 10) {
      return res
        .status(400)
        .json({ message: "Contact number must be at least 10 digits" });
    }

    const newUser = await eLibraryAuthService.registerELibraryUser(
      firstName,
      lastName,
      userName,
      email,
      contactNumber,
      password,
    );

    // Generate token with custom cookie name for eLibrary
    generateTokenAndSetCookie(newUser, res, "eLibraryToken", "elibrary");

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userName: newUser.userName,
        email: newUser.email,
        contactNumber: newUser.contactNumber,
      },
    });
  } catch (e) {
    console.error(e);
    if (
      e.message === "Email already exists" ||
      e.message === "Username already exists"
    ) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body;

    const isTokenValid = await verifyTurnstileToken(turnstileToken);
    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid CAPTCHA" });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await eLibraryAuthService.loginELibraryUser(email, password);

    // Generate token with custom cookie name for eLibrary
    generateTokenAndSetCookie(user, res, "eLibraryToken", "elibrary");

    return res.status(200).json({
      message: "✅ Logged in successfully",
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        contactNumber: user.contactNumber,
      },
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
    user: req.eLibraryUser,
  });
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.eLibraryUser.userId;
    const user = await eLibraryAuthService.getELibraryUserById(userId);

    return res.status(200).json({
      message: "✅ Profile fetched successfully",
      success: true,
      user,
    });
  } catch (e) {
    console.error(e);
    if (e.message === "User not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("eLibraryToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "✅ Logged out successfully" });
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await eLibraryAuthService.getAllELibraryUsers();
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await eLibraryAuthService.deleteELibraryUser(id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (e) {
    console.error(e);
    if (e.message === "User not found") {
      return res.status(404).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

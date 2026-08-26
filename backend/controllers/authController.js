import * as authService from "../services/authService.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = (req, res) => {
  return res.status(200).json({ message: "auth is working" });
};

export const register = asyncHandler(async (req, res) => {
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
});

export const sendWelcomeEmailController = asyncHandler(async (req, res) => {
  const { email, name, userName } = req.body;
  await authService.sendWelcomeEmail(email, name, userName);
  return res.status(200).json({ message: "Welcome email sent successfully" });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }
  const user = await authService.loginUser(email, password);
  const token = generateTokenAndSetCookie(user, res);

  return res.status(200).json({
    message: "✅ Logged in successfully",
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }
  const user = await authService.adminLogin(username, password);
  const token = generateTokenAndSetCookie(user, res, "token", "admin");

  return res.status(200).json({
    message: "✅ Logged in successfully",
    success: true,
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

export const verifySession = (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    user: req.user,
  });
};

export const getInstructors = asyncHandler(async (req, res) => {
  const instructors = await authService.getInstructors();
  return res.status(200).json({
    message: "✅ Instructors fetched successfully",
    success: true,
    instructors,
  });
});

export const getAllStudents = asyncHandler(async (req, res) => {
  const students = await authService.getAllStudents();
  res.status(200).json(students);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedStudent = await authService.updateStudent(id, req.body);
  res.status(200).json({
    message: "Student updated successfully",
    student: updatedStudent,
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await authService.deleteStudent(id);
  res.status(200).json({ message: "Student deleted successfully" });
});

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "✅ Logged out successfully" });
};

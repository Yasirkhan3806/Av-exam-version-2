import bcrypt from "bcryptjs";
import { ELibraryUser } from "../models/eLibraryUser.js";
import { sendEmail } from "../utils/emailService.js";

export const registerELibraryUser = async (
  firstName,
  lastName,
  userName,
  email,
  contactNumber,
  password,
) => {
  // Check if user already exists
  const existingUser = await ELibraryUser.findOne({
    $or: [{ email }, { userName }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("Email already exists");
    }
    if (existingUser.userName === userName) {
      throw new Error("Username already exists");
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = new ELibraryUser({
    firstName,
    lastName,
    userName,
    email,
    contactNumber,
    password: hashedPassword,
  });

  await newUser.save();
 const emailSubject = "Welcome to Academic Vitality E-Library!";
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Academic Vitality, ${firstName} ${lastName}!</h2>
      <p>We are thrilled to have you join our E-Library platform.</p>
      <p>Your account has been successfully created with the username: <strong>${userName}</strong></p>
      <p>You can now log in and access all our resources, including 24/7 study rooms and exam materials.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>The Academic Vitality Team</strong></p>
    </div>
  `;

  // Send email asynchronously without blocking the response
  sendEmail(email, emailSubject, emailHtml);
  return newUser;
};

export const loginELibraryUser = async (email, password) => {
  // Find user by email
  const user = await ELibraryUser.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const getELibraryUserById = async (userId) => {
  const user = await ELibraryUser.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateELibraryUser = async (userId, updateData) => {
  // Don't allow password update through this method
  const { password, ...safeUpdateData } = updateData;

  const user = await ELibraryUser.findByIdAndUpdate(userId, safeUpdateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const deleteELibraryUser = async (userId) => {
  const user = await ELibraryUser.findByIdAndDelete(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const getAllELibraryUsers = async () => {
  const users = await ELibraryUser.find({})
    .select("-password")
    .sort({ createdAt: -1 });
  return users;
};

import bcrypt from "bcryptjs";
import { ELibraryUser } from "../models/eLibraryUser.js";

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

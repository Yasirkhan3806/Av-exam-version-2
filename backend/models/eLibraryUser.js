import mongoose from "mongoose";

const eLibraryUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true },
  },
  {
    collection: "ELibrary_Users",
    timestamps: true,
  },
);

export const ELibraryUser = mongoose.model("ELibraryUser", eLibraryUserSchema);

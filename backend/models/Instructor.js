import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    courses: { type: [String], default: [] },
  },
  {
    collection: "Instructor_Data",
  }
);

export const Instructor = mongoose.model("Instructor", instructorSchema);

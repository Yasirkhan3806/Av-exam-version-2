import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    courses: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      required: true,
      enum: ["CAF", "PRC", "CFAP"],
    },
  },
  {
    timestamps: true,
    collection: "Subject_Data",
  }
);

export const Subject = mongoose.model("Subject", subjectSchema);

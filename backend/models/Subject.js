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

// Closes a TOCTOU race in subjectService.addSubject (findOne-then-create
// with no transaction) where two concurrent "add subject" requests for the
// same name+instructor could otherwise both pass the duplicate check.
subjectSchema.index({ name: 1, instructor: 1 }, { unique: true });

export const Subject = mongoose.model("Subject", subjectSchema);

import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    pdfName: {
      type: String,
      required: true,
    },
    pagesData: {
      type: {},
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    totalAttempt: {
      type: Number,
      required: true,
      min: 1,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    mockExam: {
      type: Boolean,
      default: false,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Questions = mongoose.model("Questions", questionsSchema);

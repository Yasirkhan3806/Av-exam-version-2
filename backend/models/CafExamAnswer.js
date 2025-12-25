import mongoose from "mongoose";

const cafExamAnswerSchema = new mongoose.Schema(
  {
    Student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestUser",
      required: true,
    },
    questionSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CafExamQuestions",
      required: true,
    },
    submittedPdfUrl: {
      type: String,
      required: true,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["submitted", "checked", "draft"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
    collection: "CafExamAnswers",
  }
);

export const CafExamAnswer = mongoose.model(
  "CafExamAnswer",
  cafExamAnswerSchema
);

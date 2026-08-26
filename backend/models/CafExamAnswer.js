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
    suggestedSolutionUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["submitted", "checked", "draft"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    collection: "CafExamAnswers",
  }
);

// submitCafAnswer has no existing-submission check at all before inserting
// — a double-submit (double-click, retry) creates duplicate docs for the
// same student+question, and downstream code that does findOne() to read
// "the" submission then nondeterministically picks whichever duplicate
// matches first. One submission per student per exam question, enforced at
// the DB level.
cafExamAnswerSchema.index({ questionSet: 1, Student: 1 }, { unique: true });

export const CafExamAnswer = mongoose.model(
  "CafExamAnswer",
  cafExamAnswerSchema
);

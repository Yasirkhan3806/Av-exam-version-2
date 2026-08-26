import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    answers: {
      type: Map,
      of: String,
      required: true,
    },
    questionSet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questions",
      required: true,
    },
    status: {
      type: String,
      enum: ["submitted", "draft", "checked"],
      default: "draft",
    },
    marksObtained: {
      type: Object,
      default: {},
    },
    checkedAt: {
      type: Date,
    },
    Student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestUser",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "Answers",
  }
);

// Enforces at most one in-progress draft per student per exam. Closes a
// TOCTOU race in questionService.startExam (findOne-then-create with no
// transaction) where two concurrent "start exam" requests — a double-click,
// a network retry — could otherwise both pass the findOne check and create
// duplicate draft Answer docs. Partial so it only constrains drafts; a
// student can still have separate submitted/checked docs over time (e.g.
// retakes), just never two open drafts of the same exam at once.
answerSchema.index(
  { questionSet: 1, Student: 1 },
  { unique: true, partialFilterExpression: { status: "draft" } }
);

export const Answer = mongoose.model("Answer", answerSchema);

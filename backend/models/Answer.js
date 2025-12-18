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
      default: "submitted",
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

export const Answer = mongoose.model("Answer", answerSchema);

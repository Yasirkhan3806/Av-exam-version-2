import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const mcqSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: [optionSchema],
  correctAnswer: {
    type: String,
    required: true,
  },
});

const prcExamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    description: {
      type: String,
    },
    totalAttempt: {
      type: Number,
      required: true, // in minutes
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    mcqs: [mcqSchema],
  },
  { timestamps: true }
);

const PRCExam = mongoose.model("PRCExam", prcExamSchema);

export default PRCExam;

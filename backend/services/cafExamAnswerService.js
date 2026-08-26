import { CafExamAnswer } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import fs from "fs";

export const submitCafAnswer = async (answerData, file) => {
  const { studentId, questionId } = answerData;

  if (!studentId || !questionId || !file) {
    throw new AppError("Missing required fields or PDF file", 400);
  }

  const newAnswer = new CafExamAnswer({
    Student: studentId,
    questionSet: questionId,
    submittedPdfUrl: file.path,
    status: "submitted",
    marksObtained: 0,
  });

  try {
    await newAnswer.save();
  } catch (err) {
    // Double-submit (double-click, retry) — the unique index on
    // {questionSet, Student} rejects the duplicate insert.
    if (err.code === 11000) {
      throw new AppError("You have already submitted an answer for this exam.", 409);
    }
    throw err;
  }
  return newAnswer;
};

export const getAnswersByStudent = async (studentId) => {
  return await CafExamAnswer.find({ Student: studentId }).populate(
    "questionSet"
  );
};

export const getAnswersByQuestion = async (questionId) => {
  return await CafExamAnswer.find({ questionSet: questionId }).populate(
    "Student"
  );
};

export const getSubmission = async (studentId, examId) => {
  const answer = await CafExamAnswer.findOne({
    Student: studentId,
    questionSet: examId,
  })
    .populate("Student", "name email")
    .populate("questionSet");

  if (!answer) {
    throw new AppError("Submission not found", 404);
  }
  return answer;
};

export const getMySubmission = async (studentId, examId) => {
  const answer = await CafExamAnswer.findOne({
    Student: studentId,
    questionSet: examId,
  }).populate("questionSet");

  if (!answer) {
    throw new AppError("Submission not found", 404);
  }
  return answer;
};

export const markSubmission = async (studentId, examId, file, marks, suggestedSolutionFile) => {
  if (!file) {
    throw new AppError("Checked PDF is required", 400);
  }

  const deleted = await deleteOldPdf(studentId, examId);

  if (deleted) {
    // Build the update object
    const updateData = {
      marksObtained: marks,
      submittedPdfUrl: file.path,
      status: "checked",
      checkedAt: new Date(),
    };

    // Handle suggested solution file if provided
    if (suggestedSolutionFile) {
      // Delete old suggested solution file from disk if it exists
      const oldAnswer = await CafExamAnswer.findOne({
        Student: studentId,
        questionSet: examId,
      });
      if (oldAnswer?.suggestedSolutionUrl && fs.existsSync(oldAnswer.suggestedSolutionUrl)) {
        try {
          fs.unlinkSync(oldAnswer.suggestedSolutionUrl);
        } catch (err) {
          console.error("Old suggested solution file deletion failed", err);
        }
      }
      updateData.suggestedSolutionUrl = suggestedSolutionFile.path;
    }

    const updatedAnswer = await CafExamAnswer.findOneAndUpdate(
      { Student: studentId, questionSet: examId },
      updateData,
      { new: true }
    );

    if (!updatedAnswer) {
      throw new AppError("Submission not found", 404);
    }
    return updatedAnswer;
  }

  return null;
};

const deleteOldPdf = async (studentId, examId) => {
  const oldAnswer = await CafExamAnswer.findOne({
    Student: studentId,
    questionSet: examId,
  });

  if (!oldAnswer) return true; // Or handle error: no record to delete

  const filePath = oldAnswer.submittedPdfUrl;
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("File deletion failed", err);
    }
  }
  return true;
};

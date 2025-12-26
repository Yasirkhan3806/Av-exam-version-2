import { CafExamAnswer } from "../models/index.js";
import fs from "fs";

export const submitCafAnswer = async (answerData, file) => {
  const { studentId, questionId } = answerData;

  if (!studentId || !questionId || !file) {
    throw new Error("Missing required fields or PDF file");
  }

  const newAnswer = new CafExamAnswer({
    Student: studentId,
    questionSet: questionId,
    submittedPdfUrl: file.path,
    status: "submitted",
    marksObtained: 0,
  });

  await newAnswer.save();
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
    throw new Error("Submission not found");
  }
  return answer;
};

export const getMySubmission = async (studentId, examId) => {
  const answer = await CafExamAnswer.findOne({
    Student: studentId,
    questionSet: examId,
  }).populate("questionSet");

  if (!answer) {
    throw new Error("Submission not found");
  }
  return answer;
};

export const markSubmission = async (studentId, examId, file, marks) => {
  if (!file) {
    throw new Error("Checked PDF is required");
  }

  const deleted = await deleteOldPdf(studentId, examId);

  if (deleted) {
    const updatedAnswer = await CafExamAnswer.findOneAndUpdate(
      { Student: studentId, questionSet: examId },
      {
        marksObtained: marks,
        submittedPdfUrl: file.path,
        status: "checked",
        checkedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedAnswer) {
      throw new Error("Submission not found");
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

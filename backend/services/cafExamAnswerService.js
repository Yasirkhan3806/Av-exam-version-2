import { CafExamAnswer } from "../models/index.js";

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

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

export const markSubmission = async (studentId, examId, file, marks) => {
  if (!file) {
    throw new Error("Checked PDF is required");
  }

  const updatedAnswer = await CafExamAnswer.findOneAndUpdate(
    { Student: studentId, questionSet: examId },
    {
      marksObtained: marks,
      checkedPdfUrl: file.path,
      status: "checked",
      checkedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedAnswer) {
    throw new Error("Submission not found");
  }
  return updatedAnswer;
};

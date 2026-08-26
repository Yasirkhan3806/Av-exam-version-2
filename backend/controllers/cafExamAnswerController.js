import * as cafExamAnswerService from "../services/cafExamAnswerService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const submitCafAnswer = asyncHandler(async (req, res) => {
  const studentId = req.user.userId; // Get from token
  const { questionId } = req.body;

  const result = await cafExamAnswerService.submitCafAnswer(
    { studentId, questionId },
    req.file
  );

  return res.status(201).json({
    message: "CAF Exam answer submitted successfully",
    data: result,
  });
});

export const getStudentAnswers = asyncHandler(async (req, res) => {
  const studentId = req.user.userId;
  const answers = await cafExamAnswerService.getAnswersByStudent(studentId);
  return res.status(200).json(answers);
});

export const getSubmissionForInstructor = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const submission = await cafExamAnswerService.getSubmission(
    studentId,
    examId
  );
  return res.status(200).json(submission);
});

export const getMySubmission = asyncHandler(async (req, res) => {
  const studentId = req.user.userId;
  const { examId } = req.params;
  const submission = await cafExamAnswerService.getMySubmission(
    studentId,
    examId
  );
  return res.status(200).json(submission);
});

export const markSubmission = asyncHandler(async (req, res) => {
  const { studentId, examId, marks } = req.body;
  const checkedPdfFile = req.files?.checkedPdf?.[0];
  const suggestedSolutionFile = req.files?.suggestedSolution?.[0];
  const result = await cafExamAnswerService.markSubmission(
    studentId,
    examId,
    checkedPdfFile,
    marks,
    suggestedSolutionFile
  );
  return res
    .status(200)
    .json({ message: "Submission marked successfully", data: result });
});

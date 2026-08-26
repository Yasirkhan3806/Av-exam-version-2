import * as questionService from "../services/questionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Add new standard questions (splits PDF)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const addQuestions = asyncHandler(async (req, res) => {
  const dataset = await questionService.addQuestions(req.body, req.files);
  return res.status(200).json({
    id: dataset._id,
    message: "Dataset saved successfully",
  });
});

/**
 * Get all questions for a specific subject
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getQuestions = asyncHandler(async (req, res) => {
  const { subjectId, subjectType } = req.params;
  const questions = await questionService.getQuestionsBySubject(
    subjectId,
    subjectType
  );
  return res.status(200).json(questions);
});

/**
 * Get a specific question by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getQuestionById = asyncHandler(async (req, res) => {
  const questionData = await questionService.getQuestionById(
    req.params.id,
    req.params.subjectType
  );
  return res.status(200).json(questionData);
});

/**
 * Get full question details (Standard or CAF)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFullQuestionById = asyncHandler(async (req, res) => {
  // Fetch full exam details
  const exam = await questionService.getFullQuestionById(req.params.id);
  return res.status(200).json(exam);
});

/**
 * Delete a question by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.params.subjectType);
  return res.status(200).json({ message: "Question deleted successfully" });
});

/**
 * Submit answers for an active exam session
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const submitAnswers = asyncHandler(async (req, res) => {
  const { answers, questionSet } = req.body;
  // req.exam is populated by verifyExamToken middleware
  const { ExamId } = req.exam;

  if (!questionSet) {
    return res.status(400).json({ error: "questionSet is required" });
  }

  // Update the answer document
  const updatedDoc = await questionService.submitAnswers(ExamId, answers);

  return res.status(200).json({
    message: "Answers updated successfully",
    id: updatedDoc._id,
  });
});

/**
 * Start a new exam session
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const startExam = asyncHandler(async (req, res) => {
  const { questionSet } = req.body;
  const studentId = req.user.userId;

  // Create answer doc and generate token
  const { answerDoc, examToken } = await questionService.startExam(
    questionSet,
    studentId
  );

  // Set secure cookie
  res.cookie("ExamToken", examToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Exam session started",
    ExamId: answerDoc._id,
    ExamToken: examToken,
  });
});

export const finishExam = asyncHandler(async (req, res) => {
  const { ExamId } = req.exam;

  // Mark the Answer doc as submitted
  await questionService.submitExamSession(ExamId);

  res.clearCookie("ExamToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Exam finished, ExamToken cleared",
  });
});

/**
 * Add CAF questions (single PDF)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const addCafQuestionsController = asyncHandler(async (req, res) => {
  const result = await questionService.addCafQuestions(req.body, req.file);
  return res.status(201).json({
    message: "CAF questions added successfully",
    data: result,
  });
});

/**
 * Update standard question exam
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedExam = await questionService.updateQuestion(
    id,
    req.body,
    req.files
  );
  return res.status(200).json({
    message: "Exam updated successfully",
    exam: updatedExam,
  });
});

/**
 * Update CAF question exam
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const updateCafQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedExam = await questionService.updateCafQuestion(
    id,
    req.body,
    req.file
  );
  return res.status(200).json({
    message: "CAF Exam updated successfully",
    exam: updatedExam,
  });
});

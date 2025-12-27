import express from "express";
import * as questionController from "../controllers/questionController.js";
import { verifyToken, verifyExamToken } from "../utils/middleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

/**
 * @route POST /questions/addQuestions
 * @desc Add standard questions (splits PDF per page)
 * @access Private
 */
router.post(
  "/addQuestions",
  verifyToken,
  upload.single("pdf"),
  questionController.addQuestions
);

/**
 * @route POST /questions/addCAFQuestions
 * @desc Add CAF questions (single PDF)
 * @access Private
 */
router.post(
  "/addCAFQuestions",
  verifyToken,
  upload.single("pdf"),
  questionController.addCafQuestionsController
);

/**
 * @route GET /questions/getQuestions/:subjectType/:subjectId
 * @desc Get all questions for a subject
 * @access Private
 */
router.get(
  "/getQuestions/:subjectType/:subjectId",
  verifyToken,
  questionController.getQuestions
);

/**
 * @route GET /questions/getQuestionById/:subjectType/:id
 * @desc Get a specific question by ID
 * @access Private
 */
router.get(
  "/getQuestionById/:subjectType/:id",
  verifyToken,
  questionController.getQuestionById
);

/**
 * @route GET /questions/getFullQuestionById/:id
 * @desc Get full question details (Standard or CAF)
 * @access Private
 */
router.get(
  "/getFullQuestionById/:id",
  verifyToken,
  questionController.getFullQuestionById
);

/**
 * @route DELETE /questions/deleteQuestion/:subjectType/:id
 * @desc Delete a question
 * @access Private
 */
router.delete(
  "/deleteQuestion/:subjectType/:id",
  verifyToken,
  questionController.deleteQuestion
);

/**
 * @route POST /questions/submitAnswers
 * @desc Submit answers for an exam
 * @access Private (Exam Token)
 */
router.post(
  "/submitAnswers",
  verifyExamToken,
  questionController.submitAnswers
);

/**
 * @route POST /questions/startExam
 * @desc Start an exam session
 * @access Private
 */
router.post("/startExam", verifyToken, questionController.startExam);

/**
 * @route POST /questions/finishExam
 * @desc Finish an exam session
 * @access Private
 */
router.post("/finishExam", verifyToken, questionController.finishExam);

/**
 * @route PUT /questions/updateQuestion/:id
 * @desc Update a standard question exam
 * @access Private
 */
router.put(
  "/updateQuestion/:id",
  verifyToken,
  upload.single("pdf"),
  questionController.updateQuestion
);

/**
 * @route PUT /questions/updateCafQuestion/:id
 * @desc Update a CAF question exam
 * @access Private
 */
router.put(
  "/updateCafQuestion/:id",
  verifyToken,
  upload.single("pdf"),
  questionController.updateCafQuestion
);

export default router;

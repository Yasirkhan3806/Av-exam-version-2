import express from "express";
import * as questionController from "../controllers/questionController.js";
import { verifyToken, verifyExamToken } from "../utils/middleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.post(
  "/addQuestions",
  verifyToken,
  upload.single("pdf"),
  questionController.addQuestions
);
router.post(
  "/addCAFQuestions",
  verifyToken,
  upload.single("pdf"),
  questionController.addCafQuestionsController
);  
router.get(
  "/getQuestions/:subjectType/:subjectId",
  verifyToken,
  questionController.getQuestions
);
router.get(
  "/getQuestionById/:id",
  verifyToken,
  questionController.getQuestionById
);
router.delete(
  "/deleteQuestion/:id",
  verifyToken,
  questionController.deleteQuestion
);
router.post(
  "/submitAnswers",
  verifyExamToken,
  questionController.submitAnswers
);
router.post("/startExam", verifyToken, questionController.startExam);
router.post("/finishExam", verifyToken, questionController.finishExam);

export default router;

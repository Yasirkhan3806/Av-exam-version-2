import express from "express";
import * as cafExamAnswerController from "../controllers/cafExamAnswerController.js";
import { verifyToken } from "../utils/middleware.js";
import { answerUpload } from "../utils/upload.js";

const router = express.Router();

router.post(
  "/submitAnswer",
  verifyToken,
  answerUpload.single("pdf"),
  cafExamAnswerController.submitCafAnswer
);

router.get(
  "/myAnswers",
  verifyToken,
  cafExamAnswerController.getStudentAnswers
);

export default router;

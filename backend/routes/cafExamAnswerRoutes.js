import express from "express";
import * as cafExamAnswerController from "../controllers/cafExamAnswerController.js";
import { verifyToken, verifyInstructorToken } from "../utils/middleware.js";
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

router.get(
  "/submission/:studentId/:examId",
  verifyInstructorToken,
  cafExamAnswerController.getSubmissionForInstructor
);

router.get(
  "/my-submission/:examId",
  verifyToken,
  cafExamAnswerController.getMySubmission
);

router.post(
  "/mark-submission",
  verifyInstructorToken,
  answerUpload.single("checkedPdf"),
  cafExamAnswerController.markSubmission
);

export default router;

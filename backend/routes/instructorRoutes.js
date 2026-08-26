import express from "express";
import * as instructorController from "../controllers/instructorController.js";
import { verifyToken, verifyInstructorToken, requireRole } from "../utils/middleware.js";
import { answerUpload } from "../utils/upload.js";

const router = express.Router();

router.post(
  "/register-instructor",
  verifyToken,
  requireRole("admin"),
  instructorController.registerInstructor
);
router.post("/instructor-login", instructorController.instructorLogin);
router.get(
  "/getAllSubjects/:instructorId",
  verifyInstructorToken,
  instructorController.getAllSubjects
);
router.get(
  "/verifyInstructorSession",
  verifyInstructorToken,
  instructorController.verifyInstructorSession
);
router.get(
  "/getExamsBySubject/:subjectId",
  verifyInstructorToken,
  instructorController.getExamsBySubject
);
router.get(
  "/getSubmissions/:questionId",
  verifyInstructorToken,
  instructorController.getSubmissions
);
router.get(
  "/getExam/:examId",
  verifyInstructorToken,
  instructorController.getExam
);
router.get(
  "/getStudentAnswers/:studentId/:examId",
  verifyInstructorToken,
  instructorController.getStudentAnswers
);
router.post(
  "/uploadCheckedPdfs",
  verifyInstructorToken,
  answerUpload.any(),
  instructorController.uploadCheckedPdfs
);
router.put(
  "/updateStudentMarks/:studentId/:examId",
  verifyInstructorToken,
  instructorController.updateStudentMarks
);
router.post("/logout", instructorController.logout);

router.delete(
  "/deleteSubmission/:studentId/:examId",
  verifyInstructorToken,
  instructorController.deleteSubmission
);

router.get(
  "/getInstructors",
  verifyToken,
  requireRole("admin"),
  instructorController.getAllInstructors
);
router.put(
  "/updateInstructor/:id",
  verifyToken,
  requireRole("admin"),
  instructorController.updateInstructor
);
router.delete(
  "/deleteInstructor/:id",
  verifyToken,
  requireRole("admin"),
  instructorController.deleteInstructor
);

export default router;

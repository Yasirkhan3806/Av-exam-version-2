import express from "express";
import * as instructorController from "../controllers/instructorController.js";
import { verifyToken, verifyInstructorToken } from "../utils/middleware.js";
import { answerUpload } from "../utils/upload.js";

const router = express.Router();

router.post(
  "/register-instructor",
  verifyToken,
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
  answerUpload.any(),
  instructorController.uploadCheckedPdfs
);
router.put(
  "/updateStudentMarks/:studentId/:examId",
  verifyInstructorToken,
  instructorController.updateStudentMarks
);
router.post("/logout", verifyInstructorToken, instructorController.logout);

router.get(
  "/getInstructors",
  verifyToken,
  instructorController.getAllInstructors
);
router.put(
  "/updateInstructor/:id",
  verifyToken,
  instructorController.updateInstructor
);
router.delete(
  "/deleteInstructor/:id",
  verifyToken,
  instructorController.deleteInstructor
);

export default router;

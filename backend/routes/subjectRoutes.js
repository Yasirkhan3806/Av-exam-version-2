import express from "express";
import * as subjectController from "../controllers/subjectController.js";
import { verifyToken } from "../utils/middleware.js";

const router = express.Router();

router.get("/", subjectController.healthCheck);
router.post("/addSubject", verifyToken, subjectController.addSubject);
router.get("/getAllSubjects", subjectController.getAllSubjects);
router.get("/getSubject/:id", subjectController.getSubjectById);
router.get(
  "/getNotEnrolledStudents/:id",
  verifyToken,
  subjectController.getNotEnrolledStudents
);
router.post("/EnrollStudent/:id", verifyToken, subjectController.enrollStudent);
router.get(
  "/getEnrolledStudents/:id",
  verifyToken,
  subjectController.getEnrolledStudents
);
router.delete(
  "/UnenrollStudent/:id",
  verifyToken,
  subjectController.unenrollStudent
);
router.get(
  "/getEnrolledSubjects/:id",
  verifyToken,
  subjectController.getEnrolledSubjects
);
router.get(
  "/getExamsForSubject/:id",
  verifyToken,
  subjectController.getExamsForSubject
);
router.get("/getResults/:studentId", verifyToken, subjectController.getResults);
router.get(
  "/getStudentAnswers/:studentId/:examId",
  verifyToken,
  subjectController.getStudentAnswers
);
router.get("/grade/:studentId/:subjectId", subjectController.calculateGrade);

export default router;

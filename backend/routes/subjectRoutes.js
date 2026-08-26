import express from "express";
import * as subjectController from "../controllers/subjectController.js";
import { verifyToken, requireRole } from "../utils/middleware.js";

const router = express.Router();

router.get("/", subjectController.healthCheck);
router.post(
  "/addSubject",
  verifyToken,
  requireRole("admin"),
  subjectController.addSubject
);
router.get("/getAllSubjects", subjectController.getAllSubjects);
router.get("/getSubject/:id", subjectController.getSubjectById);
router.get(
  "/getNotEnrolledStudents/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.getNotEnrolledStudents
);
router.post(
  "/EnrollStudent/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.enrollStudent
);
router.get(
  "/getEnrolledStudents/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.getEnrolledStudents
);
router.delete(
  "/UnenrollStudent/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.unenrollStudent
);
router.get(
  "/getEnrolledSubjects/:id",
  verifyToken,
  subjectController.getEnrolledSubjects
);
router.get(
  "/getExamsForSubject/:subjectType/:id",
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
router.put(
  "/updateSubject/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.updateSubject
);
router.delete(
  "/deleteSubject/:id",
  verifyToken,
  requireRole("admin"),
  subjectController.deleteSubject
);

export default router;

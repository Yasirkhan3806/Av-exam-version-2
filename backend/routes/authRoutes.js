import express from "express";
import * as authController from "../controllers/authController.js";
import { verifyToken, requireRole } from "../utils/middleware.js";

const router = express.Router();

router.get("/", authController.healthCheck);
router.post("/register", authController.register);
router.post("/send-welcome-email", authController.sendWelcomeEmailController);
router.post("/login", authController.login);
router.post("/admin-login", authController.adminLogin);
router.get("/verifySession", verifyToken, authController.verifySession);
router.get(
  "/get-instructors",
  verifyToken,
  requireRole("admin"),
  authController.getInstructors
);
router.get(
  "/get-students",
  verifyToken,
  requireRole("admin"),
  authController.getAllStudents
);
router.put(
  "/update-student/:id",
  verifyToken,
  requireRole("admin"),
  authController.updateStudent
);
router.delete(
  "/delete-student/:id",
  verifyToken,
  requireRole("admin"),
  authController.deleteStudent
);
router.post("/logout", authController.logout);

export default router;

import express from "express";
import * as authController from "../controllers/authController.js";
import { verifyToken } from "../utils/middleware.js";

const router = express.Router();

router.get("/", authController.healthCheck);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/admin-login", authController.adminLogin);
router.get("/verifySession", verifyToken, authController.verifySession);
router.get("/get-instructors", verifyToken, authController.getInstructors);
router.post("/logout", authController.logout);

export default router;

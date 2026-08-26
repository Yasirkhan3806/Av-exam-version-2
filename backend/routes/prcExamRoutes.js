import express from "express";
import multer from "multer";
import * as prcExamController from "../controllers/prcExamController.js";
import fs from "fs";
import { verifyToken, requireRole } from "../utils/middleware.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: "uploads/" });

router.post("/create", verifyToken, requireRole("admin"), upload.single("file"), prcExamController.createPRCExam);
router.get("/:id", verifyToken, requireRole("student"), prcExamController.getPRCExamById);
router.post("/:id/submit", verifyToken, requireRole("student"), prcExamController.submitPRCExamResult);
router.post("/submitDetailedResult", verifyToken, requireRole("student"), prcExamController.submitDetailedResult);
router.get("/results/:id", verifyToken, requireRole("student"), prcExamController.getDetailedResult);
router.put("/:id", verifyToken, requireRole("admin"), prcExamController.updatePRCExam);

export default router;

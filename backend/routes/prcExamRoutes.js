import express from "express";
import multer from "multer";
import * as prcExamController from "../controllers/prcExamController.js";
import fs from "fs";
import { verifyToken } from "../utils/middleware.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: "uploads/" });

router.post("/create", upload.single("file"), prcExamController.createPRCExam);
router.get("/:id", prcExamController.getPRCExamById);
router.post("/:id/submit", prcExamController.submitPRCExamResult);
router.post("/submitDetailedResult", prcExamController.submitDetailedResult);
router.get("/results/:id", verifyToken, prcExamController.getDetailedResult);
router.put("/:id", verifyToken, prcExamController.updatePRCExam);

export default router;

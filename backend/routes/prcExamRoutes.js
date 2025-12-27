import express from "express";
import multer from "multer";
import * as prcExamController from "../controllers/prcExamController.js";
import fs from "fs";

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

export default router;

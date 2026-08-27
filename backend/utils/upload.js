/**
 * Utility module for configuring Multer to handle file uploads.
 * Provides separate storage configurations for question PDFs and answer PDFs,
 * ensuring unique filenames to prevent collisions during simultaneous uploads.
 */

import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Storage configuration for uploading question PDFs (e.g., CFAP exams).
 * Generates unique filenames to avoid collisions when multiple files are uploaded together.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `TestQuestions/${req.body.subjectId}/${req.body.name}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

/**
 * Multer middleware instance for question uploads.
 */
export const upload = multer({ storage });

/**
 * Storage configuration for uploading answer PDFs submitted by students.
 */
const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Answer_pdfs/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

/**
 * Multer middleware instance for answer uploads.
 */
export const answerUpload = multer({ storage: answerStorage });

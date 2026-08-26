import express from "express";
import * as onlyofficeExamController from "../controllers/onlyofficeExamController.js";
import { verifyExamToken } from "../utils/middleware.js";
import { verifyDocServerToken } from "../utils/onlyofficeMiddleware.js";

const router = express.Router();

// Real exam's OnlyOffice spreadsheet pane — rough-work scratch space only,
// never graded (see backend/services/onlyofficeExamService.js). Config
// generation is authenticated as the student (verifyExamToken, cookie);
// the document/callback endpoints are authenticated as the Document Server
// itself (verifyDocServerToken, its own signed Authorization header) since
// it has no student session to carry.

/**
 * @route GET /api/onlyoffice/exam/:questionNumber/config
 * @desc Backend-signed DocsAPI.DocEditor config for the current student's exam
 * @access Private (ExamToken)
 */
router.get("/:questionNumber/config", verifyExamToken, onlyofficeExamController.getConfig);

/**
 * @route GET /api/onlyoffice/exam/:examId/:questionNumber/document
 * @desc Serve the current exam document bytes to the Document Server
 * @access Private (Document Server JWT)
 */
router.get(
  "/:examId/:questionNumber/document",
  verifyDocServerToken,
  onlyofficeExamController.getDocument
);

/**
 * @route POST /api/onlyoffice/exam/:examId/:questionNumber/callback
 * @desc OnlyOffice Document Server save-callback
 * @access Private (Document Server JWT)
 */
router.post(
  "/:examId/:questionNumber/callback",
  verifyDocServerToken,
  onlyofficeExamController.handleCallback
);

export default router;

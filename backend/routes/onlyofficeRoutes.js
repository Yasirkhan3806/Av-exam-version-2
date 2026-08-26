import express from "express";
import * as onlyofficeController from "../controllers/onlyofficeController.js";

const router = express.Router();

// Practice Room OnlyOffice embed — STUB, in-memory persistence only, no auth.
// This is deliberately not wired to verifyToken/verifyExamToken: both
// endpoints below are called by the Document Server container itself
// (server-to-server), which has no way to carry a student's session
// cookie/token. Fine for local-only testing; before this goes anywhere
// reachable off the dev machine, these need real protection (e.g. a
// short-lived signed token in the URL, or restricting by source IP to the
// Document Server host, on top of enabling JWT_ENABLED on the Document
// Server itself).

/**
 * @route GET /api/onlyoffice/practice/:baseKey/meta
 * @desc Current saved-version number for a practice document
 */
router.get("/practice/:baseKey/meta", onlyofficeController.getMeta);

/**
 * @route GET /api/onlyoffice/practice/:baseKey/config
 * @desc Backend-signed DocsAPI.DocEditor config (required once the shared
 * Document Server container has JWT_ENABLED=true)
 */
router.get("/practice/:baseKey/config", onlyofficeController.getConfig);

/**
 * @route GET /api/onlyoffice/practice/:baseKey/document
 * @desc Serve the current practice document bytes to the Document Server
 */
router.get("/practice/:baseKey/document", onlyofficeController.getDocument);

/**
 * @route POST /api/onlyoffice/practice/:baseKey/callback
 * @desc OnlyOffice Document Server save-callback
 */
router.post("/practice/:baseKey/callback", onlyofficeController.handleCallback);

export default router;

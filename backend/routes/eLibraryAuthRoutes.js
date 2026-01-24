import express from "express";
import * as eLibraryAuthController from "../controllers/eLibraryAuthController.js";
import { verifyELibraryToken } from "../utils/middleware.js";

const router = express.Router();

// Public routes
router.get("/health", eLibraryAuthController.healthCheck);
router.post("/register", eLibraryAuthController.register);
router.post("/login", eLibraryAuthController.login);
router.post("/logout", eLibraryAuthController.logout);

// Protected routes
router.get(
  "/verify",
  verifyELibraryToken,
  eLibraryAuthController.verifySession,
);
router.get("/profile", verifyELibraryToken, eLibraryAuthController.getProfile);

// Admin routes (using generic verifyToken assuming it validates admins)
// Ideally this should use verifyToken (or create an admin specific one if needed)
import { verifyToken } from "../utils/middleware.js";
router.get("/all-users", verifyToken, eLibraryAuthController.getAllUsers);
router.delete("/delete/:id", verifyToken, eLibraryAuthController.deleteUser);

export default router;

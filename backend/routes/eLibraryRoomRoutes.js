import express from "express";
import * as eLibraryRoomController from "../controllers/eLibraryRoomController.js";
import { verifyELibraryToken } from "../utils/middleware.js";

const router = express.Router();

// All routes here are protected
router.use(verifyELibraryToken);

router.post("/heartbeat", eLibraryRoomController.heartbeat);
router.get("/counts", eLibraryRoomController.getCounts);
router.post("/leave", eLibraryRoomController.leaveRoom);

export default router;

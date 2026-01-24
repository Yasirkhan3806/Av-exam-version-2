import * as eLibraryRoomService from "../services/eLibraryRoomService.js";

export const heartbeat = async (req, res) => {
  try {
    const userId = req.eLibraryUser.userId;
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: "Room name is required" });
    }

    await eLibraryRoomService.updateHeartbeat(userId, roomName);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getCounts = async (req, res) => {
  try {
    const counts = await eLibraryRoomService.getRoomCounts();
    return res.status(200).json({ success: true, counts });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const userId = req.eLibraryUser.userId;
    const { roomName } = req.body; // Optional, if they want to leave a specific room

    await eLibraryRoomService.removeSession(userId, roomName);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

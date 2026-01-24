import { ELibrarySession } from "../models/ELibrarySession.js";

export const updateHeartbeat = async (userId, roomName) => {
  return await ELibrarySession.findOneAndUpdate(
    { userId, roomName },
    {
      lastHeartbeat: new Date(),
      userId, // Ensure these are set on upsert
      roomName,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

export const getRoomCounts = async () => {
  // Aggregate active sessions (those within the last 30 seconds)
  // Although TTL helps, we can filter for tighter accuracy
  const threshold = new Date(Date.now() - 30 * 1000);

  const counts = await ELibrarySession.aggregate([
    {
      $match: {
        lastHeartbeat: { $gte: threshold },
      },
    },
    {
      $group: {
        _id: "$roomName",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert array to object map: { "RoomName": 5, ... }
  const countMap = {};
  counts.forEach((item) => {
    countMap[item._id] = item.count;
  });

  return countMap;
};

export const removeSession = async (userId, roomName) => {
  if (roomName) {
    return await ELibrarySession.findOneAndDelete({ userId, roomName });
  } else {
    // If no room specified, remove all sessions for this user (cleanup)
    return await ELibrarySession.deleteMany({ userId });
  }
};

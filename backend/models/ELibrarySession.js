import mongoose from "mongoose";

const eLibrarySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ELibraryUser",
      required: true,
    },
    roomName: { type: String, required: true },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  {
    collection: "ELibrary_Sessions",
    timestamps: true,
  },
);

// TTL Index: expire documents 60 seconds after lastHeartbeat
eLibrarySessionSchema.index({ lastHeartbeat: 1 }, { expireAfterSeconds: 60 });

// Compound index for efficient lookups
eLibrarySessionSchema.index({ userId: 1, roomName: 1 });

export const ELibrarySession = mongoose.model(
  "ELibrarySession",
  eLibrarySessionSchema,
);

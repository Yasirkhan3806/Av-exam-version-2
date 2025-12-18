import mongoose from "mongoose";

const testUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    subjectsEnrolled: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Subject",
      default: [],
    },
  },
  {
    collection: "Test_User_Data",
  }
);

export const TestUser = mongoose.model("TestUser", testUserSchema);

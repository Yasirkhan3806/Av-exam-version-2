import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Instructor, Subject, TestUser } from "./schema.js";
import { generateTokenAndSetCookie, verifyInstructorToken ,verifyToken} from "./middleware.js";

const router = express.Router();

router.post('/register-instructor', verifyToken, async (req, res) => {
  try {
    const { name, userName, courses, password } = req.body;
    if (!name || !userName || !courses || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingInstructor = await Instructor.findOne({ userName });
    if (existingInstructor) {
      return res.status(400).json({ message: "Instructor with this username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newInstructor = new Instructor({ name, userName, courses, password: hashedPassword });
    await newInstructor.save();

    return res.status(201).json({
      message: "Instructor registered successfully",
      success: true,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get('/get-instructors', verifyInstructorToken, async (req, res) => {
  try {
    const instructors = await Instructor.find({}, 'doc_id name userName courses');
    return res.status(200).json({
      message: "✅ Instructors fetched successfully",
      success: true,
      instructors,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.post('/instructor-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const instructor = await Instructor.findOne({ userName: username });
    if (!instructor) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const isMatch = await bcrypt.compare(password, instructor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // Set cookie with JWT
    generateTokenAndSetCookie(instructor, res, 'instructorToken');
    return res.status(200).json({
      message: "✅ Instructor logged in successfully",
      success: true,
      instructor: { id: instructor._id, name: instructor.name, userName: instructor.userName, courses: instructor.courses },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get("/getAllSubjects/:instructorId", verifyInstructorToken, async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }

    // Use aggregation to join Subject with TestUserData
    const subjects = await Subject.aggregate([
      // 1️⃣ Match subjects taught by the instructor
      { $match: { instructor: new mongoose.Types.ObjectId(instructorId) } },

      // 2️⃣ Lookup users that have this subject ID in their 'subjects' array
      {
        $lookup: {
          from: "Test_User_Data", // collection name (plural, lowercase!)
          localField: "_id",
          foreignField: "subjectsEnrolled",
          as: "enrolledStudents",
        },
      },

      // 3️⃣ Add a field with the count of enrolled students
      {
        $addFields: {
          studentCount: { $size: "$enrolledStudents" },
        },
      },

      // 4️⃣ Optionally, you can hide the 'enrolledStudents' array if you just need the count
      {
        $project: {
          enrolledStudents: 0,
        },
      },
    ]);

    return res.status(200).json({
      message: "✅ Subjects fetched successfully",
      success: true,
      subjects,
    });
  } catch (e) {
    console.error("❌ Error fetching subjects:", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get("/verifyInstructorSession", verifyInstructorToken, (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    instructor: req.instructor,
  });
});

export default router;

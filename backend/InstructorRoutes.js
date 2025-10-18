import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Instructor, Subject, TestUser, Questions, Answer } from "./schema.js";
import { generateTokenAndSetCookie, verifyInstructorToken, verifyToken } from "./middleware.js";

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

router.get("/getExamsBySubject/:subjectId", verifyInstructorToken, async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subject ID" });
    }

    // 1️⃣ Fetch subject info
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 2️⃣ Count total students enrolled in this subject
    const totalStudents = await TestUser.countDocuments({ subjectsEnrolled: subjectId });

    // 3️⃣ Fetch all exams/questions for this subject
    const exams = await Questions.find({ subject: subjectId }).sort({ createdAt: -1 });

    // 4️⃣ For each exam, count submissions from Answers collection
    const results = await Promise.all(
      exams.map(async (exam) => {
        const submittedCount = await Answer.countDocuments({ questionSet: exam._id });

        // Compute submission %
        const percent =
          totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

        return {
          id: exam._id,
          title: exam.name,
          subject: subject.name,
          status: exam.mockExam ? "mock" : "draft", // customize if you have real statuses
          date: exam.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          duration: `${exam.totalAttempt} minutes`, // customize based on real logic
          submissions: `${submittedCount}/${totalStudents} submitted (${percent}%)`,
          progress: percent,
          questions: `${exam.totalQuestions} questions`,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "✅ Exams fetched successfully",
      exams: results,
    });
  } catch (error) {
    console.error("❌ Error fetching exams:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/getSubmissions/:questionId", verifyInstructorToken, async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    // 1️⃣ Fetch the question details
    const question = await Questions.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const totalQuestions = question.totalQuestions;

    // 2️⃣ Fetch all submissions for this question
    const submissions = await Answer.find({ questionSet: questionId })
      .populate("Student", "_id name email") // from TestUser
      .sort({ createdAt: -1 });

    if (!submissions.length) {
      return res.status(200).json({
        success: true,
        message: "No submissions found for this question",
        submissions: [],
      });
    }

    // 3️⃣ Map and format response
    const formatted = submissions.map((sub, index) => {
      const student = sub.Student || {};
      const answeredCount = sub.answers ? sub.answers.size : 0;

      return {
        id: student._id || `unknown-${index}`,
        name: student.name || "Unknown Student",
        email: student.email || "N/A",
        status: sub.checked ? "checked" : "submitted",
        submittedAt: sub.createdAt
          ? new Date(sub.createdAt).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "N/A",
        answered: `${answeredCount}/${totalQuestions} answered`,
        progress: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: "✅ Submissions fetched successfully",
      total: formatted.length,
      submissions: formatted,
    });
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

router.get("/getExam/:examId", verifyInstructorToken, async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    const exam = await Questions.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    return res.status(200).json({
      success: true, 
      message: "✅ Exam fetched successfully",
      exam
    });

  } catch (error) {
    console.error("❌ Error fetching exam:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get("/getStudentAnswers/:studentId/:examId", verifyInstructorToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid student ID or exam ID" });
    }

    const answers = await Answer.findOne({
      Student: studentId,
      questionSet: examId
    })

    if (!answers) {
      return res.status(404).json({ 
        success: false,
        message: "No answers found for this student and exam" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Student answers fetched successfully",
      answers
    });

  } catch (error) {
    console.error("❌ Error fetching student answers:", error);
    return res.status(500).json({
      success: false, 
      message: "Server error",
      error: error.message
    });
  }
});


router.put("/updateStudentMarks/:studentId/:examId", verifyInstructorToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { marksObtained,status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid student ID or exam ID" });
    }

    const updatedAnswer = await Answer.findOneAndUpdate(
      { Student: studentId, questionSet: examId },
      { 
        marksObtained,
        status,
        checkedAt: new Date()
      },
      { new: true }
    );

    if (!updatedAnswer) {
      return res.status(404).json({
        success: false,
        message: "No answer document found for this student and exam"
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Student marks updated successfully",
      updatedAnswer
    });

  } catch (error) {
    console.error("❌ Error updating student marks:", error);
    return res.status(500).json({
      success: false,
      message: "Server error", 
      error: error.message
    });
  }
});

export default router;


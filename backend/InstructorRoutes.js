import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Instructor,Subject,TestUser,Questions,Answer} from "./schema.js";
import { generateTokenAndSetCookie, verifyToken } from "./middleware.js";

const router = express.Router();

router.post('/register-instructor',verifyToken, async (req, res) => {
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

router.get('/get-instructors', verifyToken, async (req, res) => {
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

/**
 * GET /api/instructor/dashboard/:instructorId
 * Fetches all examination data for instructor dashboard
 */


router.get('/getAllSubjects/:instructorId', verifyToken, async (req, res) => {
  try {
    const { instructorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }

    const subjects = await Subject.find({ instructor: instructorId });
    return res.status(200).json({
      message: "✅ Subjects fetched successfully",
        success: true,
        subjects,
    });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Server error", error: e.message });
    }
});
// router.get('/dashboard/:instructorId', async (req, res) => {
//   try {
//     const { instructorId } = req.params;

//     // Validate instructor ID
//     if (!mongoose.Types.ObjectId.isValid(instructorId)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid instructor ID' 
//       });
//     }

//     // Find instructor
//     const instructor = await Instructor.findById(instructorId);
//     if (!instructor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Instructor not found' 
//       });
//     }

//     // Find all subjects taught by this instructor
//     const subjects = await Subject.find({ instructor: instructorId });
//     const subjectIds = subjects.map(s => s._id);

//     // Find all question sets (exams) for these subjects
//     const questionSets = await Questions.find({ 
//       subject: { $in: subjectIds } 
//     }).populate('subject', 'name');

//     // Build dashboard data for each exam
//     const dashboardData = await Promise.all(
//       questionSets.map(async (exam) => {
//         // Count total students enrolled in this subject
//         const totalStudents = await TestUser.countDocuments({
//           subjectsEnrolled: exam.subject._id
//         });

//         // Count submissions for this exam
//         const submissionsCount = await Answer.countDocuments({
//           questionSet: exam._id
//         });

//         // Calculate submission percentage
//         const submissionPercentage = totalStudents > 0 
//           ? Math.round((submissionsCount / totalStudents) * 100) 
//           : 0;

//         // Determine status based on current date and exam attempts
//         const isCompleted = submissionsCount >= totalStudents || 
//                            (exam.totalAttempt > 0 && submissionsCount > 0);
        
//         const status = isCompleted ? 'completed' : 'active';

//         return {
//           id: exam._id,
//           title: exam.name,
//           subject: exam.subject?.name || 'N/A',
//           status: status,
//           date: exam.createdAt.toLocaleDateString('en-US', { 
//             year: 'numeric', 
//             month: 'long', 
//             day: 'numeric' 
//           }),
//           duration: `${exam.totalAttempt} attempt${exam.totalAttempt > 1 ? 's' : ''}`,
//           submissions: `${submissionsCount}/${totalStudents} submitted (${submissionPercentage}%)`,
//           questions: `${exam.totalQuestions} question${exam.totalQuestions > 1 ? 's' : ''}`,
//           progress: submissionPercentage,
//           totalMarks: exam.totalMarks,
//           description: exam.description,
//           mockExam: exam.mockExam,
//           pdfName: exam.pdfName
//         };
//       })
//     );

//     // Sort by date (most recent first)
//     dashboardData.sort((a, b) => new Date(b.date) - new Date(a.date));

//     return res.status(200).json({
//       success: true,
//       instructor: {
//         id: instructor._id,
//         name: instructor.name,
//         userName: instructor.userName,
//         courses: instructor.courses
//       },
//       totalExams: dashboardData.length,
//       Subjects: dashboardData
//     });

//   } catch (error) {
//     console.error('Error fetching instructor dashboard:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// });


export default router;

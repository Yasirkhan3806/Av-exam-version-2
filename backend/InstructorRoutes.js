import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { Instructor, Subject, TestUser, Questions, Answer } from "./schema.js";
import { generateTokenAndSetCookie, verifyInstructorToken, verifyToken, answerUpload } from "./middleware.js";

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
        status: sub.status ? sub.status : "submitted",
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
        score: sub.marksObtained ? sub.marksObtained : 'Not graded',
        checkedAt: sub.checkedAt ? new Date(sub.checkedAt).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }) : 'Not Checked',
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

async function generatePDF(html, fileName) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Wrap your HTML to ensure it has a full document structure
    const wrappedHTML = `
      <html>
        <head>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    await page.setContent(wrappedHTML, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    const pdfDir = path.resolve("Answer_pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

    const pdfPath = path.join(pdfDir, `${fileName}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    await browser.close();
    return path.join("Answer_pdfs", `${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}

// 🧩 Main route — Fetch answers, generate PDFs, and update marksObtained per question
router.get("/getStudentAnswers/:studentId/:examId", verifyInstructorToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // 🧩 Validate IDs
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid student ID or exam ID" });
    }

    // 🧠 Fetch student answers
    const answersDoc = await Answer.findOne({
      Student: studentId,
      questionSet: examId,
    });

    if (!answersDoc) {
      return res.status(404).json({
        success: false,
        message: "No answers found for this student and exam",
      });
    }

    // ✅ Ensure marksObtained exists
    if (!answersDoc.marksObtained || typeof answersDoc.marksObtained !== "object") {
      answersDoc.marksObtained = {};
    }

    // ✅ Generate PDFs only for unanswered (missing) pdfUrls
    for (const [questionKey, answerHTML] of answersDoc.answers.entries()) {
      // Initialize the marks entry if missing
      if (!answersDoc.marksObtained[questionKey]) {
        answersDoc.marksObtained[questionKey] = {
          marks: 0,
          checked: false,
          pdfUrl: "",
        };
      }

      // Skip if pdf already exists
      const existingPdfUrl = answersDoc.marksObtained[questionKey].pdfUrl;
      if (existingPdfUrl && existingPdfUrl.trim() !== "") {
        console.log(`📄 Skipping ${questionKey}: already has PDF -> ${existingPdfUrl}`);
        continue;
      }

      // Generate new PDF if missing
      const fileName = `${studentId}_${examId}_${questionKey}`;
      const pdfPath = await generatePDF(answerHTML, fileName);

      answersDoc.marksObtained[questionKey].pdfUrl = pdfPath;
    }

    // ✅ Save updated document
    await answersDoc.save();

    return res.status(200).json({
      success: true,
      message: "✅ Student answers fetched (new PDFs created only where missing)",
      answers: answersDoc,
    });

  } catch (error) {
    console.error("❌ Error fetching student answers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});



router.post("/uploadCheckedPdfs", answerUpload.any(), async (req, res) => {
  try {
    const { marksObtained } = JSON.parse(req.body.data); 
    // body.data should contain the current marksObtained object from your frontend

    const updatedMarks = { ...marksObtained };

    // 🔄 Iterate over each uploaded file
    req.files.forEach((file) => {
      const questionKey = file.fieldname; // e.g. q1, q2
      const newPath = file.path; // e.g. uploads/q1-123456789.pdf

      // 🗑️ Delete old file if it exists
      const oldPath = updatedMarks[questionKey]?.pdfUrl;
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      // 🔁 Replace old path with new one
      updatedMarks[questionKey] = {
        ...updatedMarks[questionKey],
        pdfUrl: newPath,
        checked: true,
      };
    });

    // TODO: Save updatedMarks back to DB if needed here
    res.json({
      message: "✅ Checked PDFs uploaded and old ones replaced successfully",
      updatedMarks,
    });
  } catch (error) {
    console.error("❌ Error in uploadCheckedPdfs:", error);
    res.status(500).json({ error: "Failed to process files" });
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



// router.post("/generate-pdf", async (req, res) => {
//   try {
//     const { html } = req.body;
//     if (!html) {
//       return res.status(400).json({ error: "HTML content is required" });
//     }

//     const pdfBuffer = await generatePDF(html);

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": "inline; filename=answer.pdf",
//     });
//     res.send(pdfBuffer);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to generate PDF" });
//   }
// });

router.post('/logout', verifyInstructorToken, (req, res) => {
  try {
    res.clearCookie('instructorToken');
    return res.status(200).json({
      success: true,
      message: "✅ Instructor logged out successfully"
    });
  } catch (error) {
    console.error("❌ Error logging out:", error);
    return res.status(500).json({
      success: false, 
      message: "Server error",
      error: error.message
    });
  }
});

export default router;


import bcrypt from "bcrypt";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { Instructor, Subject, TestUser, Questions } from "../models/index.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";
import { getGradableExamModel, getAnswerModel } from "../utils/examTypeResolver.js";
import { AppError } from "../utils/AppError.js";

export const registerInstructor = async (name, userName, courses, password) => {
  if (!name || !userName || !courses || !password) {
    throw new AppError("All fields are required", 400);
  }

  const existingInstructor = await Instructor.findOne({ userName });
  if (existingInstructor) {
    throw new AppError("Instructor with this username already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newInstructor = new Instructor({
    name,
    userName,
    courses,
    password: hashedPassword,
  });
  await newInstructor.save();

  return newInstructor;
};

export const loginInstructor = async (username, password) => {
  if (!username || !password) {
    throw new AppError("Username and password are required", 400);
  }

  const instructor = await Instructor.findOne({ userName: username });
  if (!instructor) {
    throw new AppError("Invalid username or password", 401);
  }

  const isMatch = await bcrypt.compare(password, instructor.password);
  if (!isMatch) {
    throw new AppError("Invalid username or password", 401);
  }

  return instructor;
};

export const getAllSubjectsByInstructor = async (instructorId) => {
  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    throw new AppError("Invalid instructor ID", 400);
  }

  const subjects = await Subject.aggregate([
    { $match: { instructor: new mongoose.Types.ObjectId(instructorId) } },
    {
      $lookup: {
        from: "Test_User_Data",
        localField: "_id",
        foreignField: "subjectsEnrolled",
        as: "enrolledStudents",
      },
    },
    {
      $addFields: {
        studentCount: { $size: "$enrolledStudents" },
      },
    },
    {
      $project: {
        enrolledStudents: 0,
      },
    },
  ]);

  return subjects;
};

export const getExamsBySubject = async (subjectId, subjectType) => {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new AppError("Invalid subject ID", 400);
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  const totalStudents = await TestUser.countDocuments({
    subjectsEnrolled: subjectId,
  });

  const ExamModel = getGradableExamModel(subjectType);
  const AnswerModel = getAnswerModel(subjectType);
  const exams = await ExamModel.find({ subject: subjectId }).sort({
    createdAt: -1,
  });

  const results = await Promise.all(
    exams.map(async (exam) => {
      const submittedCount = await AnswerModel.countDocuments({
        questionSet: exam._id,
      });
      const percent =
        totalStudents > 0
          ? Math.round((submittedCount / totalStudents) * 100)
          : 0;

      return {
        id: exam._id,
        title: exam.name,
        subject: subject.name,
        status: exam.mockExam ? "mock" : "draft",
        date: exam.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        duration: exam.totalAttempt ? `${exam.totalAttempt} minutes` : "N/A",
        submissions: `${submittedCount}/${totalStudents} submitted (${percent}%)`,
        progress: percent,
        questions: `${exam.totalQuestions} questions`,
      };
    })
  );

  return results;
};

export const getSubmissionsByQuestion = async (questionId, subjectType) => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new AppError("Invalid question ID", 400);
  }

  const ExamModel = getGradableExamModel(subjectType);
  const AnswerModel = getAnswerModel(subjectType);
  const question = await ExamModel.findById(questionId);

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  const totalQuestions = question.totalQuestions;
  const submissions = await AnswerModel.find({ questionSet: questionId })
    .populate("Student", "_id name email")
    .sort({ createdAt: -1 });

  if (!submissions.length) {
    return [];
  }


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
      answered: subjectType === 'CAF'?`${totalQuestions}/${totalQuestions} answered`: `${answeredCount}/${totalQuestions} answered`,
      progress:
        totalQuestions > 0
          ? Math.round((answeredCount / totalQuestions) * 100)
          : 0,
      score:
        sub.marksObtained && typeof sub.marksObtained == "object"
          ? sub.marksObtained
          : "Not graded",
      cafMarks: subjectType === "CAF" ? sub.marksObtained : null,
      checkedAt: sub.checkedAt
        ? new Date(sub.checkedAt).toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "Not Checked",
    };
  });

  return formatted;
};

export const getExamById = async (examId) => {
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    throw new AppError("Invalid exam ID", 400);
  }

  const exam = await Questions.findById(examId);
  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  return exam;
};

export const generatePDF = async (html, fileName) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

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

    return path.join("Answer_pdfs", `${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const getStudentAnswers = async (studentId, examId, subjectType) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new AppError("Invalid student ID or exam ID", 400);
  }

  const AnswerModel = getAnswerModel(subjectType);

  const answersDoc = await AnswerModel.findOne({
    Student: studentId,
    questionSet: examId,
  });

  if (!answersDoc) {
    throw new AppError("No answers found for this student and exam", 404);
  }

  if (
    !answersDoc.marksObtained ||
    typeof answersDoc.marksObtained !== "object"
  ) {
    answersDoc.marksObtained = {};
  }

  for (const [questionKey, answerHTML] of answersDoc.answers.entries()) {
    if (!answersDoc.marksObtained[questionKey]) {
      answersDoc.marksObtained[questionKey] = {
        marks: 0,
        checked: false,
        pdfUrl: "",
      };
    }

    const existingPdfUrl = answersDoc.marksObtained[questionKey].pdfUrl;
    if (existingPdfUrl && existingPdfUrl.trim() !== "") {
      continue;
    }

    const fileName = `${studentId}_${examId}_${questionKey}`;
    const pdfPath = await generatePDF(answerHTML, fileName);
    answersDoc.marksObtained[questionKey].pdfUrl = pdfPath;
  }

  await answersDoc.save();
  return answersDoc;
};

/**
 * Processes uploaded files from the instructor's exam review.
 * Handles both checked PDFs (fieldname: q1, q2, etc.) and
 * suggested solution PDFs (fieldname: suggested_q1, suggested_q2, etc.).
 * Replaces old PDFs on disk and updates the marksObtained map accordingly.
 *
 * @param {Array} files - Array of multer file objects
 * @param {Object} marksObtained - The current marksObtained map from the Answer document
 * @returns {Object} Updated marksObtained map with new file paths
 */
export const uploadCheckedPdfs = async (files, marksObtained) => {
  const updatedMarks = { ...marksObtained };

  files.forEach((file) => {
    const fieldname = file.fieldname;
    const newPath = file.path;

    // Handle suggested solution files (prefixed with 'suggested_')
    if (fieldname.startsWith("suggested_")) {
      const questionKey = fieldname.replace("suggested_", "");

      // Delete old suggested solution file if it exists
      const oldSuggestedPath = updatedMarks[questionKey]?.suggestedSolutionUrl;
      if (oldSuggestedPath && fs.existsSync(oldSuggestedPath)) {
        fs.unlinkSync(oldSuggestedPath);
      }

      updatedMarks[questionKey] = {
        ...updatedMarks[questionKey],
        suggestedSolutionUrl: newPath,
      };
      return;
    }

    // Handle checked PDF files (existing logic)
    const questionKey = fieldname;

    const oldPath = updatedMarks[questionKey]?.pdfUrl;
    if (oldPath && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    updatedMarks[questionKey] = {
      ...updatedMarks[questionKey],
      pdfUrl: newPath,
      checked: true,
    };
  });

  return updatedMarks;
};

export const updateStudentMarks = async (
  studentId,
  examId,
  marksObtained,
  status,
  subjectType
) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new AppError("Invalid student ID or exam ID", 400);
  }

  const AnswerModel = getAnswerModel(subjectType);

  const updatedAnswer = await AnswerModel.findOneAndUpdate(
    { Student: studentId, questionSet: examId },
    {
      marksObtained,
      status,
      checkedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedAnswer) {
    throw new AppError("No answer document found for this student and exam", 404);
  }

  return updatedAnswer;
};

export const getAllInstructors = async () => {
  return await Instructor.find({}).select("-password");
};

export const updateInstructor = async (id, updateData) => {
  if (updateData.userName) {
    const existing = await Instructor.findOne({
      userName: updateData.userName,
      _id: { $ne: id },
    });
    if (existing) {
      throw new AppError("Username already taken", 400);
    }
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  const updatedInstructor = await Instructor.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedInstructor) {
    throw new AppError("Instructor not found", 404);
  }

  return updatedInstructor;
};

export const deleteInstructor = async (id) => {
  const result = await Instructor.findByIdAndDelete(id);
  if (!result) {
    throw new AppError("Instructor not found", 404);
  }
  return result;
};

export const deleteSubmission = async (studentId, examId, subjectType) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new AppError("Invalid student ID or exam ID", 400);
  }

  const AnswerModel = getAnswerModel(subjectType);

  const result = await AnswerModel.findOneAndDelete({
    Student: studentId,
    questionSet: examId,
  });

  if (!result) {
    throw new AppError("Submission not found", 404);
  }

  return result;
};

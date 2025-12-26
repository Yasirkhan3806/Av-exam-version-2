import bcrypt from "bcrypt";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import {
  Instructor,
  Subject,
  TestUser,
  Questions,
  Answer,
  CafExamQuestions,
  CafExamAnswer,
} from "../models/index.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";

export const registerInstructor = async (name, userName, courses, password) => {
  if (!name || !userName || !courses || !password) {
    throw new Error("All fields are required");
  }

  const existingInstructor = await Instructor.findOne({ userName });
  if (existingInstructor) {
    throw new Error("Instructor with this username already exists");
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
    throw new Error("Username and password are required");
  }

  const instructor = await Instructor.findOne({ userName: username });
  if (!instructor) {
    throw new Error("Invalid username or password");
  }

  const isMatch = await bcrypt.compare(password, instructor.password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  return instructor;
};

export const getAllSubjectsByInstructor = async (instructorId) => {
  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    throw new Error("Invalid instructor ID");
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
    throw new Error("Invalid subject ID");
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new Error("Subject not found");
  }

  const totalStudents = await TestUser.countDocuments({
    subjectsEnrolled: subjectId,
  });

  let exams = [];
  let AnswerModel = Answer;

  if (subjectType === "CAF") {
    exams = await CafExamQuestions.find({ subject: subjectId }).sort({
      createdAt: -1,
    });
    AnswerModel = CafExamAnswer;
  } else {
    exams = await Questions.find({ subject: subjectId }).sort({
      createdAt: -1,
    });
  }

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
    throw new Error("Invalid question ID");
  }

  let question;
  let AnswerModel = Answer; // Default

  if (subjectType === "CAF") {
    question = await CafExamQuestions.findById(questionId);
    AnswerModel = CafExamAnswer;
  } else {
    question = await Questions.findById(questionId);
  }

  if (!question) {
    throw new Error("Question not found");
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
      answered: `${answeredCount}/${totalQuestions} answered`,
      progress:
        totalQuestions > 0
          ? Math.round((answeredCount / totalQuestions) * 100)
          : 0,
      score:
        sub.marksObtained && typeof sub.marksObtained !== "object"
          ? sub.marksObtained
          : "Not graded",
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
    throw new Error("Invalid exam ID");
  }

  const exam = await Questions.findById(examId);
  if (!exam) {
    throw new Error("Exam not found");
  }

  return exam;
};

export const generatePDF = async (html, fileName) => {
  try {
    const browser = await puppeteer.launch({
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

    await browser.close();
    return path.join("Answer_pdfs", `${fileName}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
};

export const getStudentAnswers = async (studentId, examId, subjectType) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new Error("Invalid student ID or exam ID");
  }

  let AnswerModel = Answer;
  if (subjectType === "CAF") {
    AnswerModel = CafExamAnswer;
  }

  const answersDoc = await AnswerModel.findOne({
    Student: studentId,
    questionSet: examId,
  });

  if (!answersDoc) {
    throw new Error("No answers found for this student and exam");
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
      console.log(
        `📄 Skipping ${questionKey}: already has PDF -> ${existingPdfUrl}`
      );
      continue;
    }

    const fileName = `${studentId}_${examId}_${questionKey}`;
    const pdfPath = await generatePDF(answerHTML, fileName);
    answersDoc.marksObtained[questionKey].pdfUrl = pdfPath;
  }

  await answersDoc.save();
  return answersDoc;
};

export const uploadCheckedPdfs = async (files, marksObtained) => {
  const updatedMarks = { ...marksObtained };

  files.forEach((file) => {
    const questionKey = file.fieldname;
    const newPath = file.path;

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
    throw new Error("Invalid student ID or exam ID");
  }

  let AnswerModel = Answer;
  if (subjectType === "CAF") {
    AnswerModel = CafExamAnswer;
  }

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
    throw new Error("No answer document found for this student and exam");
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
      throw new Error("Username already taken");
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
    throw new Error("Instructor not found");
  }

  return updatedInstructor;
};

export const deleteInstructor = async (id) => {
  const result = await Instructor.findByIdAndDelete(id);
  if (!result) {
    throw new Error("Instructor not found");
  }
  return result;
};

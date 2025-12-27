import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import {
  Questions,
  Answer,
  CafExamQuestions,
  PRCExam,
} from "../models/index.js";
import { JWT_SECRET } from "../utils/middleware.js";

/**
 * Splits a PDF into individual pages and saves them.
 * @param {string} inputPath - Path to the input PDF file.
 * @param {string} originalName - Original name of the PDF file.
 * @param {string} name - Name of the exam/question set.
 * @param {string} subjectId - ID of the subject.
 * @returns {Promise<Object>} - Object mapping page numbers to file paths.
 */
export const splitPDF = async (inputPath, originalName, name, subjectId) => {
  try {
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const baseName = path.parse(originalName).name;
    const pagesData = {};

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(page);

      const pageFileName = `${baseName}_page_${i + 1}.pdf`;
      const pageFilePath = path.join(
        `TestQuestions/${subjectId}/${name}`,
        pageFileName
      );
      const pdfBytes = await newPdf.save();

      await fs.writeFile(pageFilePath, pdfBytes);
      pagesData[
        `q${i + 1}`
      ] = `TestQuestions/${subjectId}/${name}/${pageFileName}`;
    }

    await fs.unlink(inputPath);
    return pagesData;
  } catch (error) {
    console.error("Error splitting PDF:", error);
    throw error;
  }
};

/**
 * Adds new standard questions to the database.
 * @param {Object} questionData - Data for the questions (name, desc, etc.).
 * @param {Object} file - Uploaded PDF file object.
 * @returns {Promise<Object>} - The saved question dataset.
 */
export const addQuestions = async (questionData, file) => {
  const {
    name,
    description,
    totalAttempt,
    numQuestions,
    subjectId,
    mockExam,
    totalMarks,
  } = questionData;

  if (!name || !totalAttempt || !numQuestions || !file || !subjectId) {
    throw new Error("All fields are required");
  }

  if (!file) {
    throw new Error("No PDF file uploaded");
  }

  const pagesData = await splitPDF(
    file.path,
    file.originalname,
    name,
    subjectId
  );

  const dataset = new Questions({
    name,
    description,
    totalAttempt,
    totalQuestions: numQuestions,
    pdfName: file.originalname,
    pagesData,
    subject: subjectId,
    mockExam,
    totalMarks,
  });

  await dataset.save();
  return dataset;
};

/**
 * Retrieves questions based on subject ID and type.
 * @param {string} subjectId - The ID of the subject.
 * @param {string} subjectType - The type of subject (CAF, PRC, etc.).
 * @returns {Promise<Array>} - List of questions.
 */
export const getQuestionsBySubject = async (subjectId, subjectType) => {
  if (!subjectId) {
    throw new Error("subjectId is required");
  }
  if (!subjectType) {
    throw new Error("subjectType is required");
  }

  let questions = [];
  if (subjectType === "CAF") {
    questions = await CafExamQuestions.find({ subject: subjectId });
  } else if (subjectType === "PRC") {
    questions = await PRCExam.find({ subject: subjectId });
  } else {
    questions = await Questions.find({ subject: subjectId });
  }
  return questions;
};

/**
 * Get a specific question by ID based on type (CAF or Standard).
 * @param {string} id - The ID of the question/exam.
 * @param {string} subjectType - The type of subject (CAF or empty for Standard).
 * @returns {Promise<Object>} - The question object or formatted data.
 */
export const getQuestionById = async (id, subjectType) => {
  let question;
  if (subjectType === "CAF") {
    // Determine which collection to query
    question = await CafExamQuestions.findById(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return question;
  } else {
    // Default to Standard Questions
    question = await Questions.findById(id);
    if (!question) {
      throw new Error("Question not found");
    }
    // Return formatted object for frontend
    return {
      questionsObj: question.pagesData,
      time: question.totalAttempt,
      name: question.name,
      docId: question._id,
    };
  }
};

/**
 * Get full exam details by ID (searches both collections).
 * @param {string} id - The ID of the exam.
 * @returns {Promise<Object>} - The exam document.
 */
export const getFullQuestionById = async (id) => {
  // Try Standard Questions first
  let exam = await Questions.findById(id);
  if (!exam) {
    // Fallback to CAF Questions
    exam = await CafExamQuestions.findById(id);
  }
  if (!exam) {
    throw new Error("Exam not found");
  }
  return exam;
};

/**
 * Delete a question by ID and Type.
 * @param {string} id - ID of question to delete.
 * @param {string} subjectType - Type of subject
 * @returns {Promise<Object>} - The deleted document.
 */
export const deleteQuestion = async (id, subjectType) => {
  console.log(id, subjectType)
  let question;
  if (subjectType === "CAF") {
    question = await CafExamQuestions.findByIdAndDelete(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return question;
  } else if (subjectType === "PRC") {
    question = await PRCExam.findByIdAndDelete(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return question;
  } else {
    question = await Questions.findByIdAndDelete(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return question;
  }
};

/**
 * Submit answers to a running exam session.
 * @param {string} examId - ID of the answer document.
 * @param {Object} answers - Student's answers.
 * @returns {Promise<Object>} - Updated answer document.
 */
export const submitAnswers = async (examId, answers) => {
  if (!answers) {
    throw new Error("Answers are required");
  }

  const updatedDoc = await Answer.findByIdAndUpdate(
    examId,
    { answers },
    { new: true }
  );

  if (!updatedDoc) {
    throw new Error("No existing answers to update");
  }

  return updatedDoc;
};

/**
 * Start a new exam session by creating an Answer document.
 * @param {string} questionSet - ID of the question set/exam.
 * @param {string} studentId - ID of the student.
 * @returns {Promise<Object>} - Object containing answerDoc and JWT token.
 */
export const startExam = async (questionSet, studentId) => {
  if (!questionSet) {
    throw new Error("questionSet is required");
  }

  // Create initial answer record
  const answerDoc = new Answer({
    answers: {},
    questionSet,
    Student: studentId,
  });
  await answerDoc.save();

  // Generate signed exam token
  const examPayload = {
    userId: studentId,
    ExamId: answerDoc._id,
  };

  const examToken = jwt.sign(examPayload, JWT_SECRET, { expiresIn: "10h" });

  return { answerDoc, examToken };
};

/**
 * Add CAF Questions (without splitting PDF).
 * @param {Object} questionData - Metadata for the exam.
 * @param {Object} file - Uploaded PDF file.
 * @returns {Promise<Object>} - Saved CAF question document.
 */
export const addCafQuestions = async (questionData, file) => {
  const { name, description, numQuestions, subjectId, mockExam, totalMarks } =
    questionData;

  if (!name || !numQuestions || !file || !subjectId) {
    throw new Error("All fields are required");
  }

  if (!file) {
    throw new Error("No PDF file uploaded");
  }

  // Save directly with file path
  const dataset = new CafExamQuestions({
    name,
    description,
    totalQuestions: numQuestions,
    pdfPath: file.path,
    subject: subjectId,
    mockExam,
    totalMarks,
  });

  await dataset.save();
  return dataset;
};

/**
 * Update a standard question exam (handling PDF re-splitting if needed).
 * @param {string} examId - ID of exam to update.
 * @param {Object} updateData - New metadata.
 * @param {Object} file - New PDF file (optional).
 * @returns {Promise<Object>} - Updated exam document.
 */
export const updateQuestion = async (examId, updateData, file) => {
  const exam = await Questions.findById(examId);
  if (!exam) throw new Error("Exam not found");

  const {
    name,
    description,
    totalAttempt,
    numQuestions,
    mockExam,
    totalMarks,
    subjectId,
  } = updateData;

  // 1. Handle PDF/Folder changes
  if (file) {
    // Delete old folder
    const oldFolderPath = path.join(
      "TestQuestions",
      exam.subject.toString(),
      exam.name
    );
    try {
      await fs.rm(oldFolderPath, { recursive: true, force: true });
    } catch (err) {
      console.error("Error deleting old exam folder:", err);
    }

    // Split new PDF
    const pagesData = await splitPDF(
      file.path,
      file.originalname,
      name,
      subjectId
    );
    exam.pagesData = pagesData;
    exam.pdfName = file.originalname;
    exam.totalQuestions = Object.keys(pagesData).length;
  } else if (name && name !== exam.name) {
    // Name changed, rename folder and update paths
    const oldFolderPath = path.join(
      "TestQuestions",
      exam.subject.toString(),
      exam.name
    );
    const newFolderPath = path.join(
      "TestQuestions",
      exam.subject.toString(),
      name
    );

    try {
      if (
        await fs
          .stat(oldFolderPath)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rename(oldFolderPath, newFolderPath);

        // Update internal path references in pagesData
        const newPagesData = {};
        for (const [key, oldPath] of Object.entries(exam.pagesData)) {
          newPagesData[key] = oldPath.replace(`/${exam.name}/`, `/${name}/`);
        }
        exam.pagesData = newPagesData;
      }
    } catch (err) {
      console.error("Error renaming exam folder:", err);
    }
  }

  // 2. Update metadata
  if (name) exam.name = name;
  if (description !== undefined) exam.description = description;
  if (totalAttempt) exam.totalAttempt = totalAttempt;
  if (numQuestions && !file) exam.totalQuestions = numQuestions;
  if (mockExam !== undefined) exam.mockExam = mockExam;
  if (totalMarks) exam.totalMarks = totalMarks;

  await exam.save();
  return exam;
};

/**
 * Update CAF Question (replaces PDF if new one provided).
 * @param {string} examId - ID of the exam.
 * @param {Object} updateData - Metadata updates.
 * @param {Object} file - New PDF file.
 * @returns {Promise<Object>} - Updated CAF exam document.
 */
export const updateCafQuestion = async (examId, updateData, file) => {
  const exam = await CafExamQuestions.findById(examId);
  if (!exam) throw new Error("CAF Exam not found");

  const { name, description, numQuestions, mockExam, totalMarks } = updateData;

  if (file) {
    // Delete old PDF
    if (exam.pdfPath && (await fs.stat(exam.pdfPath).catch(() => null))) {
      await fs
        .unlink(exam.pdfPath)
        .catch((err) => console.error("Error deleting old CAF PDF:", err));
    }
    exam.pdfPath = file.path;
  }

  // Update fields if provided
  if (name) exam.name = name;
  if (description !== undefined) exam.description = description;
  if (numQuestions) exam.totalQuestions = numQuestions;
  if (mockExam !== undefined) exam.mockExam = mockExam;
  if (totalMarks) exam.totalMarks = totalMarks;

  await exam.save();
  return exam;
};

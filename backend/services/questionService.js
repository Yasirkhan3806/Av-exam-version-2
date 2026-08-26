import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { Questions, Answer, CafExamQuestions, CafExamAnswer } from "../models/index.js";
import { JWT_SECRET } from "../utils/middleware.js";
import { getExamModel, getExamAndAnswerModels } from "../utils/examTypeResolver.js";
import { AppError } from "../utils/AppError.js";

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
export const addQuestions = async (questionData, files) => {
  const {
    name,
    description,
    totalAttempt,
    numQuestions,
    subjectId,
    mockExam,
    totalMarks,
    uploadMethod, // "auto" or "manual"
  } = questionData;

  if (!name || !totalAttempt || !numQuestions || !subjectId) {
    throw new AppError("All fields are required", 400);
  }

  let pagesData = {};
  let pdfName = "";

  if (uploadMethod === "manual") {
    if (!files || files.length === 0) {
      throw new AppError("No files uploaded for manual mapping", 400);
    }
    // Expected files to have fieldnames like q1, q2, q3...
    files.forEach((file) => {
      const fieldName = file.fieldname; // e.g., "q1"
      if (fieldName.startsWith("q")) {
        pagesData[
          fieldName
        ] = `TestQuestions/${subjectId}/${name}/${file.filename}`;
      }
    });
    pdfName = "Manual Upload";
  } else {
    // Default to auto-split
    const file = files && files.find((f) => f.fieldname === "pdf");
    if (!file) {
      throw new AppError("No PDF file uploaded for auto-split", 400);
    }

    pagesData = await splitPDF(file.path, file.originalname, name, subjectId);
    pdfName = file.originalname;
  }

  const dataset = new Questions({
    name,
    description,
    totalAttempt,
    totalQuestions: numQuestions,
    pdfName,
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
    throw new AppError("subjectId is required", 400);
  }
  if (!subjectType) {
    throw new AppError("subjectType is required", 400);
  }

  const ExamModel = getExamModel(subjectType);
  return await ExamModel.find({ subject: subjectId });
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
      throw new AppError("Question not found", 404);
    }
    return question;
  } else {
    // Default to Standard Questions
    question = await Questions.findById(id);
    if (!question) {
      throw new AppError("Question not found", 404);
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
    throw new AppError("Exam not found", 404);
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
  const models = getExamAndAnswerModels(subjectType);

  // 1. Find the question first to get its metadata for file cleanup
  const question = await models.Q.findById(id);

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  // 2. Perform File Cleanup BEFORE deleting from DB
  try {
    if (subjectType === "CAF") {
      // Delete CAF exam PDF
      if (question.pdfPath) {
        const fullPath = path.resolve(question.pdfPath);
        if (await fs.stat(fullPath).catch(() => null)) {
          await fs.unlink(fullPath);
        }
      }

      // Delete associated Answer PDFs
      const cafAnswers = await CafExamAnswer.find({ questionSet: id });
      for (const answer of cafAnswers) {
        if (answer.submittedPdfUrl) {
          const answerPath = path.resolve(answer.submittedPdfUrl);
          if (await fs.stat(answerPath).catch(() => null)) {
            await fs.unlink(answerPath);
          }
        }
      }
    } else if (subjectType !== "PRC") {
      // Standard/Default: Delete the folder containing split pages
      const folderPath = path.join(
        "TestQuestions",
        question.subject.toString(),
        question.name
      );
      await fs.rm(folderPath, { recursive: true, force: true });

      // Delete associated Answer PDFs from marksObtained
      const answers = await Answer.find({ questionSet: id });
      for (const answer of answers) {
        if (answer.marksObtained) {
          for (const data of Object.values(answer.marksObtained)) {
            if (data && data.pdfUrl) {
              const answerPath = path.resolve(data.pdfUrl);
              if (await fs.stat(answerPath).catch(() => null)) {
                await fs.unlink(answerPath);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error during file cleanup for question deletion:", err);
    // Continue with DB deletion even if file cleanup fails
  }

  // 3. Delete the question from DB
  await models.Q.findByIdAndDelete(id);

  // 4. Delete ALL answers that match the questionSet
  const deleteResult = await models.A.deleteMany({
    questionSet: id,
  });

  return {
    message: "Question, associated answers, and local files deleted",
    deletedQuestion: question,
    answersDeletedCount: deleteResult.deletedCount,
  };
};

/**
 * Submit answers to a running exam session.
 * @param {string} examId - ID of the answer document.
 * @param {Object} answers - Student's answers.
 * @returns {Promise<Object>} - Updated answer document.
 */
export const submitAnswers = async (examId, answers) => {
  if (!answers) {
    throw new AppError("Answers are required", 400);
  }

  const updatedDoc = await Answer.findByIdAndUpdate(
    examId,
    { answers },
    { new: true }
  );

  if (!updatedDoc) {
    throw new AppError("No existing answers to update", 400);
  }

  return updatedDoc;
};

export const submitExamSession = async (examId) => {
  const existingDoc = await Answer.findById(examId);

  if (!existingDoc) {
    throw new AppError("Exam not found or already submitted", 404);
  }

  // Guard: status may only move forward (draft -> submitted). Never let a
  // duplicate/retried finish call regress an already-graded doc back to
  // "submitted" and mask its checked state.
  if (existingDoc.status === "checked") {
    return existingDoc;
  }

  existingDoc.status = "submitted";
  await existingDoc.save();

  return existingDoc;
};

/**
 * Start a new exam session by creating an Answer document.
 * @param {string} questionSet - ID of the question set/exam.
 * @param {string} studentId - ID of the student.
 * @returns {Promise<Object>} - Object containing answerDoc and JWT token.
 */
export const startExam = async (questionSet, studentId) => {
  if (!questionSet) {
    throw new AppError("questionSet is required", 400);
  }

  // Check if there is an existing draft/in-progress exam
  let answerDoc = await Answer.findOne({
    questionSet,
    Student: studentId,
    status: "draft",
  });

  if (!answerDoc) {
    // Create initial answer record
    answerDoc = new Answer({
      answers: {},
      questionSet,
      Student: studentId,
      status: "draft",
    });
    try {
      await answerDoc.save();
    } catch (err) {
      // A concurrent request (double-click, network retry) won the race and
      // created the draft first — the unique partial index on
      // {questionSet, Student, status:"draft"} rejects this one. That's
      // fine: just use the draft that now exists instead of erroring out.
      if (err.code === 11000) {
        answerDoc = await Answer.findOne({
          questionSet,
          Student: studentId,
          status: "draft",
        });
      } else {
        throw err;
      }
    }
  }

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
    throw new AppError("All fields are required", 400);
  }

  if (!file) {
    throw new AppError("No PDF file uploaded", 400);
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
export const updateQuestion = async (examId, updateData, files) => {
  const exam = await Questions.findById(examId);
  if (!exam) throw new AppError("Exam not found", 404);

  const {
    name,
    description,
    totalAttempt,
    numQuestions,
    mockExam,
    totalMarks,
    subjectId,
    uploadMethod,
  } = updateData;

  // 1. Handle PDF/Folder changes
  if (files && files.length > 0) {
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

    if (uploadMethod === "manual") {
      const pagesData = {};
      files.forEach((file) => {
        const fieldName = file.fieldname;
        if (fieldName.startsWith("q")) {
          pagesData[
            fieldName
          ] = `TestQuestions/${subjectId}/${name}/${file.filename}`;
        }
      });
      exam.pagesData = pagesData;
      exam.pdfName = "Manual Upload";
      exam.totalQuestions = Object.keys(pagesData).length;
    } else {
      // Auto-split
      const file = files.find((f) => f.fieldname === "pdf");
      if (file) {
        const pagesData = await splitPDF(
          file.path,
          file.originalname,
          name,
          subjectId
        );
        exam.pagesData = pagesData;
        exam.pdfName = file.originalname;
        exam.totalQuestions = Object.keys(pagesData).length;
      }
    }
  } else if (name && name !== exam.name) {
    // ... (rest of folder rename logic)
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
  if (numQuestions && !(files && files.length > 0))
    exam.totalQuestions = numQuestions;
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
  if (!exam) throw new AppError("CAF Exam not found", 404);

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

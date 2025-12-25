import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { Questions, Answer, CafExamQuestions } from "../models/index.js";
import { JWT_SECRET } from "../utils/middleware.js";

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
  } else {
    questions = await Questions.find({ subject: subjectId });
  }
  return questions;
};

export const getQuestionById = async (id, subjectType) => {
  let question;
  if (subjectType === "CAF") {
    question = await CafExamQuestions.findById(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return question;
  } else {
    question = await Questions.findById(id);
    if (!question) {
      throw new Error("Question not found");
    }
    return {
      questionsObj: question.pagesData,
      time: question.totalAttempt,
      name: question.name,
      docId: question._id,
    };
  }
};

export const getFullQuestionById = async (id) => {
  let exam = await Questions.findById(id);
  if (!exam) {
    exam = await CafExamQuestions.findById(id);
  }
  if (!exam) {
    throw new Error("Exam not found");
  }
  return exam;
};

export const deleteQuestion = async (id) => {
  const question = await Questions.findByIdAndDelete(id);
  if (!question) {
    throw new Error("Question not found");
  }
  return question;
};

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

export const startExam = async (questionSet, studentId) => {
  if (!questionSet) {
    throw new Error("questionSet is required");
  }

  const answerDoc = new Answer({
    answers: {},
    questionSet,
    Student: studentId,
  });
  await answerDoc.save();

  const examPayload = {
    userId: studentId,
    ExamId: answerDoc._id,
  };

  const examToken = jwt.sign(examPayload, JWT_SECRET, { expiresIn: "10h" });

  return { answerDoc, examToken };
};

export const addCafQuestions = async (questionData, file) => {
  const { name, description, numQuestions, subjectId, mockExam, totalMarks } =
    questionData;

  if (!name || !numQuestions || !file || !subjectId) {
    throw new Error("All fields are required");
  }

  if (!file) {
    throw new Error("No PDF file uploaded");
  }

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

  if (name) exam.name = name;
  if (description !== undefined) exam.description = description;
  if (numQuestions) exam.totalQuestions = numQuestions;
  if (mockExam !== undefined) exam.mockExam = mockExam;
  if (totalMarks) exam.totalMarks = totalMarks;

  await exam.save();
  return exam;
};

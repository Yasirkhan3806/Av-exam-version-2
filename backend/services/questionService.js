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

export const getQuestionsBySubject = async (subjectId) => {
  if (!subjectId) {
    throw new Error("subjectId is required");
  }
  const questions = await Questions.find({ subject: subjectId });
  return questions;
};

export const getQuestionById = async (id) => {
  const question = await Questions.findById(id);
  if (!question) {
    throw new Error("Question not found");
  }
  return {
    questionsObj: question.pagesData,
    time: question.totalAttempt,
    name: question.name,
    docId: question._id,
  };
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
  const {
    name,
    description,
    numQuestions,
    subjectId,
    mockExam,
    totalMarks,
  } = questionData;

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


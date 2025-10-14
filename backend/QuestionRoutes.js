import express from "express";
const router = express.Router();
import { Questions, Answer } from "./schema.js";
import { verifyToken, upload,verifyExamToken } from "./middleware.js";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./middleware.js";




async function splitPDF(inputPath, originalName, name) {
  try {
    console.log('Splitting PDF:', inputPath);
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const baseName = path.parse(originalName).name;
    const pagesData = {};

    for (let i = 0; i < pageCount; i++) {
      // Create new PDF document for this page
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(page);

      // Save the page as a separate PDF
      const pageFileName = `${baseName}_page_${i + 1}.pdf`;
      const pageFilePath = path.join(`TestQuestions/${name}`, pageFileName);
      const pdfBytes = await newPdf.save();

      await fs.writeFile(pageFilePath, pdfBytes);

      // Store the relative path
      pagesData[`q${i + 1}`] = `TestQuestions/${name}/${pageFileName}`;
    }

    // Remove the original uploaded file
    await fs.unlink(inputPath);

    return pagesData;
  } catch (error) {
    console.error('Error splitting PDF:', error);
    throw error;
  }
}

router.post(
  "/addQuestions",
  verifyToken,
  upload.single("pdf"),
  async (req, res) => {
    try {
      const { name, description, totalAttempt, numQuestions, subjectId,mockExam,totalMarks } = req.body;

      if (!name || !totalAttempt || !numQuestions || !req.file || !subjectId) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      const pagesData = await splitPDF(req.file.path, req.file.originalname, name);

      const dataset = new Questions({
        name,
        description,
        totalAttempt,
        totalQuestions: numQuestions,
        pdfName: req.file.originalname,
        pagesData,
        subject: subjectId,
        mockExam,
        totalMarks

      });

      await dataset.save();

      return res
        .status(200)
        .json({ id: dataset._id, message: "Dataset saved successfully" });
    } catch (err) {
      return res
        .status(500)
        .json({ error: err.message || "Internal Server Error" });
    }
  }
);




router.get("/getQuestions/:subjectId", verifyToken, async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) {
      return res.status(400).json({ error: "subjectId is required" });
    }
    const questions = await Questions.find({ subject: subjectId });
    console.log('Fetched questions:', questions);
    return res.status(200).json(questions);
  }
  catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

router.get("/getQuestionById/:id",verifyToken, async (req, res) => {
  try {

    const question = await Questions.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.status(200).json({ questionsObj: question.pagesData, time: question.totalAttempt, name: question.name, docId: question._id });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

router.delete("/deleteQuestion/:id", verifyToken, async (req, res) => {
  try {
    const question = await Questions.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }

});

router.post("/submitAnswers", verifyExamToken, async (req, res) => {
  try {
    const { answers, questionSet } = req.body;
    const { ExamId, userId } = req.exam; // ✅ from ExamToken

    if (!answers || !questionSet) {
      return res.status(400).json({ error: "Answers and questionSet are required" });
    }


    // Update the existing Answer document
    const updatedDoc = await Answer.findByIdAndUpdate(
      ExamId,
      { answers },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(400).json({ message: "No existing answers to update" });
    }

    return res.status(200).json({
      message: "Answers updated successfully",
      id: updatedDoc._id,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

router.post("/startExam", verifyToken, async (req, res) => {
  try {
    const { questionSet } = req.body;
    if (!questionSet) {
      return res.status(400).json({ error: "questionSet is required" });
    }

    const studentId = req.user.userId;

    // Create Answer doc
    const answerDoc = new Answer({
      answers: {},
      questionSet,
      Student: studentId,
    });
    await answerDoc.save();

    // Create ExamToken separate from login token
    const examPayload = {
      userId: studentId,
      ExamId: answerDoc._id,
    };

    const examToken = jwt.sign(examPayload, JWT_SECRET, { expiresIn: "10h" });

    // Store ExamToken in cookie
    res.cookie("ExamToken", examToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    return res.status(200).json({
      message: "Exam session started",
      ExamId: answerDoc._id,
      ExamToken: examToken, // optional, since cookie also set
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});



router.post("/finishExam", verifyToken, async (req, res) => {
  try {
    // Clear only the ExamToken
    res.clearCookie("ExamToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Exam finished, ExamToken cleared",
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});





export default router;
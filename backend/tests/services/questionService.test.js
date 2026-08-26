import "dotenv/config"; // questionService.js imports JWT_SECRET from utils/middleware.js, which requires it at module-load time
import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
  Questions,
  Answer,
  CafExamQuestions,
  PRCExam,
  CafExamAnswer,
  PRCAnswer,
} from "../../models/index.js";
import * as questionService from "../../services/questionService.js";

test("Question Service Unit Tests", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("3.1 Unit Tests — PDF Splitting", async (st) => {
    await st.test("QUES-U-001: Split multi-page PDF", async (t) => {
      t.mock.method(fs, "readFile", async () => Buffer.from("pdf-data"));
      t.mock.method(fs, "writeFile", async () => {});
      const unlinkMock = t.mock.method(fs, "unlink", async () => {});

      const mockPdfDoc = {
        getPageCount: () => 5,
        copyPages: async () => [{}],
      };
      t.mock.method(PDFDocument, "load", async () => mockPdfDoc);
      
      const mockNewPdf = {
        copyPages: async () => [{ /* mock page */ }],
        addPage: () => {},
        save: async () => Buffer.from("page-data"),
      };
      t.mock.method(PDFDocument, "create", async () => mockNewPdf);

      const result = await questionService.splitPDF("input.pdf", "test.pdf", "exam1", "sub1");
      
      assert.strictEqual(Object.keys(result).length, 5);
      assert.ok(result.q1);
      assert.ok(result.q5);
      assert.strictEqual(unlinkMock.mock.calls.length, 1);
    });

    await st.test("QUES-U-002: Split single-page PDF", async (t) => {
      t.mock.method(fs, "readFile", async () => Buffer.from("pdf-data"));
      t.mock.method(fs, "writeFile", async () => {});
      t.mock.method(fs, "unlink", async () => {});

      const mockPdfDoc = {
        getPageCount: () => 1,
        copyPages: async () => [{}],
      };
      t.mock.method(PDFDocument, "load", async () => mockPdfDoc);
      
      const mockNewPdf = {
        copyPages: async () => [{ /* mock page */ }],
        addPage: () => {},
        save: async () => Buffer.from("page-data"),
      };
      t.mock.method(PDFDocument, "create", async () => mockNewPdf);

      const result = await questionService.splitPDF("input.pdf", "test.pdf", "exam1", "sub1");
      
      assert.strictEqual(Object.keys(result).length, 1);
      assert.ok(result.q1);
    });

    await st.test("QUES-U-003: Invalid PDF file", async (t) => {
      t.mock.method(fs, "readFile", async () => Buffer.from("bad-data"));
      t.mock.method(PDFDocument, "load", async () => { throw new Error("Parse failure"); });

      await assert.rejects(
        async () => await questionService.splitPDF("bad.pdf", "bad.pdf", "exam", "sub"),
        { message: "Parse failure" }
      );
    });
  });

  await t.test("3.2 Unit Tests — Add Questions", async (st) => {
    await st.test("QUES-U-004: Add questions (auto-split)", async (t) => {
      // Mocking PDF Splitting internals
      t.mock.method(fs, "readFile", async () => Buffer.from("pdf-data"));
      t.mock.method(fs, "writeFile", async () => {});
      t.mock.method(fs, "unlink", async () => {});
      t.mock.method(PDFDocument, "load", async () => ({ getPageCount: () => 2, copyPages: async () => [{}] }));
      t.mock.method(PDFDocument, "create", async () => ({ copyPages: async () => [{}], addPage: () => {}, save: async () => Buffer.from("data") }));

      t.mock.method(Questions.prototype, "save", async function () {
        this._id = "q123";
        return this;
      });

      const data = {
        name: "Exam 1", description: "Desc", totalAttempt: 120, numQuestions: 2,
        subjectId: "sub1", mockExam: false, totalMarks: 100, uploadMethod: "auto"
      };
      const files = [{ fieldname: "pdf", path: "test.pdf", originalname: "test.pdf" }];

      const result = await questionService.addQuestions(data, files);
      assert.strictEqual(result.name, "Exam 1");
      assert.strictEqual(Object.keys(result.pagesData).length, 2);
    });

    await st.test("QUES-U-005: Add questions (manual upload)", async (t) => {
      t.mock.method(Questions.prototype, "save", async function () {
        this._id = "q123";
        return this;
      });

      const data = {
        name: "Exam 2", description: "Desc", totalAttempt: 120, numQuestions: 2,
        subjectId: "sub1", uploadMethod: "manual"
      };
      const files = [
        { fieldname: "q1", filename: "file1.pdf" },
        { fieldname: "q2", filename: "file2.pdf" }
      ];

      const result = await questionService.addQuestions(data, files);
      assert.strictEqual(Object.keys(result.pagesData).length, 2);
      assert.strictEqual(result.pdfName, "Manual Upload");
    });

    await st.test("QUES-U-006: Missing required fields", async (t) => {
      await assert.rejects(
        async () => await questionService.addQuestions({ totalAttempt: 120 }, []),
        { message: "All fields are required" }
      );
    });

    await st.test("QUES-U-007: No file uploaded (auto)", async (t) => {
      const data = { name: "N", totalAttempt: 1, numQuestions: 1, subjectId: "S", uploadMethod: "auto" };
      await assert.rejects(
        async () => await questionService.addQuestions(data, []),
        { message: "No PDF file uploaded for auto-split" }
      );
    });
  });

  await t.test("3.3 Unit Tests — Exam Session", async (st) => {
    await st.test("QUES-U-008: Start exam session", async (t) => {
      const qSetId = new mongoose.Types.ObjectId().toString();
      const stdId = new mongoose.Types.ObjectId().toString();

      // No existing draft — startExam creates a new Answer doc.
      t.mock.method(Answer, "findOne", async () => null);
      t.mock.method(Answer.prototype, "save", async function () {
        this._id = "ans123";
        return this;
      });
      t.mock.method(jwt, "sign", () => "fake-jwt-token");
      t.mock.method(jwt, "decode", () => ({ userId: stdId, ExamId: "ans123" }));

      const { answerDoc, examToken } = await questionService.startExam(qSetId, stdId);
      assert.strictEqual(answerDoc.questionSet.toString(), qSetId);
      assert.strictEqual(answerDoc.Student.toString(), stdId);
      assert.ok(examToken);
      
      const decoded = jwt.decode(examToken);
      assert.strictEqual(decoded.userId, stdId);
      assert.strictEqual(decoded.ExamId, "ans123");
    });

    await st.test("QUES-U-009: Start exam - no questionSet", async (t) => {
      await assert.rejects(
        async () => await questionService.startExam(null, "std1"),
        { message: "questionSet is required" }
      );
    });

    await st.test("QUES-U-010: Submit answers", async (t) => {
      t.mock.method(Answer, "findByIdAndUpdate", async () => ({ _id: "ans123", answers: { q1: "Ans" } }));

      const result = await questionService.submitAnswers("ans123", { q1: "Ans" });
      assert.strictEqual(result._id, "ans123");
      assert.deepEqual(result.answers, { q1: "Ans" });
    });

    await st.test("QUES-U-011: Submit null answers", async (t) => {
      await assert.rejects(
        async () => await questionService.submitAnswers("ans123", null),
        { message: "Answers are required" }
      );
    });

    await st.test("QUES-U-012: Submit to non-existent exam", async (t) => {
      t.mock.method(Answer, "findByIdAndUpdate", async () => null);

      await assert.rejects(
        async () => await questionService.submitAnswers("badId", { q1: "A" }),
        { message: "No existing answers to update" }
      );
    });
  });

  await t.test("3.4 Unit Tests — Delete Question", async (st) => {
    await st.test("QUES-U-013: Delete standard question", async (t) => {
      const qId = "q123";
      t.mock.method(Questions, "findById", async () => ({ _id: qId, subject: "sub1", name: "Exam" }));
      t.mock.method(Questions, "findByIdAndDelete", async () => true);
      t.mock.method(Answer, "find", async () => [{ marksObtained: { q1: { pdfUrl: "test.pdf" } } }]);
      const deleteAnswersMock = t.mock.method(Answer, "deleteMany", async () => ({ deletedCount: 1 }));

      t.mock.method(fs, "stat", async () => true); // file exists
      const unlinkMock = t.mock.method(fs, "unlink", async () => {});
      const rmMock = t.mock.method(fs, "rm", async () => {});

      const result = await questionService.deleteQuestion(qId, "DEFAULT");
      
      assert.strictEqual(result.answersDeletedCount, 1);
      assert.strictEqual(unlinkMock.mock.calls.length, 1); // unlinks ans pdf
      assert.strictEqual(rmMock.mock.calls.length, 1); // removes directory
      assert.strictEqual(deleteAnswersMock.mock.calls.length, 1);
    });

    await st.test("QUES-U-014: Delete CAF question", async (t) => {
      const qId = "caf123";
      t.mock.method(CafExamQuestions, "findById", async () => ({ _id: qId, pdfPath: "caf.pdf" }));
      t.mock.method(CafExamQuestions, "findByIdAndDelete", async () => true);
      t.mock.method(CafExamAnswer, "find", async () => [{ submittedPdfUrl: "ans.pdf" }]);
      const deleteAnswersMock = t.mock.method(CafExamAnswer, "deleteMany", async () => ({ deletedCount: 1 }));

      t.mock.method(fs, "stat", async () => true);
      const unlinkMock = t.mock.method(fs, "unlink", async () => {});

      const result = await questionService.deleteQuestion(qId, "CAF");

      assert.strictEqual(result.answersDeletedCount, 1);
      assert.strictEqual(unlinkMock.mock.calls.length, 2); // unlinks question pdf + answer pdf
      assert.strictEqual(deleteAnswersMock.mock.calls.length, 1);
    });

    await st.test("QUES-U-015: Delete PRC question", async (t) => {
      const qId = "prc123";
      t.mock.method(PRCExam, "findById", async () => ({ _id: qId }));
      t.mock.method(PRCExam, "findByIdAndDelete", async () => true);
      const deleteAnswersMock = t.mock.method(PRCAnswer, "deleteMany", async () => ({ deletedCount: 1 }));

      const result = await questionService.deleteQuestion(qId, "PRC");

      assert.strictEqual(result.answersDeletedCount, 1);
      assert.strictEqual(deleteAnswersMock.mock.calls.length, 1);
    });

    await st.test("QUES-U-016: Delete non-existent question", async (t) => {
      t.mock.method(Questions, "findById", async () => null);

      await assert.rejects(
        async () => await questionService.deleteQuestion("bad", "DEFAULT"),
        { message: "Question not found" }
      );
    });
  });
});

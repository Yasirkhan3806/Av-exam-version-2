import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import fs from "fs";
import puppeteer from "puppeteer";
import {
  Instructor,
  Subject,
  TestUser,
  Questions,
  Answer,
  CafExamQuestions,
  CafExamAnswer,
} from "../../models/index.js";
import * as instructorService from "../../services/instructorService.js";

test("Instructor Service Unit Tests", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("2.1 Unit Tests — Registration & Login", async (st) => {
    await st.test("INST-U-001: Register instructor", async (t) => {
      t.mock.method(Instructor, "findOne", async () => null);
      t.mock.method(Instructor.prototype, "save", async function () {
        this._id = "inst123";
        return this;
      });

      const result = await instructorService.registerInstructor(
        "John Doe",
        "johndoe",
        ["Math"],
        "password123"
      );

      assert.strictEqual(result.name, "John Doe");
      assert.strictEqual(result.userName, "johndoe");
      assert.deepEqual(result.courses, ["Math"]);
      assert.ok(await bcrypt.compare("password123", result.password));
    });

    await st.test("INST-U-002: Reject missing fields", async (t) => {
      await assert.rejects(
        async () => await instructorService.registerInstructor("", "user", [], "pass"),
        { message: "All fields are required" }
      );
    });

    await st.test("INST-U-003: Reject duplicate username", async (t) => {
      t.mock.method(Instructor, "findOne", async () => ({ userName: "johndoe" }));

      await assert.rejects(
        async () =>
          await instructorService.registerInstructor(
            "John Doe",
            "johndoe",
            ["Math"],
            "password123"
          ),
        { message: "Instructor with this username already exists" }
      );
    });

    await st.test("INST-U-004: Login valid credentials", async (t) => {
      const hashedPassword = await bcrypt.hash("correct-password", 1);
      const mockInstructor = { userName: "johndoe", password: hashedPassword, _id: "inst123" };
      t.mock.method(Instructor, "findOne", async () => mockInstructor);

      const result = await instructorService.loginInstructor("johndoe", "correct-password");
      assert.strictEqual(result._id, "inst123");
    });

    await st.test("INST-U-005: Login missing fields", async (t) => {
      await assert.rejects(
        async () => await instructorService.loginInstructor("", "pass"),
        { message: "Username and password are required" }
      );
    });

    await st.test("INST-U-006: Login wrong password", async (t) => {
      const hashedPassword = await bcrypt.hash("correct-password", 1);
      const mockInstructor = { userName: "johndoe", password: hashedPassword, _id: "inst123" };
      t.mock.method(Instructor, "findOne", async () => mockInstructor);

      await assert.rejects(
        async () => await instructorService.loginInstructor("johndoe", "wrong-password"),
        { message: "Invalid username or password" }
      );
    });
  });

  await t.test("2.2 Unit Tests — Subject & Exam Queries", async (st) => {
    await st.test("INST-U-007: Get subjects by instructor", async (t) => {
      const instId = new mongoose.Types.ObjectId().toString();
      const mockSubjects = [{ _id: "sub1", studentCount: 3 }];
      t.mock.method(Subject, "aggregate", async () => mockSubjects);

      const result = await instructorService.getAllSubjectsByInstructor(instId);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].studentCount, 3);
    });

    await st.test("INST-U-008: Invalid instructor ID", async (t) => {
      await assert.rejects(
        async () => await instructorService.getAllSubjectsByInstructor("invalid-id"),
        { message: "Invalid instructor ID" }
      );
    });

    await st.test("INST-U-009: Get exams for CAF subject", async (t) => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      t.mock.method(Subject, "findById", async () => ({ _id: subjectId, name: "Math" }));
      t.mock.method(TestUser, "countDocuments", async () => 10);
      
      const mockExams = [
        { _id: "exam1", name: "Exam 1", createdAt: new Date("2023-01-01"), totalAttempt: 60, totalQuestions: 5 }
      ];
      t.mock.method(CafExamQuestions, "find", () => ({ sort: async () => mockExams }));
      t.mock.method(CafExamAnswer, "countDocuments", async () => 5); // 5 submissions out of 10

      const result = await instructorService.getExamsBySubject(subjectId, "CAF");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].progress, 50); // 5/10 * 100
      assert.strictEqual(result[0].submissions, "5/10 submitted (50%)");
    });

    await st.test("INST-U-010: Get exams for CFAP subject", async (t) => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      t.mock.method(Subject, "findById", async () => ({ _id: subjectId, name: "Physics" }));
      t.mock.method(TestUser, "countDocuments", async () => 20);
      
      const mockExams = [
        { _id: "exam2", name: "Exam 2", createdAt: new Date("2023-01-01"), totalAttempt: 120, totalQuestions: 10 }
      ];
      t.mock.method(Questions, "find", () => ({ sort: async () => mockExams }));
      t.mock.method(Answer, "countDocuments", async () => 15);

      const result = await instructorService.getExamsBySubject(subjectId, "CFAP");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].progress, 75); // 15/20 * 100
    });

    await st.test("INST-U-011: Subject not found", async (t) => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      t.mock.method(Subject, "findById", async () => null);

      await assert.rejects(
        async () => await instructorService.getExamsBySubject(subjectId, "CAF"),
        { message: "Subject not found" }
      );
    });
  });

  await t.test("2.3 Unit Tests — Grading & PDF", async (st) => {
    await st.test("INST-U-012: Generate PDF from HTML", async (t) => {
      // Mock Puppeteer
      const mockPage = {
        setContent: async () => {},
        emulateMediaType: async () => {},
        pdf: async () => Buffer.from("pdf content"),
      };
      const mockBrowser = {
        newPage: async () => mockPage,
        close: async () => {},
      };
      t.mock.method(puppeteer, "launch", async () => mockBrowser);

      // Mock FS
      t.mock.method(fs, "existsSync", () => false);
      const mkdirSyncMock = t.mock.method(fs, "mkdirSync", () => {});
      const writeFileSyncMock = t.mock.method(fs, "writeFileSync", () => {});

      const resultPath = await instructorService.generatePDF("<p>Hello</p>", "testfile");

      assert.ok(resultPath.includes("testfile.pdf"));
      assert.strictEqual(mkdirSyncMock.mock.calls.length, 1);
      assert.strictEqual(writeFileSyncMock.mock.calls.length, 1);
    });

    await st.test("INST-U-013: Get student answers (creates PDFs)", async (t) => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const examId = new mongoose.Types.ObjectId().toString();

      const mockAnswerDoc = {
        Student: studentId,
        questionSet: examId,
        answers: new Map([["q1", "<p>Ans 1</p>"]]),
        marksObtained: {},
        save: async function () { return this; }
      };

      t.mock.method(Answer, "findOne", async () => mockAnswerDoc);

      // Mock Puppeteer internally called by generatePDF
      const mockPage = {
        setContent: async () => {},
        emulateMediaType: async () => {},
        pdf: async () => Buffer.from("pdf data"),
      };
      const mockBrowser = {
        newPage: async () => mockPage,
        close: async () => {},
      };
      t.mock.method(puppeteer, "launch", async () => mockBrowser);
      t.mock.method(fs, "existsSync", () => true); // pdfDir exists
      t.mock.method(fs, "writeFileSync", () => {});

      const result = await instructorService.getStudentAnswers(studentId, examId, "CFAP");

      assert.ok(result.marksObtained["q1"].pdfUrl.includes(`${studentId}_${examId}_q1.pdf`));
    });

    await st.test("INST-U-014: Get student answers (PDFs exist)", async (t) => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const examId = new mongoose.Types.ObjectId().toString();

      const mockAnswerDoc = {
        Student: studentId,
        questionSet: examId,
        answers: new Map([["q1", "<p>Ans 1</p>"]]),
        marksObtained: { q1: { pdfUrl: "existing_path.pdf" } },
        save: async function () { return this; }
      };

      t.mock.method(Answer, "findOne", async () => mockAnswerDoc);
      const puppeteerMock = t.mock.method(puppeteer, "launch", async () => {});

      const result = await instructorService.getStudentAnswers(studentId, examId, "CFAP");

      assert.strictEqual(puppeteerMock.mock.calls.length, 0, "Puppeteer should not be called if PDF exists");
      assert.strictEqual(result.marksObtained["q1"].pdfUrl, "existing_path.pdf");
    });

    await st.test("INST-U-015: Upload checked PDFs", async (t) => {
      const files = [
        { fieldname: "q1", path: "new_q1_path.pdf" },
        { fieldname: "suggested_q2", path: "new_sugg_q2_path.pdf" }
      ];
      const initialMarks = {
        q1: { pdfUrl: "old_q1_path.pdf" },
        q2: { suggestedSolutionUrl: "old_sugg_q2_path.pdf" }
      };

      t.mock.method(fs, "existsSync", () => true);
      const unlinkSyncMock = t.mock.method(fs, "unlinkSync", () => {});

      const result = await instructorService.uploadCheckedPdfs(files, initialMarks);

      assert.strictEqual(unlinkSyncMock.mock.calls.length, 2); // Deletes both old files
      assert.strictEqual(result.q1.pdfUrl, "new_q1_path.pdf");
      assert.strictEqual(result.q1.checked, true);
      assert.strictEqual(result.q2.suggestedSolutionUrl, "new_sugg_q2_path.pdf");
    });

    await st.test("INST-U-016: Update student marks", async (t) => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const examId = new mongoose.Types.ObjectId().toString();

      const mockUpdatedAnswer = { _id: "ans123", marksObtained: { q1: { marks: 10 } } };
      t.mock.method(Answer, "findOneAndUpdate", async () => mockUpdatedAnswer);

      const result = await instructorService.updateStudentMarks(studentId, examId, { q1: { marks: 10 } }, "checked", "CFAP");

      assert.strictEqual(result._id, "ans123");
    });

    await st.test("INST-U-017: Update marks - answer not found", async (t) => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const examId = new mongoose.Types.ObjectId().toString();

      t.mock.method(Answer, "findOneAndUpdate", async () => null);

      await assert.rejects(
        async () => await instructorService.updateStudentMarks(studentId, examId, {}, "checked", "CFAP"),
        { message: "No answer document found for this student and exam" }
      );
    });
  });
});

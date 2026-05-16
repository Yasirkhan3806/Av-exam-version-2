import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import fs from "fs";
import {
  Subject,
  TestUser,
  Questions,
  Answer,
  CafExamQuestions,
  CafExamAnswer,
  PRCExam,
  PRCAnswer,
} from "../../models/index.js";
import * as subjectService from "../../services/subjectService.js";

test("Subject Service Unit Tests", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("SUBJ-U-001: Add subject", async (t) => {
    t.mock.method(Subject, "findOne", async () => null);
    t.mock.method(Subject.prototype, "save", async function () {
      return this;
    });

    const result = await subjectService.addSubject(
      "Physics",
      "Desc",
      "inst123",
      ["CAF"],
      "Standard"
    );

    assert.ok(result._id, "Subject should have an _id assigned");
    assert.strictEqual(result.name, "Physics");
  });

  await t.test("SUBJ-U-002: Add duplicate subject", async (t) => {
    t.mock.method(Subject, "findOne", async () => ({ name: "Physics" }));

    await assert.rejects(
      async () =>
        await subjectService.addSubject(
          "Physics",
          "Desc",
          "inst123",
          ["CAF"],
          "Standard"
        ),
      { message: "Subject already exists for this instructor." }
    );
  });

  await t.test("SUBJ-U-003: Add subject missing fields", async (t) => {
    await assert.rejects(
      async () => await subjectService.addSubject(null, "Desc", "inst", [], "Type"),
      { message: "Name, description, type and instructor are required." }
    );
  });

  await t.test("SUBJ-U-004: Enroll student", async (t) => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const subjectId = new mongoose.Types.ObjectId().toString();

    t.mock.method(TestUser, "findByIdAndUpdate", async () => ({ _id: studentId }));

    const result = await subjectService.enrollStudent(studentId, subjectId);
    assert.strictEqual(result._id, studentId);
  });

  await t.test("SUBJ-U-005: Enroll non-existent student", async (t) => {
    t.mock.method(TestUser, "findByIdAndUpdate", async () => null);

    await assert.rejects(
      async () => await subjectService.enrollStudent("badId", "subId"),
      { message: "Student not found." }
    );
  });

  await t.test("SUBJ-U-006: Unenroll student", async (t) => {
    const studentId = new mongoose.Types.ObjectId().toString();
    t.mock.method(TestUser, "findByIdAndUpdate", async () => ({ _id: studentId }));

    const result = await subjectService.unenrollStudent(studentId, "subId");
    assert.strictEqual(result._id, studentId);
  });

  await t.test("SUBJ-U-007: Get enrolled subjects", async (t) => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const mockStudent = {
      _id: studentId,
      subjectsEnrolled: [{ _id: "sub1", name: "Math" }],
    };

    t.mock.method(TestUser, "findById", () => ({
      populate: async () => mockStudent,
    }));

    const result = await subjectService.getEnrolledSubjects(studentId);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, "Math");
  });

  await t.test("SUBJ-U-008: Calculate grade", async (t) => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const subjectId = new mongoose.Types.ObjectId().toString();
    const qSetId = new mongoose.Types.ObjectId();

    const mockQuestionSets = [{ _id: qSetId, totalMarks: 100 }];
    const mockAnswers = [
      {
        questionSet: qSetId,
        marksObtained: { q1: { marks: 85 } },
      },
    ];

    t.mock.method(Questions, "find", async () => mockQuestionSets);
    t.mock.method(Answer, "find", async () => mockAnswers);
    t.mock.method(Subject, "findById", async () => ({ name: "Math" }));

    const result = await subjectService.calculateGrade(studentId, subjectId);

    assert.strictEqual(result.subject, "Math");
    assert.strictEqual(result.totalMarks, 100);
    assert.strictEqual(result.obtainedMarks, 85);
    assert.strictEqual(result.percentage, 85);
    assert.strictEqual(result.grade, "A");
  });

  await t.test("SUBJ-U-009: Calculate grade - no question sets", async (t) => {
    t.mock.method(Questions, "find", async () => []);

    await assert.rejects(
      async () => await subjectService.calculateGrade("std", "sub"),
      { message: "No question sets found for this subject." }
    );
  });

  await t.test("SUBJ-U-010: Calculate grade - no checked answers", async (t) => {
    t.mock.method(Questions, "find", async () => [{ _id: "qId" }]);
    t.mock.method(Answer, "find", async () => []);

    await assert.rejects(
      async () => await subjectService.calculateGrade("std", "sub"),
      { message: "No checked answers found for this student in this subject." }
    );
  });

  await t.test("SUBJ-U-011: Delete subject cascade", async (t) => {
    const subjectId = new mongoose.Types.ObjectId().toString();

    // 1. Mock Finds
    t.mock.method(Questions, "find", () => ({ select: async () => [{ _id: "q1" }] }));
    t.mock.method(CafExamQuestions, "find", () => ({ select: async () => [{ _id: "caf1" }] }));
    t.mock.method(PRCExam, "find", () => ({ select: async () => [{ _id: "prc1" }] }));

    t.mock.method(Answer, "find", async () => [{ marksObtained: { q1: { pdfUrl: "ans.pdf" } } }]);
    t.mock.method(CafExamAnswer, "find", async () => [{ submittedPdfUrl: "caf.pdf" }]);

    // 2. Mock Deletes
    t.mock.method(Answer, "deleteMany", async () => true);
    t.mock.method(CafExamAnswer, "deleteMany", async () => true);
    t.mock.method(PRCAnswer, "deleteMany", async () => true);
    t.mock.method(Questions, "deleteMany", async () => true);
    t.mock.method(CafExamQuestions, "deleteMany", async () => true);
    t.mock.method(PRCExam, "deleteMany", async () => true);
    t.mock.method(TestUser, "updateMany", async () => true);
    t.mock.method(Subject, "findByIdAndDelete", async () => ({ _id: subjectId }));

    // 3. Mock FS
    t.mock.method(fs, "existsSync", () => true);
    const unlinkSyncMock = t.mock.method(fs, "unlinkSync", () => {});
    const rmSyncMock = t.mock.method(fs, "rmSync", () => {});

    const result = await subjectService.deleteSubject(subjectId);

    assert.strictEqual(result._id, subjectId);
    assert.strictEqual(unlinkSyncMock.mock.calls.length, 2); // ans.pdf and caf.pdf
    assert.strictEqual(rmSyncMock.mock.calls.length, 1); // delete subject directory
  });
});

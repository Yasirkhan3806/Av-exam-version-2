import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import fs from "fs";
import {
  TestUser,
  User,
  Instructor,
  CafExamAnswer,
  PRCAnswer,
  Answer,
} from "../../models/index.js";
import { emailServiceWrapper } from "../../utils/emailService.js";
import * as authService from "../../services/authService.js";

// PEPPER is loaded from .env automatically


test("Auth Service Unit Tests", async (t) => {
  t.afterEach(() => {
    t.mock.restoreAll();
  });

  await t.test("1.1 Unit Tests — registerUser", async (st) => {
    await st.test("AUTH-U-001: Register new user successfully", async (t) => {
      // Mock no existing user
      t.mock.method(TestUser, "findOne", async () => null);

      // Mock save
      t.mock.method(TestUser.prototype, "save", async function () {
        this._id = "mockUserId123";
        return this;
      });

      // Mock email sending
      const sendEmailMock = t.mock.method(emailServiceWrapper, "sendEmail", async () => true);

      const result = await authService.registerUser("John Doe", "johndoe", "john@example.com", "pass123");

      assert.strictEqual(result.name, "John Doe");
      assert.strictEqual(result.userName, "johndoe");
      assert.strictEqual(result.email, "john@example.com");
      assert.ok(await bcrypt.compare("pass123", result.password), "Password should be hashed");
      assert.strictEqual(sendEmailMock.mock.calls.length, 1, "Welcome email should be sent");
      assert.strictEqual(sendEmailMock.mock.calls[0].arguments[0], "john@example.com");
      // AUTH-U-004 is inherently covered here because sendEmail is called.
    });

    await st.test("AUTH-U-002: Reject duplicate email", async (t) => {
      t.mock.method(TestUser, "findOne", async () => ({ email: "john@example.com" }));

      await assert.rejects(
        async () => await authService.registerUser("John", "john1", "john@example.com", "pass"),
        { message: "User already exists" }
      );
    });
  });

  await t.test("1.2 Unit Tests — loginUser", async (st) => {
    await st.test("AUTH-U-005: Login with valid credentials", async (t) => {
      const hashedPassword = await bcrypt.hash("correct-password", 1);
      const mockUser = { email: "test@example.com", password: hashedPassword, _id: "user123" };
      t.mock.method(TestUser, "findOne", async () => mockUser);

      const result = await authService.loginUser("test@example.com", "correct-password");
      assert.strictEqual(result._id, "user123");
    });

    await st.test("AUTH-U-006: Reject invalid email", async (t) => {
      t.mock.method(TestUser, "findOne", async () => null);

      await assert.rejects(
        async () => await authService.loginUser("bad@example.com", "pass"),
        { message: "Invalid email or password" }
      );
    });

    await st.test("AUTH-U-007: Reject wrong password", async (t) => {
      const hashedPassword = await bcrypt.hash("correct-password", 1);
      const mockUser = { email: "test@example.com", password: hashedPassword, _id: "user123" };
      t.mock.method(TestUser, "findOne", async () => mockUser);

      await assert.rejects(
        async () => await authService.loginUser("test@example.com", "wrong-password"),
        { message: "Invalid email or password" }
      );
    });
  });

  await t.test("1.3 Unit Tests — adminLogin", async (st) => {
    await st.test("AUTH-U-008: Admin login with PEPPER", async (t) => {
      const passwordWithPepper = "admin-pass" + process.env.PEPPER;
      const hashedPassword = await bcrypt.hash(passwordWithPepper, 1);
      const mockAdmin = { email: "admin@example.com", password: hashedPassword, _id: "admin123" };
      
      t.mock.method(User, "findOne", async () => mockAdmin);

      const result = await authService.adminLogin("admin@example.com", "admin-pass");
      assert.strictEqual(result._id, "admin123");
    });

    await st.test("AUTH-U-009: Admin login wrong password", async (t) => {
      const passwordWithPepper = "admin-pass" + process.env.PEPPER;
      const hashedPassword = await bcrypt.hash(passwordWithPepper, 1);
      const mockAdmin = { email: "admin@example.com", password: hashedPassword, _id: "admin123" };
      
      t.mock.method(User, "findOne", async () => mockAdmin);

      await assert.rejects(
        async () => await authService.adminLogin("admin@example.com", "wrong-pass"),
        { message: "Invalid email or password" }
      );
    });

    await st.test("AUTH-U-010: Admin login non-existent user", async (t) => {
      t.mock.method(User, "findOne", async () => null);

      await assert.rejects(
        async () => await authService.adminLogin("ghost", "pass"),
        { message: "Invalid email or password" }
      );
    });
  });

  await t.test("1.4 Unit Tests — updateStudent", async (st) => {
    await st.test("AUTH-U-011: Update student name", async (t) => {
      const mockUpdatedUser = { _id: "user123", name: "New Name", email: "test@example.com" };
      
      const mockSelect = () => mockUpdatedUser;
      const mockFindByIdAndUpdate = async () => ({ select: mockSelect });
      
      t.mock.method(TestUser, "findByIdAndUpdate", () => ({ select: mockSelect }));

      const result = await authService.updateStudent("user123", { name: "New Name" });
      assert.strictEqual(result.name, "New Name");
    });

    await st.test("AUTH-U-012: Reject duplicate username", async (t) => {
      t.mock.method(TestUser, "findOne", async () => ({ _id: "otherUser", userName: "takenName" }));

      await assert.rejects(
        async () => await authService.updateStudent("user123", { userName: "takenName" }),
        { message: "Username already taken" }
      );
    });

    await st.test("AUTH-U-013: Hash password on update", async (t) => {
      t.mock.method(TestUser, "findOne", async () => null);
      
      let capturedUpdateData = null;
      t.mock.method(TestUser, "findByIdAndUpdate", (id, updateDoc) => {
        capturedUpdateData = updateDoc.$set;
        return { select: () => ({ _id: "user123" }) };
      });

      await authService.updateStudent("user123", { password: "new-password" });
      
      assert.ok(capturedUpdateData.password);
      assert.notStrictEqual(capturedUpdateData.password, "new-password");
      assert.ok(await bcrypt.compare("new-password", capturedUpdateData.password));
    });

    await st.test("AUTH-U-014: Student not found", async (t) => {
      t.mock.method(TestUser, "findByIdAndUpdate", () => ({ select: () => null }));

      await assert.rejects(
        async () => await authService.updateStudent("badId", { name: "New" }),
        { message: "Student not found" }
      );
    });
  });

  await t.test("1.5 Unit Tests — deleteStudent", async (st) => {
    await st.test("AUTH-U-015: Cascade delete all student data", async (t) => {
      const studentId = "student123";
      
      // Mock DB Finds
      t.mock.method(CafExamAnswer, "find", async () => [{ submittedPdfUrl: "/path/caf.pdf" }]);
      t.mock.method(Answer, "find", async () => [{ marksObtained: { q1: { pdfUrl: "/path/ans.pdf" } } }]);
      
      // Mock DB Deletes
      const cafDeleteMock = t.mock.method(CafExamAnswer, "deleteMany", async () => true);
      const prcDeleteMock = t.mock.method(PRCAnswer, "deleteMany", async () => true);
      const ansDeleteMock = t.mock.method(Answer, "deleteMany", async () => true);
      const userDeleteMock = t.mock.method(TestUser, "findByIdAndDelete", async () => ({ _id: studentId }));

      // Mock FS
      t.mock.method(fs, "existsSync", () => true);
      const unlinkMock = t.mock.method(fs, "unlinkSync", () => true);

      const result = await authService.deleteStudent(studentId);

      assert.strictEqual(result._id, studentId);
      assert.strictEqual(cafDeleteMock.mock.calls.length, 1);
      assert.strictEqual(prcDeleteMock.mock.calls.length, 1);
      assert.strictEqual(ansDeleteMock.mock.calls.length, 1);
      assert.strictEqual(userDeleteMock.mock.calls.length, 1);
      assert.strictEqual(unlinkMock.mock.calls.length, 2); // 1 caf, 1 standard
    });

    await st.test("AUTH-U-016: Delete student with no answers", async (t) => {
      const studentId = "student123";
      
      t.mock.method(CafExamAnswer, "find", async () => []);
      t.mock.method(Answer, "find", async () => []);
      
      t.mock.method(CafExamAnswer, "deleteMany", async () => true);
      t.mock.method(PRCAnswer, "deleteMany", async () => true);
      t.mock.method(Answer, "deleteMany", async () => true);
      t.mock.method(TestUser, "findByIdAndDelete", async () => ({ _id: studentId }));

      const existsMock = t.mock.method(fs, "existsSync", () => false);
      const unlinkMock = t.mock.method(fs, "unlinkSync", () => false);

      await authService.deleteStudent(studentId);

      assert.strictEqual(unlinkMock.mock.calls.length, 0);
    });

    await st.test("AUTH-U-017: Delete non-existent student", async (t) => {
      t.mock.method(CafExamAnswer, "find", async () => []);
      t.mock.method(Answer, "find", async () => []);
      t.mock.method(CafExamAnswer, "deleteMany", async () => true);
      t.mock.method(PRCAnswer, "deleteMany", async () => true);
      t.mock.method(Answer, "deleteMany", async () => true);
      t.mock.method(TestUser, "findByIdAndDelete", async () => null);

      await assert.rejects(
        async () => await authService.deleteStudent("badId"),
        { message: "Student not found" }
      );
    });

    await st.test("AUTH-U-018: Handle missing PDF files gracefully", async (t) => {
      const studentId = "student123";
      t.mock.method(CafExamAnswer, "find", async () => [{ submittedPdfUrl: "/path/missing.pdf" }]);
      t.mock.method(Answer, "find", async () => []);
      
      t.mock.method(CafExamAnswer, "deleteMany", async () => true);
      t.mock.method(PRCAnswer, "deleteMany", async () => true);
      t.mock.method(Answer, "deleteMany", async () => true);
      t.mock.method(TestUser, "findByIdAndDelete", async () => ({ _id: studentId }));

      t.mock.method(fs, "existsSync", () => true);
      const unlinkMock = t.mock.method(fs, "unlinkSync", () => { throw new Error("File not found"); });

      // Should not throw
      const result = await authService.deleteStudent(studentId);
      assert.strictEqual(result._id, studentId);
      assert.strictEqual(unlinkMock.mock.calls.length, 1);
    });
  });
});

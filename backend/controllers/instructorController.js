import * as instructorService from "../services/instructorService.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerInstructor = asyncHandler(async (req, res) => {
  const { name, userName, courses, password } = req.body;
  await instructorService.registerInstructor(
    name,
    userName,
    courses,
    password
  );

  return res.status(201).json({
    message: "Instructor registered successfully",
    success: true,
  });
});

export const instructorLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const instructor = await instructorService.loginInstructor(
    username,
    password
  );

  const token = generateTokenAndSetCookie(instructor, res, "instructorToken", "instructor");

  return res.status(200).json({
    message: "✅ Instructor logged in successfully",
    success: true,
    instructor: {
      id: instructor._id,
      name: instructor.name,
      userName: instructor.userName,
      courses: instructor.courses,
    },
  });
});

export const getAllSubjects = asyncHandler(async (req, res) => {
  const { instructorId } = req.params;
  const subjects = await instructorService.getAllSubjectsByInstructor(
    instructorId
  );

  return res.status(200).json({
    message: "✅ Subjects fetched successfully",
    success: true,
    subjects,
  });
});

export const verifyInstructorSession = (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    instructor: req.instructor,
  });
};

export const getExamsBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { subjectType } = req.query; // Extract subjectType
  const exams = await instructorService.getExamsBySubject(
    subjectId,
    subjectType
  );

  return res.status(200).json({
    success: true,
    message: "✅ Exams fetched successfully",
    exams,
  });
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { subjectType } = req.query;
  const submissions = await instructorService.getSubmissionsByQuestion(
    questionId,
    subjectType
  );

  return res.status(200).json({
    success: true,
    message:
      submissions.length > 0
        ? "✅ Submissions fetched successfully"
        : "No submissions found for this question",
    total: submissions.length,
    submissions,
  });
});

export const getExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = await instructorService.getExamById(examId);

  return res.status(200).json({
    success: true,
    message: "✅ Exam fetched successfully",
    exam,
  });
});

export const getStudentAnswers = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const { subjectType } = req.query;
  const answersDoc = await instructorService.getStudentAnswers(
    studentId,
    examId,
    subjectType
  );

  return res.status(200).json({
    success: true,
    message:
      "✅ Student answers fetched (new PDFs created only where missing)",
    answers: answersDoc,
  });
});

export const uploadCheckedPdfs = asyncHandler(async (req, res) => {
  const { marksObtained } = JSON.parse(req.body.data);
  const updatedMarks = await instructorService.uploadCheckedPdfs(
    req.files,
    marksObtained
  );

  res.json({
    message: "✅ Checked PDFs uploaded and old ones replaced successfully",
    updatedMarks,
  });
});

export const updateStudentMarks = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const { marksObtained, status } = req.body;
  const { subjectType } = req.query;

  const updatedAnswer = await instructorService.updateStudentMarks(
    studentId,
    examId,
    marksObtained,
    status,
    subjectType
  );

  return res.status(200).json({
    success: true,
    message: "✅ Student marks updated successfully",
    updatedAnswer,
  });
});

export const logout = (req, res) => {
  res.clearCookie("instructorToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    success: true,
    message: "✅ Instructor logged out successfully",
  });
};

export const getAllInstructors = asyncHandler(async (req, res) => {
  const instructors = await instructorService.getAllInstructors();
  res.status(200).json(instructors);
});

export const updateInstructor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedInstructor = await instructorService.updateInstructor(
    id,
    req.body
  );
  res.status(200).json({
    message: "Instructor updated successfully",
    instructor: updatedInstructor,
  });
});

export const deleteInstructor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await instructorService.deleteInstructor(id);
  res.status(200).json({ message: "Instructor deleted successfully" });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const { subjectType } = req.query;

  await instructorService.deleteSubmission(studentId, examId, subjectType);

  return res.status(200).json({
    success: true,
    message: "✅ Submission deleted successfully",
  });
});

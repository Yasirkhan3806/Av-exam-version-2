import * as subjectService from "../services/subjectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = (req, res) => {
  res.send("Subject routes are under construction.");
};

export const addSubject = asyncHandler(async (req, res) => {
  const { name, description, instructor, courses, type } = req.body;
  await subjectService.addSubject(
    name,
    description,
    instructor,
    courses,
    type
  );
  res.status(201).send("Subject added successfully.");
});

export const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getAllSubjects();
  res.status(200).json(subjects);
});

export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubjectById(req.params.id);
  res.status(200).json(subject);
});

export const getNotEnrolledStudents = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  const students = await subjectService.getNotEnrolledStudents(subjectId);
  res.status(200).json(students);
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  const { studentId } = req.body;
  const student = await subjectService.enrollStudent(studentId, subjectId);
  res.status(200).json(student);
});

export const getEnrolledStudents = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  const students = await subjectService.getEnrolledStudents(subjectId);
  res.status(200).json(students);
});

export const unenrollStudent = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  const { studentId } = req.body;
  const student = await subjectService.unenrollStudent(studentId, subjectId);
  res.status(200).json(student);
});

export const getEnrolledSubjects = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const subjects = await subjectService.getEnrolledSubjects(studentId);
  res.status(200).json(subjects);
});

export const getExamsForSubject = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  const userId = req.user.userId;
  const subjectType = req.params.subjectType;
  const exams = await subjectService.getExamsForSubject(subjectId, userId, subjectType);
  res.status(200).json(exams);
});

export const getResults = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user.userId !== studentId) {
    return res.status(403).json({ message: "Access denied." });
  }
  const results = await subjectService.getResults(studentId);
  res.status(200).json(results);
});

export const getStudentAnswers = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  if (req.user.userId !== studentId) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }
  const answers = await subjectService.getStudentAnswers(studentId, examId);

  return res.status(200).json({
    success: true,
    message: "✅ Student answers fetched successfully",
    answers,
  });
});

export const calculateGrade = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.params;
  const gradeData = await subjectService.calculateGrade(studentId, subjectId);
  res.json(gradeData);
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const updatedSubject = await subjectService.updateSubject(id, updateData);
  res.status(200).json({
    message: "Subject updated successfully.",
    subject: updatedSubject,
  });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await subjectService.deleteSubject(id);
  res
    .status(200)
    .json({ message: "Subject and associated data deleted successfully." });
});

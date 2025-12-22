import mongoose from "mongoose";
import { Subject, TestUser, Questions, Answer } from "../models/index.js";

export const addSubject = async (name, description, instructor, courses, type) => {
  if (!name || !description || !instructor || !type) {
    throw new Error("Name, description, type and instructor are required.");
  }

  const existingSubject = await Subject.findOne({ name, instructor });
  if (existingSubject) {
    throw new Error("Subject already exists for this instructor.");
  }

  const newSubject = new Subject({
    name,
    description,
    instructor,
    courses,
    type
  });

  await newSubject.save();
  return newSubject;
};

export const getAllSubjects = async () => {
  const subjects = await Subject.find().populate("instructor", "name userName");
  return subjects;
};

export const getSubjectById = async (id) => {
  const subject = await Subject.findById(id).populate(
    "instructor",
    "name userName"
  );
  if (!subject) {
    throw new Error("Subject not found.");
  }
  return subject;
};

export const getNotEnrolledStudents = async (subjectId) => {
  if (!subjectId) {
    throw new Error("subjectId is required.");
  }

  const enrolledStudents = await TestUser.find({
    subjectsEnrolled: subjectId,
  }).select("_id");
  const enrolledStudentIds = enrolledStudents.map((student) => student._id);
  const notEnrolledStudents = await TestUser.find({
    _id: { $nin: enrolledStudentIds },
  }).select("name userName email");

  return notEnrolledStudents;
};

export const enrollStudent = async (studentId, subjectId) => {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const student = await TestUser.findByIdAndUpdate(
    studentId,
    { $addToSet: { subjectsEnrolled: subjectId } },
    { new: true }
  );

  if (!student) {
    throw new Error("Student not found.");
  }

  return student;
};

export const getEnrolledStudents = async (subjectId) => {
  if (!subjectId) {
    throw new Error("subjectId is required.");
  }

  const enrolledStudents = await TestUser.find({
    subjectsEnrolled: subjectId,
  }).select("name userName email");
  return enrolledStudents;
};

export const unenrollStudent = async (studentId, subjectId) => {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const student = await TestUser.findByIdAndUpdate(
    studentId,
    { $pull: { subjectsEnrolled: subjectId } },
    { new: true }
  );

  if (!student) {
    throw new Error("Student not found.");
  }

  return student;
};

export const getEnrolledSubjects = async (studentId) => {
  if (!studentId) {
    throw new Error("studentId is required.");
  }

  const student = await TestUser.findById(studentId).populate({
    path: "subjectsEnrolled",
    select: "_id name description",
  });

  if (!student) {
    throw new Error("Student not found.");
  }

  return student.subjectsEnrolled;
};

export const getExamsForSubject = async (subjectId, userId) => {
  if (!subjectId) {
    throw new Error("subjectId is required.");
  }

  const exams = await Questions.aggregate([
    {
      $match: { subject: new mongoose.Types.ObjectId(subjectId) },
    },
    {
      $lookup: {
        from: "Answers",
        let: { examId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$questionSet", "$$examId"] },
                  { $eq: ["$Student", new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "userAnswer",
      },
    },
    {
      $addFields: {
        completed: { $gt: [{ $size: "$userAnswer" }, 0] },
      },
    },
    {
      $project: {
        _id: 1,
        questionSetName: "$name",
        totalQuestions: 1,
        totalTime: "$totalAttempt",
        mockExam: 1,
        description: 1,
        totalMarks: 1,
        completed: 1,
      },
    },
  ]);

  return exams;
};

export const getResults = async (studentId) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid student ID");
  }

  const results = await Answer.find({ Student: studentId, status: "checked" })
    .populate("questionSet", "_id name totalAttempt totalMarks totalQuestions")
    .sort({ checkedAt: -1 });

  return results;
};

export const getStudentAnswers = async (studentId, examId) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new Error("Invalid student ID or exam ID");
  }

  const answers = await Answer.findOne({
    Student: studentId,
    questionSet: examId,
  }).populate("questionSet", "_id name totalAttempt totalMarks totalQuestions");

  if (!answers) {
    throw new Error("No answers found for this student and exam");
  }

  return answers;
};

export const calculateGrade = async (studentId, subjectId) => {
  const questionSets = await Questions.find({ subject: subjectId });
  if (!questionSets.length) {
    throw new Error("No question sets found for this subject.");
  }

  const questionSetIds = questionSets.map((q) => q._id);

  const answers = await Answer.find({
    Student: studentId,
    questionSet: { $in: questionSetIds },
    status: "checked",
  });

  if (!answers.length) {
    throw new Error(
      "No checked answers found for this student in this subject."
    );
  }

  let totalMarks = 0;
  let obtainedMarks = 0;

  for (const answer of answers) {
    const relatedQuestionSet = questionSets.find((q) =>
      q._id.equals(answer.questionSet)
    );
    if (!relatedQuestionSet) continue;

    totalMarks += relatedQuestionSet.totalMarks;

    const marksData = Object.values(answer.marksObtained || {});
    const studentMarks = marksData.reduce((sum, item) => {
      return sum + (item?.marks ? Number(item.marks) : 0);
    }, 0);

    obtainedMarks += studentMarks;
  }

  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);
  let grade = "F";
  if (percentage >= 85) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 55) grade = "C";
  else if (percentage >= 40) grade = "D";

  const subject = await Subject.findById(subjectId);

  return {
    subject: subject?.name || "Unknown Subject",
    totalMarks,
    obtainedMarks,
    percentage: Number(percentage),
    grade,
  };
};

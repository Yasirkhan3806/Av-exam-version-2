import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import {
  Subject,
  TestUser,
  Questions,
  Answer,
  CafExamQuestions,
  CafExamAnswer,
  PRCExam,
  PRCAnswer,
} from "../models/index.js";
import { getExamAndAnswerModels } from "../utils/examTypeResolver.js";
import { AppError } from "../utils/AppError.js";

export const addSubject = async (
  name,
  description,
  instructor,
  courses,
  type
) => {
  if (!name || !description || !instructor || !type) {
    throw new AppError("Name, description, type and instructor are required.", 400);
  }

  const existingSubject = await Subject.findOne({ name, instructor });
  if (existingSubject) {
    throw new AppError("Subject already exists for this instructor.", 409);
  }

  const newSubject = new Subject({
    name,
    description,
    instructor,
    courses,
    type,
  });

  try {
    await newSubject.save();
  } catch (err) {
    // Concurrent request won the race — the unique index on
    // {name, instructor} rejects this one. Same domain error as the findOne
    // check above would have given if it had run a moment later.
    if (err.code === 11000) {
      throw new AppError("Subject already exists for this instructor.", 409);
    }
    throw err;
  }
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
    throw new AppError("Subject not found.", 404);
  }
  return subject;
};

export const getNotEnrolledStudents = async (subjectId) => {
  if (!subjectId) {
    throw new AppError("subjectId is required.", 400);
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
    throw new AppError("studentId is required.", 400);
  }

  const student = await TestUser.findByIdAndUpdate(
    studentId,
    { $addToSet: { subjectsEnrolled: subjectId } },
    { new: true }
  );

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  return student;
};

export const getEnrolledStudents = async (subjectId) => {
  if (!subjectId) {
    throw new AppError("subjectId is required.", 400);
  }

  const enrolledStudents = await TestUser.find({
    subjectsEnrolled: subjectId,
  }).select("name userName email");
  return enrolledStudents;
};

export const unenrollStudent = async (studentId, subjectId) => {
  if (!studentId) {
    throw new AppError("studentId is required.", 400);
  }

  const student = await TestUser.findByIdAndUpdate(
    studentId,
    { $pull: { subjectsEnrolled: subjectId } },
    { new: true }
  );

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  return student;
};

export const getEnrolledSubjects = async (studentId) => {
  if (!studentId) {
    throw new AppError("studentId is required.", 400);
  }

  const student = await TestUser.findById(studentId).populate({
    path: "subjectsEnrolled",
    select: "_id name description type",
  });

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  return student.subjectsEnrolled;
};

// PRC has no status field or lifecycle at all — it's auto-graded and
// written once, atomically, on submit. Existence of a doc *is* completion
// for PRC. (A status-based check here always evaluates false for it, since
// the field is never set — see backend/models/PrcExamAnswer.js.) CAF and
// regular exam answers both have a real draft -> submitted -> checked
// lifecycle (models/CafExamAnswer.js, models/Answer.js), so "completed"
// must check status there — an in-progress draft shouldn't count.
const getCollectionConfig = (subjectType) => {
  const { Q: Model, A: AnswerModel } = getExamAndAnswerModels(subjectType);
  return {
    Model,
    answerCollection: AnswerModel.collection.name,
    usesStatusLifecycle: subjectType !== "PRC",
  };
};

export const getExamsForSubject = async (subjectId, userId, subjectType) => {
  if (!subjectId) throw new AppError("subjectId is required.", 400);

  // 1. Get the appropriate models/collections
  const { Model, answerCollection, usesStatusLifecycle } = getCollectionConfig(subjectType);

  const completedExpr = usesStatusLifecycle
    ? { $in: [{ $arrayElemAt: ["$userAnswer.status", 0] }, ["submitted", "checked"]] }
    : { $gt: [{ $size: "$userAnswer" }, 0] };

  // 2. Execute Aggregation
  const exams = await Model.aggregate([
    {
      $match: { subject: new mongoose.Types.ObjectId(subjectId) },
    },
    {
      $lookup: {
        from: answerCollection,
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
        completed: completedExpr,
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
    throw new AppError("Invalid student ID", 400);
  }

  const cfapResults = await Answer.find({
    Student: studentId,
    status: "checked",
  })
    .populate("questionSet", "_id name totalAttempt totalMarks totalQuestions subject")
    .sort({ checkedAt: -1 })
    .lean();

  const cafResults = await CafExamAnswer.find({
    Student: studentId,
    status: "checked",
  })
    .populate("questionSet", "_id name totalAttempt totalMarks totalQuestions subject")
    .sort({ checkedAt: -1 })
    .lean();

  const cfapWithTypes = cfapResults.map((r) => ({
    ...r,
    subjectType: "CFAP",
  }));

  const cafWithTypes = cafResults.map((r) => ({ ...r, subjectType: "CAF" }));

  const allResults = [...cfapWithTypes, ...cafWithTypes].sort((a, b) => {
    return new Date(b.checkedAt) - new Date(a.checkedAt);
  });

  return allResults;
};

export const getStudentAnswers = async (studentId, examId) => {
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(examId)
  ) {
    throw new AppError("Invalid student ID or exam ID", 400);
  }

  const answers = await Answer.findOne({
    Student: studentId,
    questionSet: examId,
  }).populate("questionSet", "_id name totalAttempt totalMarks totalQuestions");

  if (!answers) {
    throw new AppError("No answers found for this student and exam", 404);
  }

  return answers;
};

export const calculateGrade = async (studentId, subjectId) => {
  const questionSets = await Questions.find({ subject: subjectId });
  if (!questionSets.length) {
    throw new AppError("No question sets found for this subject.", 404);
  }

  const questionSetIds = questionSets.map((q) => q._id);

  const answers = await Answer.find({
    Student: studentId,
    questionSet: { $in: questionSetIds },
    status: "checked",
  });

  if (!answers.length) {
    throw new AppError(
      "No checked answers found for this student in this subject.",
      404
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

export const updateSubject = async (id, updateData) => {
  if (!id) {
    throw new AppError("Subject ID is required.", 400);
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("instructor", "name userName");

  if (!updatedSubject) {
    throw new AppError("Subject not found.", 404);
  }

  return updatedSubject;
};

export const deleteSubject = async (subjectId) => {
  if (!subjectId) {
    throw new AppError("Subject ID is required.", 400);
  }

  // 1. Find all exam IDs for this subject across all types
  const standardExams = await Questions.find({ subject: subjectId }).select(
    "_id"
  );
  const cafExams = await CafExamQuestions.find({ subject: subjectId }).select(
    "_id"
  );
  const prcExams = await PRCExam.find({ subject: subjectId }).select("_id");

  const standardExamIds = standardExams.map((q) => q._id);
  const cafExamIds = cafExams.map((q) => q._id);
  const prcExamIds = prcExams.map((q) => q._id);

  // 2. Delete Standard Exam Answers and their associated PDFs
  if (standardExamIds.length > 0) {
    const answers = await Answer.find({
      questionSet: { $in: standardExamIds },
    });
    for (const answer of answers) {
      if (answer.marksObtained) {
        Object.values(answer.marksObtained).forEach((data) => {
          if (data && data.pdfUrl) {
            const fullPath = path.resolve(data.pdfUrl);
            if (fs.existsSync(fullPath)) {
              try {
                fs.unlinkSync(fullPath);
              } catch (err) {
                console.error(`Failed to delete answer PDF ${fullPath}:`, err);
              }
            }
          }
        });
      }
    }
    await Answer.deleteMany({ questionSet: { $in: standardExamIds } });
  }

  // 3. Delete CAF Exam Answers and their associated PDFs
  if (cafExamIds.length > 0) {
    const cafAnswers = await CafExamAnswer.find({
      questionSet: { $in: cafExamIds },
    });
    for (const answer of cafAnswers) {
      if (answer.submittedPdfUrl) {
        const fullPath = path.resolve(answer.submittedPdfUrl);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (err) {
            console.error(`Failed to delete CAF answer PDF ${fullPath}:`, err);
          }
        }
      }
    }
    await CafExamAnswer.deleteMany({ questionSet: { $in: cafExamIds } });
  }

  // 4. Delete PRC Exam Answers
  if (prcExamIds.length > 0) {
    await PRCAnswer.deleteMany({ questionSet: { $in: prcExamIds } });
  }

  // 5. Delete the exam documents themselves
  await Questions.deleteMany({ subject: subjectId });
  await CafExamQuestions.deleteMany({ subject: subjectId });
  await PRCExam.deleteMany({ subject: subjectId });

  // 6. Delete PDF assets (Exam PDFs and split pages) from local storage
  const subjectDir = path.join("TestQuestions", subjectId.toString());
  if (fs.existsSync(subjectDir)) {
    try {
      fs.rmSync(subjectDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to delete PDF directory ${subjectDir}:`, err);
    }
  }

  // 7. Unenroll all students
  await TestUser.updateMany(
    { subjectsEnrolled: subjectId },
    { $pull: { subjectsEnrolled: subjectId } }
  );

  // 8. Delete the subject itself
  const result = await Subject.findByIdAndDelete(subjectId);

  if (!result) {
    throw new AppError("Subject not found.", 404);
  }

  return result;
};

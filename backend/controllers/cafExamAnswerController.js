import * as cafExamAnswerService from "../services/cafExamAnswerService.js";

export const submitCafAnswer = async (req, res) => {
  try {
    const studentId = req.user.userId; // Get from token
    const { questionId } = req.body;

    const result = await cafExamAnswerService.submitCafAnswer(
      { studentId, questionId },
      req.file
    );

    return res.status(201).json({
      message: "CAF Exam answer submitted successfully",
      data: result,
    });
  } catch (err) {
    if (err.message === "Missing required fields or PDF file") {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getStudentAnswers = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const answers = await cafExamAnswerService.getAnswersByStudent(studentId);
    return res.status(200).json(answers);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getSubmissionForInstructor = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const submission = await cafExamAnswerService.getSubmission(
      studentId,
      examId
    );
    return res.status(200).json(submission);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { examId } = req.params;
    const submission = await cafExamAnswerService.getMySubmission(
      studentId,
      examId
    );
    return res.status(200).json(submission);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const markSubmission = async (req, res) => {
  try {
    const { studentId, examId, marks } = req.body;
    const result = await cafExamAnswerService.markSubmission(
      studentId,
      examId,
      req.file,
      marks
    );
    return res
      .status(200)
      .json({ message: "Submission marked successfully", data: result });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

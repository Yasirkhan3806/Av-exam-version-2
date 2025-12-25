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

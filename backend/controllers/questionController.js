import * as questionService from "../services/questionService.js";

export const addQuestions = async (req, res) => {
  try {
    const dataset = await questionService.addQuestions(req.body, req.file);
    return res.status(200).json({
      id: dataset._id,
      message: "Dataset saved successfully",
    });
  } catch (err) {
    if (
      err.message === "All fields are required" ||
      err.message === "No PDF file uploaded"
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { subjectId, subjectType } = req.params;
    const questions = await questionService.getQuestionsBySubject(
      subjectId,
      subjectType
    );
    return res.status(200).json(questions);
  } catch (err) {
    if (err.message === "subjectId is required") {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const questionData = await questionService.getQuestionById(req.params.id, req.params.subjectType);
    return res.status(200).json(questionData);
  } catch (err) {
    if (err.message === "Question not found") {
      return res.status(404).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const getFullQuestionById = async (req, res) => {
  try {
    const exam = await questionService.getFullQuestionById(req.params.id);
    return res.status(200).json(exam);
  } catch (err) {
    if (err.message === "Exam not found") {
      return res.status(404).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await questionService.deleteQuestion(req.params.id);
    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    if (err.message === "Question not found") {
      return res.status(404).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const submitAnswers = async (req, res) => {
  try {
    const { answers, questionSet } = req.body;
    const { ExamId } = req.exam;

    if (!questionSet) {
      return res.status(400).json({ error: "questionSet is required" });
    }

    const updatedDoc = await questionService.submitAnswers(ExamId, answers);

    return res.status(200).json({
      message: "Answers updated successfully",
      id: updatedDoc._id,
    });
  } catch (err) {
    if (
      err.message === "Answers are required" ||
      err.message === "No existing answers to update"
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const startExam = async (req, res) => {
  try {
    const { questionSet } = req.body;
    const studentId = req.user.userId;

    const { answerDoc, examToken } = await questionService.startExam(
      questionSet,
      studentId
    );

    res.cookie("ExamToken", examToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Exam session started",
      ExamId: answerDoc._id,
      ExamToken: examToken,
    });
  } catch (err) {
    if (err.message === "questionSet is required") {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const finishExam = async (req, res) => {
  try {
    res.clearCookie("ExamToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Exam finished, ExamToken cleared",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const addCafQuestionsController = async (req, res) => {
  try {
    const result = await questionService.addCafQuestions(req.body, req.file);
    return res.status(201).json({
      message: "CAF questions added successfully",
      data: result,
    });
  } catch (err) {
    if (
      err.message === "All fields are required" ||
      err.message === "No PDF file uploaded"
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await questionService.updateQuestion(
      id,
      req.body,
      req.file
    );
    return res.status(200).json({
      message: "Exam updated successfully",
      exam: updatedExam,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

export const updateCafQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await questionService.updateCafQuestion(
      id,
      req.body,
      req.file
    );
    return res.status(200).json({
      message: "CAF Exam updated successfully",
      exam: updatedExam,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

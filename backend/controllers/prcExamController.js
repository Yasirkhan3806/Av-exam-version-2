import * as prcExamService from "../services/prcExamService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const createPRCExam = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    throw new AppError("Excel file is required", 400);
  }

  const examData = req.body;
  const prcExam = await prcExamService.createExam(examData, file.path);
  res.status(201).json(prcExam);
});

export const getPRCExamById = asyncHandler(async (req, res) => {
  const exam = await prcExamService.getExamById(req.params.id);
  res.status(200).json(exam);
});

export const submitPRCExamResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body; // { questionId: optionLabel }

  const result = await prcExamService.verifyExamAnswers(id, answers);
  res.status(200).json(result);
});

export const submitDetailedResult = asyncHandler(async (req, res) => {
  // Student comes from the verified token, never from the request body —
  // otherwise a student could save a result under someone else's id.
  const studentId = req.user.userId;
  const result = req.body;
  await prcExamService.saveDetailedResult(result, studentId);
  res.status(200).json({ message: "Detailed result saved successfully" });
});

export const getDetailedResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const result = await prcExamService.getDetailedResult(id, userId);
  res.status(200).json(result);
});

export const updatePRCExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const updatedExam = await prcExamService.updateExam(id, updateData);
  res.status(200).json(updatedExam);
});

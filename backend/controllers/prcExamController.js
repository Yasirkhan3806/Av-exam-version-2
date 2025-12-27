import * as prcExamService from "../services/prcExamService.js";

export const createPRCExam = async (req, res) => {
  console.log("Creating PRC Exam...");
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const examData = req.body;
    console.log("Exam Data:", examData);
    // Basic validation
    if (!examData.name || !examData.totalTime || !examData.totalMarks) {
      // Validation could be stricter or handled by Joi/Zod
      // For now, let's proceed, usually service or model will error if required fields missing
    }

    const prcExam = await prcExamService.createExam(examData, file.path);
    console.log("PRC Exam Created:", prcExam);
    res.status(201).json(prcExam);
  } catch (error) {
    console.error("Error creating PRC Exam:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPRCExamById = async (req, res) => {
  try {
    const exam = await prcExamService.getExamById(req.params.id);
    res.status(200).json(exam);
  } catch (error) {
    console.error("Error fetching PRC Exam:", error);
    if (error.message === "Exam not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export const submitPRCExamResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // { questionId: optionLabel }

    const result = await prcExamService.verifyExamAnswers(id, answers);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error submitting PRC Exam:", error);
    res.status(500).json({ message: error.message });
  }
};

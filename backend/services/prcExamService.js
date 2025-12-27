import { PRCExam } from "../models/index.js";
import xlsx from "xlsx";
import fs from "fs";

export const createExam = async (data, filePath) => {
  try {
    // Parse Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Remove header row if it exists (assuming first row is header if contains "Question")
    let rows = jsonData;
    if (
      rows.length > 0 &&
      rows[0][0] &&
      typeof rows[0][0] === "string" &&
      rows[0][0].toLowerCase().includes("question")
    ) {
      rows = rows.slice(1);
    }

    const mcqs = rows
      .map((row, index) => {
        // Assume format: Question | Option 1 | Option 2 | Option 3 | ... | Correct Answer
        // Filter out empty rows or cells
        const validCells = row.filter(
          (cell) => cell !== null && cell !== undefined && cell !== ""
        );

        if (validCells.length < 3) return null; // Need at least question, one option, answer (unlikely but safe)

        const questionText = row[0];
        const correctAnswerRaw = row[row.length - 1]; // Last column is correct answer
        const correctAnswer = String(correctAnswerRaw).trim().toUpperCase();

        // Options are in between
        const optionCells = row.slice(1, row.length - 1);
        const options = optionCells.map((opt, i) => {
          const label = String.fromCharCode(65 + i); // A, B, C...
          return {
            label,
            text: String(opt).trim(),
          };
        });

        return {
          id: index + 1,
          questionText: String(questionText).trim(),
          options,
          correctAnswer,
        };
      })
      .filter((mcq) => mcq !== null);

    const prcExam = new PRCExam({
      name: data.name,
      subject: data.subjectId,
      description: data.desc,
      totalAttempt: data.totalTime,
      totalMarks: data.totalMarks,
      totalQuestions: mcqs.length, // Calculate from parsed rows
      mcqs: mcqs,
    });

    await prcExam.save();

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }

    return prcExam; 
  } catch (error) {
    // ensure file is deleted on error too
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }
    throw error;
  }
};

export const getExamById = async (id) => {
  const exam = await PRCExam.findById(id)
    .select("-mcqs.correctAnswer")
    .populate("subject");
  if (!exam) {
    throw new Error("Exam not found");
  }
  return exam;
};

export const verifyExamAnswers = async (id, userAnswers) => {
  const exam = await PRCExam.findById(id);
  if (!exam) {
    throw new Error("Exam not found");
  }

  let correctCount = 0;
  const detailedResult = exam.mcqs.map((q) => {
    const selected = userAnswers[q.id] || null; // q.id is the unique ID from Excel parsing (1, 2, 3...) or _id if accessed via subdoc

    // We need to map userAnswers keys (which might be _id or numeric id) to the question
    // In store we used q._id || q.id. Let's ensure consistency.
    // The store sends { questionId: answerLabel }.

    // Finding the answer corresponding to this question
    // If store sends key as `_id`, we match by `_id`.
    const answerKey = q._id.toString();
    const userAnswer = userAnswers[answerKey];

    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionId: q._id,
      questionText: q.questionText,
      selectedOption: userAnswer,
      correctAnswer: q.correctAnswer, // Send back correct answer now
      isCorrect,
      options: q.options,
    };
  });

  return {
    total: exam.mcqs.length,
    correct: correctCount,
    wrong: exam.mcqs.length - correctCount,
    detailed: detailedResult,
  };
};

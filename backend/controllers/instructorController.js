import * as instructorService from "../services/instructorService.js";
import { generateTokenAndSetCookie } from "../utils/middleware.js";

export const registerInstructor = async (req, res) => {
  try {
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
  } catch (e) {
    console.error(e);
    if (
      e.message === "All fields are required" ||
      e.message === "Instructor with this username already exists"
    ) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const instructorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const instructor = await instructorService.loginInstructor(
      username,
      password
    );

    generateTokenAndSetCookie(instructor, res, "instructorToken");

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
  } catch (e) {
    console.error(e);
    if (
      e.message === "Username and password are required" ||
      e.message === "Invalid username or password"
    ) {
      const statusCode =
        e.message === "Username and password are required" ? 400 : 401;
      return res.status(statusCode).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const subjects = await instructorService.getAllSubjectsByInstructor(
      instructorId
    );

    return res.status(200).json({
      message: "✅ Subjects fetched successfully",
      success: true,
      subjects,
    });
  } catch (e) {
    console.error("❌ Error fetching subjects:", e);
    if (e.message === "Invalid instructor ID") {
      return res.status(400).json({ message: e.message });
    }
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const verifyInstructorSession = (req, res) => {
  return res.status(200).json({
    message: "✅ Token valid",
    instructor: req.instructor,
  });
};

export const getExamsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const exams = await instructorService.getExamsBySubject(subjectId);

    return res.status(200).json({
      success: true,
      message: "✅ Exams fetched successfully",
      exams,
    });
  } catch (error) {
    console.error("❌ Error fetching exams:", error);
    if (error.message === "Invalid subject ID") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Subject not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const { questionId } = req.params;
    const submissions = await instructorService.getSubmissionsByQuestion(
      questionId
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
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    if (error.message === "Invalid question ID") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Question not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await instructorService.getExamById(examId);

    return res.status(200).json({
      success: true,
      message: "✅ Exam fetched successfully",
      exam,
    });
  } catch (error) {
    console.error("❌ Error fetching exam:", error);
    if (error.message === "Invalid exam ID") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Exam not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getStudentAnswers = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const answersDoc = await instructorService.getStudentAnswers(
      studentId,
      examId
    );

    return res.status(200).json({
      success: true,
      message:
        "✅ Student answers fetched (new PDFs created only where missing)",
      answers: answersDoc,
    });
  } catch (error) {
    console.error("❌ Error fetching student answers:", error);
    if (error.message === "Invalid student ID or exam ID") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "No answers found for this student and exam") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const uploadCheckedPdfs = async (req, res) => {
  try {
    const { marksObtained } = JSON.parse(req.body.data);
    const updatedMarks = await instructorService.uploadCheckedPdfs(
      req.files,
      marksObtained
    );

    res.json({
      message: "✅ Checked PDFs uploaded and old ones replaced successfully",
      updatedMarks,
    });
  } catch (error) {
    console.error("❌ Error in uploadCheckedPdfs:", error);
    res.status(500).json({ error: "Failed to process files" });
  }
};

export const updateStudentMarks = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { marksObtained, status } = req.body;

    const updatedAnswer = await instructorService.updateStudentMarks(
      studentId,
      examId,
      marksObtained,
      status
    );

    return res.status(200).json({
      success: true,
      message: "✅ Student marks updated successfully",
      updatedAnswer,
    });
  } catch (error) {
    console.error("❌ Error updating student marks:", error);
    if (error.message === "Invalid student ID or exam ID") {
      return res.status(400).json({ message: error.message });
    }
    if (
      error.message === "No answer document found for this student and exam"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("instructorToken");
    return res.status(200).json({
      success: true,
      message: "✅ Instructor logged out successfully",
    });
  } catch (error) {
    console.error("❌ Error logging out:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

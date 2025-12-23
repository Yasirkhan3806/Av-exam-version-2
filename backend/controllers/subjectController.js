import * as subjectService from "../services/subjectService.js";

export const healthCheck = (req, res) => {
  res.send("Subject routes are under construction.");
};

export const addSubject = async (req, res) => {
  try {
    console.log(req.body);
    const { name, description, instructor, courses, type } = req.body;
    await subjectService.addSubject(
      name,
      description,
      instructor,
      courses,
      type
    );
    res.status(201).send("Subject added successfully.");
  } catch (error) {
    console.error("Error adding subject:", error);
    if (error.message === "Name, description, and instructor are required.") {
      return res.status(400).send(error.message);
    }
    if (error.message === "Subject already exists for this instructor.") {
      return res.status(409).send(error.message);
    }
    res.status(500).send("Error adding subject: " + error.message);
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await subjectService.getAllSubjects();
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).send("Error fetching subjects: " + error.message);
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);
    res.status(200).json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    if (error.message === "Subject not found.") {
      return res.status(404).send(error.message);
    }
    res.status(500).send("Error fetching subject: " + error.message);
  }
};

export const getNotEnrolledStudents = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const students = await subjectService.getNotEnrolledStudents(subjectId);
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching not enrolled students:", error);
    if (error.message === "subjectId is required.") {
      return res.status(400).send(error.message);
    }
    res
      .status(500)
      .send("Error fetching not enrolled students: " + error.message);
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { studentId } = req.body;
    const student = await subjectService.enrollStudent(studentId, subjectId);
    res.status(200).json(student);
  } catch (error) {
    console.error("Error enrolling student:", error);
    if (
      error.message === "studentId is required." ||
      error.message === "Student not found."
    ) {
      return res
        .status(error.message === "studentId is required." ? 400 : 404)
        .send(error.message);
    }
    res.status(500).send("Error enrolling student: " + error.message);
  }
};

export const getEnrolledStudents = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const students = await subjectService.getEnrolledStudents(subjectId);
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    if (error.message === "subjectId is required.") {
      return res.status(400).send(error.message);
    }
    res.status(500).send("Error fetching enrolled students: " + error.message);
  }
};

export const unenrollStudent = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { studentId } = req.body;
    const student = await subjectService.unenrollStudent(studentId, subjectId);
    res.status(200).json(student);
  } catch (error) {
    console.error("Error unenrolling student:", error);
    if (
      error.message === "studentId is required." ||
      error.message === "Student not found."
    ) {
      return res
        .status(error.message === "studentId is required." ? 400 : 404)
        .send(error.message);
    }
    res.status(500).send("Error unenrolling student: " + error.message);
  }
};

export const getEnrolledSubjects = async (req, res) => {
  try {
    const studentId = req.params.id;
    const subjects = await subjectService.getEnrolledSubjects(studentId);
    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error fetching enrolled subjects:", error);
    if (
      error.message === "studentId is required." ||
      error.message === "Student not found."
    ) {
      return res
        .status(error.message === "studentId is required." ? 400 : 404)
        .send(error.message);
    }
    res.status(500).send("Error fetching enrolled subjects: " + error.message);
  }
};

export const getExamsForSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.userId;
    const exams = await subjectService.getExamsForSubject(subjectId, userId);
    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams for subject:", error);
    if (error.message === "subjectId is required.") {
      return res.status(400).send(error.message);
    }
    res.status(500).send("Error fetching exams for subject: " + error.message);
  }
};

export const getResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await subjectService.getResults(studentId);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    if (error.message === "Invalid student ID") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).send("Error fetching results: " + error.message);
  }
};

export const getStudentAnswers = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const answers = await subjectService.getStudentAnswers(studentId, examId);

    return res.status(200).json({
      success: true,
      message: "✅ Student answers fetched successfully",
      answers,
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

export const calculateGrade = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const gradeData = await subjectService.calculateGrade(studentId, subjectId);
    res.json(gradeData);
  } catch (error) {
    console.error("Error calculating grade:", error);
    if (
      error.message === "No question sets found for this subject." ||
      error.message ===
        "No checked answers found for this student in this subject."
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedSubject = await subjectService.updateSubject(id, updateData);
    res.status(200).json({
      message: "Subject updated successfully.",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    if (error.message === "Subject not found.") {
      return res.status(404).send(error.message);
    }
    if (error.message === "Subject ID is required.") {
      return res.status(400).send(error.message);
    }
    res.status(500).send("Error updating subject: " + error.message);
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await subjectService.deleteSubject(id);
    res
      .status(200)
      .json({ message: "Subject and associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting subject:", error);
    if (error.message === "Subject not found.") {
      return res.status(404).send(error.message);
    }
    res.status(500).send("Error deleting subject: " + error.message);
  }
};

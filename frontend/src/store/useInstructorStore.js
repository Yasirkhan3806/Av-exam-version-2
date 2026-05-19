import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeFetch } from "../utils/safeFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

// === Centralized Fetch Helper ===
async function fetchJSON(url, options = {}) {
  const res = await safeFetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  }, 15000); // 15-second default timeout
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// === Async helper functions ===
async function fetchUserInfo(set) {
  try {
    const data = await fetchJSON(
      `${BASE_URL}/instructors/verifyInstructorSession`
    );
    set({
      instructorId: data.instructor.userId,
      instructorInfo: data.instructor,
    });
    return data.instructor;
  } catch (error) {
    console.error("Failed to fetch instructor info:", error);
    set({ error: error.message });
    return null;
  }
}

const fetchSubjects = async (set, get) => {
  try {
    const instructorId =
      get().instructorId || (await fetchUserInfo(set))?.userId;
    const data = await fetchJSON(
      `${BASE_URL}/instructors/getAllSubjects/${instructorId}`
    );
    set({ subjects: data.subjects });
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    throw error;
  }
};

const fetchExams = async (set, get, subjectId, subjectType) => {
  try {
    const query = subjectType ? `?subjectType=${subjectType}` : "";
    const data = await fetchJSON(
      `${BASE_URL}/instructors/getExamsBySubject/${subjectId}${query}`
    );
    set({ exams: data.exams });
  } catch (error) {
    console.error("Failed to fetch exams:", error);
    throw error;
  }
};

const fetchSubmissions = async (set, get, questionId) => {
  try {
    const currentSubjectType = get().currentSubjectType;
    const query = currentSubjectType
      ? `?subjectType=${currentSubjectType}`
      : "";
    const data = await fetchJSON(
      `${BASE_URL}/instructors/getSubmissions/${questionId}${query}`
    );
    set({ submissions: data.submissions });
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    throw error;
  }
};

const deleteSubmission = async (set, get, studentId, examId) => {
  try {
    const currentSubjectType = get().currentSubjectType;
    const query = currentSubjectType
      ? `?subjectType=${currentSubjectType}`
      : "";
    await fetchJSON(
      `${BASE_URL}/instructors/deleteSubmission/${studentId}/${examId}${query}`,
      { method: "DELETE" }
    );
    // Remove the submission from the local state to update the UI instantly
    const updatedSubmissions = get().submissions.filter(
      (sub) => sub.id !== studentId
    );
    set({ submissions: updatedSubmissions });
    return true;
  } catch (error) {
    console.error("Failed to delete submission:", error);
    return false;
  }
};

const fetchExamById = async (set, get) => {
  try {
    const currentExamId = get().currentExamId;
    const data = await fetchJSON(
      `${BASE_URL}/instructors/getExam/${currentExamId}`
    );
    set({ examQuestions: data.exam.pagesData });
    return data.exam;
  } catch (error) {
    console.error("Failed to fetch exam:", error);
    throw error;
  }
};

const fetchAnswersByQuestionId = async (set, get, studentId) => {
  try {
    const currentExamId = get().currentExamId;
    const currentSubjectType = get().currentSubjectType;
    const query = currentSubjectType
      ? `?subjectType=${currentSubjectType}`
      : "";
    const data = await fetchJSON(
      `${BASE_URL}/instructors/getStudentAnswers/${studentId}/${currentExamId}${query}`
    );
    set({
      studentAnswers: data.answers,
      currentStudentId: studentId,
      marks: data.answers.marksObtained,
    });
    // if (data.answers.status === 'checked' || data.answers.status === 'draft') {
    //   set({ marks: data.answers.marksObtained || {} });
    // }
    return data.answers;
  } catch (error) {
    console.error("Failed to fetch student answers:", error);
    throw error;
  }
};

const logout = async () => {
  try {
    await fetchJSON(`${BASE_URL}/instructors/logout`, { method: "POST" });
    return true;
  } catch (error) {
    console.error("Logout failed:", error);
    return false;
  }
};

// === Zustand Store ===
const useInstructorStore = create(
  persist(
    (set, get) => ({
      // State
      examQuestions: [],
      currentQuestion: 1,
      loading: false,
      error: null,
      subjects: [],
      instructorId: null,
      instructorInfo: null,
      exams: [],
      submissions: [],
      currentExam: null,
      currentExamId: null,
      studentAnswers: [],
      status: "submitted",
      marks: {},
      currentStudentId: null,
      checkedPdfs: {},
      suggestedSolutions: {},
      currentSubjectType: "",

      // Actions
      setExamQuestions: (questions) => set({ examQuestions: questions }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setLoading: (status) => set({ loading: status }),
      setError: (error) => set({ error }),
      fetchSubjects: () => fetchSubjects(set, get),
      fetchUserInfo: () => fetchUserInfo(set),
      fetchExams: (subjectId, subjectType) =>
        fetchExams(set, get, subjectId, subjectType),
      setCurrentSubjectType: (subjectType) =>
        set({ currentSubjectType: subjectType }),
      fetchSubmissions: (questionId) => fetchSubmissions(set, get, questionId),
      deleteSubmission: (studentId, examId) => deleteSubmission(set, get, studentId, examId),
      fetchExamById: (examId) => fetchExamById(set, get, examId),
      fetchAnswersByQuestionId: (studentId, examId) =>
        fetchAnswersByQuestionId(set, get, studentId, examId),
      // === Optimized currentExam setter ===
      setCurrentExam: (examId) => {
        const { exams, currentExam } = get();
        if (currentExam && currentExam.id === examId) {
          return;
        }
        const exam = exams.find((ex) => ex.id === examId) || null;
        if (exam) set({ currentExam: exam, currentExamId: examId });
      },
      resetCurrentExam: () => {
        set({ currentExam: null });
        const storage = localStorage.getItem("instructor-storage");
        if (storage) {
          const parsed = JSON.parse(storage);
          if (parsed?.state?.currentExam) {
            delete parsed.state.currentExam;
            localStorage.setItem("instructor-storage", JSON.stringify(parsed));
          }
        }
      },
      nextQuestion: () => {
        const { currentQuestion, examQuestions } = get();
        if (currentQuestion < Object.keys(examQuestions).length) {
          set({ currentQuestion: currentQuestion + 1 });
        }
      },
      prevQuestion: () => {
        const { currentQuestion } = get();
        if (currentQuestion > 1) {
          set({ currentQuestion: currentQuestion - 1 });
        }
      },
      setMarks: (currentQuestion, marks) => {
        set({
          marks: {
            ...get().marks,
            [`q${currentQuestion}`]: {
              ...get().marks[`q${currentQuestion}`],
              marks: marks,
              checked: true,
            },
          },
        });
        return true;
      },
      setCheckedPdf: (questionNumber, pdfFile) => {
        set({
          checkedPdfs: {
            ...get().checkedPdfs,
            [`q${questionNumber}`]: pdfFile,
          },
        });
      },

      /**
       * Stores a suggested solution PDF file for a given question number.
       * @param {number} questionNumber - The question number
       * @param {File|null} pdfFile - The suggested solution PDF file
       */
      setSuggestedSolution: (questionNumber, pdfFile) => {
        if (!pdfFile) return; // Don't store null values
        set({
          suggestedSolutions: {
            ...get().suggestedSolutions,
            [`q${questionNumber}`]: pdfFile,
          },
        });
      },

      finishExamReview: async () => {
        try {
          const { currentExamId, marks, currentStudentId, checkedPdfs, suggestedSolutions } = get();

          // Prepare form data with checked PDFs
          const formData = new FormData();
          Object.entries(checkedPdfs).forEach(([key, file]) => {
            formData.append(key, file);
          });

          // Append suggested solution PDFs with 'suggested_' prefix
          Object.entries(suggestedSolutions).forEach(([key, file]) => {
            formData.append(`suggested_${key}`, file);
          });

          // Include the marksObtained object in request body
          formData.append("data", JSON.stringify({ marksObtained: marks }));

          // Upload all PDFs and replace old ones
          const res = await safeFetch(`${BASE_URL}/instructors/uploadCheckedPdfs`, {
            method: "POST",
            body: formData,
          }, 60000); // 60 second timeout since instructors might upload multiple marked PDFs
          
          if (!res.ok) {
             throw new Error(`Upload failed: ${res.status}`);
          }
          const { updatedMarks } = await res.json();
          console.log(
            "✅ Uploaded checked PDFs and obtained updated marks:",
            updatedMarks
          );

          // Now update student marks in DB
          const currentSubjectType = get().currentSubjectType;
          const query = currentSubjectType
            ? `?subjectType=${currentSubjectType}`
            : "";

          await fetchJSON(
            `${BASE_URL}/instructors/updateStudentMarks/${currentStudentId}/${currentExamId}${query}`,
            {
              method: "PUT",
              body: JSON.stringify({
                marksObtained: updatedMarks,
                status: "checked",
              }),
              credentials: "include",
            }
          );

          get().reset();
          return true;
        } catch (error) {
          console.error("❌ Failed to update marks:", error);
          set({ error: error.message });
          return false;
        }
      },

      logout: async () => {
        const success = await logout();
        console.log("Logout success:", success);
        if (success) {
          get().reset();
        }
        return success;
      },

      // Reset store (except persisted data)
      reset: () =>
        set({
          examQuestions: [],
          currentQuestion: 1,
          loading: false,
          error: null,
          subjects: [],
          instructorId: null, // Clear instructorId
          instructorInfo: null,
          exams: [],
          submissions: [],
          currentExam: null,
          currentExamId: null,
          studentAnswers: [],
          marks: {},
          currentStudentId: null,
          suggestedSolutions: {},
        }),
    }),
    {
      name: "instructor-storage",
      getStorage: () => localStorage,
      // ✅ Only persist selective data
      partialize: (state) => ({
        instructorInfo: state.instructorInfo,
        currentExam: state.currentExam,
        exams: state.exams,
        examQuestions: state.examQuestions,
        studentAnswers: state.studentAnswers,
        currentQuestion: state.currentQuestion,
        currentExamId: state.currentExamId,
        marks: state.marks,
        currentStudentId: state.currentStudentId,
        currentSubjectType: state.currentSubjectType,
      }),
    }
  )
);

export default useInstructorStore;

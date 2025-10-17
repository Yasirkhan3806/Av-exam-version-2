import next from 'next';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE_URL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

// === Centralized Fetch Helper ===
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// === Async helper functions ===
async function fetchUserInfo(set) {
  try {
    const data = await fetchJSON(`${BASE_URL}/instructors/verifyInstructorSession`);
    set({ instructorId: data.instructor.userId, instructorInfo: data.instructor });
    return data.instructor;
  } catch (error) {
    console.error('Failed to fetch instructor info:', error);
    set({ error: error.message });
    return null;
  }
}

const fetchSubjects = async (set, get) => {
  try {
    const instructorId = get().instructorId || (await fetchUserInfo(set))?.userId;
    const data = await fetchJSON(`${BASE_URL}/instructors/getAllSubjects/${instructorId}`);
    set({ subjects: data.subjects });
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  }
};

const fetchExams = async (set, get, subjectId) => {
  try {
    const data = await fetchJSON(`${BASE_URL}/instructors/getExamsBySubject/${subjectId}`);
    set({ exams: data.exams });
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    throw error;
  }
};

const fetchSubmissions = async (set, get, questionId) => {
  try {
    const data = await fetchJSON(`${BASE_URL}/instructors/getSubmissions/${questionId}`);
    set({ submissions: data.submissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    throw error;
  }
};

const fetchExamById = async (set, get) => {
  try {
    const currentExamId = get().currentExamId;
    const data = await fetchJSON(`${BASE_URL}/instructors/getExam/${currentExamId}`);
    set({ examQuestions: data.exam.pagesData });
    return data.exam;
  } catch (error) {
    console.error('Failed to fetch exam:', error);
    throw error;
  }
};

const fetchAnswersByQuestionId = async (set, get, studentId) => {
  try {
    const currentExamId = get().currentExamId;
    const data = await fetchJSON(`${BASE_URL}/instructors/getStudentAnswers/${studentId}/${currentExamId}`);
    set({ studentAnswers: data.answers.answers });
    return data.answers;
  } catch (error) {
    console.error('Failed to fetch student answers:', error);
    throw error;
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

      // Actions
      setExamQuestions: (questions) => set({ examQuestions: questions }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setLoading: (status) => set({ loading: status }),
      setError: (error) => set({ error }),
      fetchSubjects: () => fetchSubjects(set, get),
      fetchUserInfo: () => fetchUserInfo(set),
      fetchExams: (subjectId) => fetchExams(set, get, subjectId),
      fetchSubmissions: (questionId) => fetchSubmissions(set, get, questionId),
      fetchExamById: (examId) => fetchExamById(set, get, examId),
      fetchAnswersByQuestionId: (studentId, examId) => fetchAnswersByQuestionId(set, get, studentId, examId),
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
        const storage = localStorage.getItem('instructor-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          if (parsed?.state?.currentExam) {
            delete parsed.state.currentExam;
            localStorage.setItem('instructor-storage', JSON.stringify(parsed));
          }
        }
      },
      nextQuestion: () => {
        console.log("nextQuestion is called")
        const { currentQuestion, examQuestions } = get();
        if (currentQuestion < Object.keys(examQuestions).length) {
          set({ currentQuestion: currentQuestion + 1 });
        }
      },
      prevQuestion: () => {
        const { currentQuestion, examQuestions } = get();
        if (currentQuestion > 1) {
          set({ currentQuestion: currentQuestion - 1 });
        }
      },

      // Reset store (except persisted data)
      reset: () =>
        set({
          examQuestions: [],
          currentQuestion: null,
          loading: false,
          error: null,
          subjects: [],
          exams: [],
          submissions: [],
        }),
    }),
    {
      name: 'instructor-storage',
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
      }),
    }
  )
);

export default useInstructorStore;

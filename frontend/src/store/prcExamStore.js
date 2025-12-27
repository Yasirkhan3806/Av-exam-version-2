import { create } from "zustand";

// Adjust API_URL based on your environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const usePrcExamStore = create((set, get) => ({
  exam: null,
  questions: [],
  answers: {}, // { questionId: selectedOptionLabel } e.g. { "q1": "A" }
  currentQuestionIndex: 0,
  timeLeft: 0, // in seconds
  isExamStarted: false,
  isFinished: false,
  isLoading: false,
  error: null,
  result: null, // { total, correct, wrong, detailed: [] }

  // Actions
  fetchExam: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/prc-exams/${id}`);
      if (!response.ok) throw new Error("Failed to fetch exam");
      const data = await response.json();

      set({
        exam: data,
        questions: data.mcqs || [],
        isLoading: false,
        timeLeft: (data.totalAttempt || data.totalTime || 0) * 60, // Convert mins to seconds
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  startExam: () => {
    set({ isExamStarted: true });
  },

  submitAnswer: (questionId, optionLabel) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionLabel },
    }));
  },

  nextQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    }));
  },

  prevQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    }));
  },

  tickTimer: () => {
    set((state) => {
      if (state.timeLeft <= 0) {
        get().finishExam();
        return { timeLeft: 0 };
      }
      return { timeLeft: state.timeLeft - 1 };
    });
  },

  finishExam: async () => {
    const { answers, exam } = get();

    // Call backend to verify answers and get result
    // We assume backend is at :id/submit
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/prc-exams/${exam._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error("Failed to submit exam");

      const resultData = await response.json();

      set({
        isFinished: true,
        isExamStarted: false,
        isLoading: false,
        result: resultData,
      });
    } catch (error) {
      console.error("Error finishing exam:", error);
      set({ error: "Failed to submit exam results", isLoading: false });
    }
  },

  reset: () => {
    set({
      exam: null,
      questions: [],
      answers: {},
      currentQuestionIndex: 0,
      timeLeft: 0,
      isExamStarted: false,
      isFinished: false,
      isLoading: false,
      error: null,
      result: null,
    });
  },
}));

export default usePrcExamStore;

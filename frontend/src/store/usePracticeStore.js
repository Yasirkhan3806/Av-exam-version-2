import { create } from "zustand";

const usePracticeStore = create((set, get) => ({
  // State
  currentQuestion: 1,
  totalQuestions: 1,
  questionName: "Practice Exam",
  questionsObj: {},
  answers: {},
  workbookStates: {},
  saving: false,
  error: null,

  // Timer State
  totalTime: 0,
  remainingTime: 0,
  startTime: null,
  isPractice: true,

  // Actions
  initializePractice: () => {
    set({
      currentQuestion: 1,
      totalQuestions: 1,
      questionName: "Practice Session",
      // Dummy blank PDF base64
      questionsObj: {
        q1: "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCig+PgogID4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgorPgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCAyMjIgPj4Kc3RyZWFtCkJVCjEuMDkzIDAuODY1IDEuMDkzIHJnCjAuOTQ4IDAuODg1IDAuOTQ4IFJHCjU3NS4yOCA4MjEuODkgcmUKZgoxLjAgMC4wIDAuMCByZwouMCAwLjAgMC4wIFJHCkJUKC9GMSAyNCBUZgoxMDAgNzAwIFRkCihQcmFjdGljZSBRdWVzdGlvbikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAgCjAwMDAwMDAxNTcgMDAwMDAgbiAgCjAwMDAwMDAyNjggMDAwMDAgbiAgCjAwMDAwMDAzNjAgMDAwMDAgbiAgCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjYzMgolJUVPRgo=",
      },
      answers: {},
      workbookStates: {},
      startTime: Date.now(),
    });

  },

  setAnswer: (answer) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [`q${state.currentQuestion}`]: answer,
      },
    }));
  },

  saveWorkbookState: (id, data) => {
    set((state) => ({
      workbookStates: {
        ...state.workbookStates,
        [id]: data,
      },
    }));
  },

  getWorkbookState: (id) => {
    return get().workbookStates[id];
  },

  setSaving: (val) => set({ saving: val }),

  tick: () => {
    // Increment remainingTime to trigger re-renders
    const start = get().startTime;
    if (!start) return;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    set({ remainingTime: elapsed });
  },

  getFormattedTime: () => {
    return get().getElapsedTime();
  },

  nextQuestion: () => {
    const { currentQuestion, totalQuestions } = get();
    if (currentQuestion < totalQuestions) {
      set({ currentQuestion: currentQuestion + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestion } = get();
    if (currentQuestion > 1) {
      set({ currentQuestion: currentQuestion - 1 });
    }
  },

  goToQuestion: (index) => {
    const { totalQuestions } = get();
    if (index >= 1 && index <= totalQuestions) {
      set({ currentQuestion: index });
    }
  },

  finishExam: async () => {
    get().reset();
    window.location.href = "/StudentDashboard";
  },

  TimesUp: async () => {
    // No-op for practice
  },

  reset: () => {
    set({
      currentQuestion: 1,
      answers: {},
      workbookStates: {},
      startTime: null,
    });
  },

  // Timer helper (optional, can depend on component)
  getElapsedTime: () => {
    const start = get().startTime;
    if (!start) return "00:00";
    const diff = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
}));

export default usePracticeStore;

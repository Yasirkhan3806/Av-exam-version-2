import { safeFetch } from "../../utils/safeFetch";

/**
 * Exam metadata + question navigation. One slice of useExamStore.js — see
 * that file for how the slices are composed. Split out of a single
 * 517-line store; state/actions here moved verbatim, no behavior change.
 */
export const createExamDataSlice = (set, get) => ({
  questionName: "",
  currentQuestion: 1,
  questionsObj: {},
  totalQuestions: 0,
  loading: false,
  error: null,
  ExamId: null,

  fetchExam: async (examId, subjectType) => {
    set({ loading: true, error: null });
    const { BASEURL } = get();
    try {
      const response = await safeFetch(
        `${BASEURL}/questions/getQuestionById/${subjectType}/${examId}`,
        {
          credentials: "include",
        },
        15000 // 15 second timeout
      );
      if (!response.ok) {
        throw new Error("Failed to fetch exam data");
      }
      const data = await response.json();
      if (data && (subjectType === "CFAP" || data.docId)) {
        set({
          questionsObj: data.questionsObj,
          totalQuestions: Object.keys(data.questionsObj).length,
          questionName: data.name,
          loading: false,
          totalTime: data.time,
          currentQuestion: 1,
          ExamId: data.docId,
          workbookStates: {}, // Reset workbook states for new exam
        });
      }

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  nextQuestion: () => {
    const { currentQuestion, totalQuestions, saveAnswers, saving, setTransitioning } = get();
    if (currentQuestion < totalQuestions && !saving) {
      saveAnswers();
      setTransitioning(true);
      set({ currentQuestion: currentQuestion + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestion, saveAnswers, saving, setTransitioning } = get();
    if (currentQuestion > 1 && !saving) {
      saveAnswers();
      setTransitioning(true);
      set({ currentQuestion: currentQuestion - 1 });
    }
  },

  goToQuestion: (index) => {
    const { totalQuestions, saving, saveAnswers, currentQuestion, setTransitioning } = get();
    if (index >= 1 && index <= totalQuestions && index !== currentQuestion && !saving) {
      saveAnswers();
      setTransitioning(true);
      set({ currentQuestion: index });
    }
  },
});

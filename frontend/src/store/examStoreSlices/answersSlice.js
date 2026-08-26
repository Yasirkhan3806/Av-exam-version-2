import { safeFetch } from "../../utils/safeFetch";
import { logExamEvent } from "../../utils/examDebugTrail";

/**
 * Answers, rough-work (workbook) state, autosave, and final submission. One
 * slice of useExamStore.js — see that file for how the slices are
 * composed. Split out of a single 517-line store; state/actions here
 * moved verbatim, no behavior change.
 */
export const createAnswersSlice = (set, get) => ({
  answers: {},
  workbookStates: {}, // Stores workbook data per question (rough work)
  saving: false,

  // Save workbook state for a specific question (in-memory only)
  saveWorkbookState: (questionNumber, workbookData) => {
    set((state) => ({
      workbookStates: {
        ...state.workbookStates,
        [questionNumber]: workbookData,
      },
    }));
  },

  // Get workbook state for a specific question
  getWorkbookState: (questionNumber) => {
    return get().workbookStates[questionNumber] || null;
  },

  // Get all workbook states (useful for debugging)
  getAllWorkbookStates: () => {
    return get().workbookStates;
  },

  // Clear workbook state for a specific question
  clearWorkbookState: (questionNumber) => {
    set((state) => {
      const newStates = { ...state.workbookStates };
      delete newStates[questionNumber];
      return { workbookStates: newStates };
    });
  },

  // Clear all workbook states
  clearAllWorkbookStates: () => {
    set({ workbookStates: {} });
  },

  setAnswer: (answer) => {
    set({ saving: true });
    set((state) => ({
      answers: {
        ...state.answers,
        [`q${state.currentQuestion}`]: answer,
      },
    }));
    set({ saving: false });
  },

  setSaving: (saving) => {
    set({ saving: saving });
  },

  saveAnswers: async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 3000, 8000];

    set({ saving: true, error: null });
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${get().BASEURL}/questions/submitAnswers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          answers: get().answers,
          questionSet: get().ExamId,
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error("Failed to save answers");
      set({ saving: false, lastSaveTime: Date.now() });
      return true;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS[retryCount]));
        return get().saveAnswers(retryCount + 1);
      }
      // After all retries fail, queue for later and save to local storage
      const backupKey = `failed_save_${get().ExamId}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(backupKey, JSON.stringify(get().answers));
        import('@sentry/nextjs').then(Sentry => {
          Sentry.captureMessage('Exam answers save failed, dumped to localStorage', {
            level: 'error',
            tags: { boundary: 'exam-store', examId: get().ExamId }
          });
        }).catch(() => {});
      }

      set({ error: error.message, saving: false, hasPendingSave: true });
      return false;
    }
  },

  finishExam: async () => {
    const { saveAnswers, reset, BASEURL } = get();
    set({ saving: true, error: null });
    logExamEvent("finish_exam_attempted");

    try {
      // 1. Try to save answers first.
      const saveSuccess = await saveAnswers();

      if (!saveSuccess) {
        // If answers failed to save, abort the finish process so the user can retry.
        throw new Error("Failed to save final answers to the server.");
      }

      // 2. If saveAnswers succeeded, we MUST reset local state immediately
      // so the user isn't trapped in a dead exam on refresh, regardless of
      // what happens to the next API call.
      reset();

      // 3. Fire the finishExam API call
      const res = await safeFetch(`${BASEURL}/questions/finishExam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }, 15000);

      if (!res.ok) {
        console.error(`Failed to finish exam. Status: ${res.status}`);
        logExamEvent("finish_exam_server_error", { status: res.status });
      } else {
        logExamEvent("finish_exam_completed");
      }
    } catch (error) {
      console.error("Critical failure during exam submission:", error);
      logExamEvent("finish_exam_failed", { message: error?.message });
      set({ error: "Failed to submit exam answers. Please check your connection and try again." });
    } finally {
      set({ saving: false });
    }
  },
});

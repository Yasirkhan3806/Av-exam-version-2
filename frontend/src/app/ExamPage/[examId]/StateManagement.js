import { create } from "zustand";
import { persist } from "zustand/middleware";

const useExamStore = create(
  persist(
    (set, get) => ({
      questionName: "",
      currentQuestion: 1,
      questionsObj: {},
      answers: {},
      totalQuestions: 0,
      loading: false,
      error: null,
      saving: false,
      BASEURL: process.env.NEXT_PUBLIC_MODE == "production" ? "https://academicvitality.org/api" : "http://localhost:5000", // Production backend URL
      totalTime: 0,
      remainingTime: 0,
      startTime: null,
      endTime: null,
      ExamId: null,

      reset: () => {
        set({
          questionName: "",
          currentQuestion: 1,
          questionsObj: {},
          answers: {},
          totalQuestions: 0,
          loading: false,
          error: null,
          saving: false,
          totalTime: 0,
          remainingTime: 0,
          startTime: null,
          endTime: null,
        });

        // ?? Also clear persisted state from localStorage
        if (window.localStorage) {
          window.localStorage.removeItem("exam-storage");
        }
      },

      fetchExam: async (examId) => {
        set({ loading: true, error: null });
        const { BASEURL } = get();
        try {
            const response = await fetch(`${BASEURL}/questions/getQuestionById/${examId}`, {
            credentials: "include"
            });
          if (!response.ok) {
            throw new Error("Failed to fetch exam data");
          }
          const data = await response.json();
          set({
            questionsObj: data.questionsObj,
            totalQuestions: Object.keys(data.questionsObj).length,
            questionName: data.name,
            loading: false,
            totalTime: data.time,
            currentQuestion: 1,
            ExamId: data.docId
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      startExam: async () => {
        const { BASEURL } = get();
        // Wait up to 5 seconds for data to load
        let attempts = 0;
        const maxAttempts = 50; // 50 * 100ms = 5s
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        while (attempts < maxAttempts) {
          const { totalTime, totalQuestions } = get();
          if (totalTime > 0 && totalQuestions > 0) {
            break; // Ready!
          }
          attempts++;
          await delay(100);
        }
        console.log(BASEURL);
        const res = await fetch(`${BASEURL}/questions/startExam`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ questionSet: get().ExamId }),
        });

        if (res.status !== 200) {
          console.error(`Failed to start exam. Status: ${res.status}`);
          set({ error: `Failed to start exam. Status: ${res.status}` });
          return;
        }
        


        const { totalTime, totalQuestions, startTime, endTime } = get();

        if (totalTime === 0 || totalQuestions === 0) {
          return;
        }

        if (startTime && endTime) {
          return;
        }

        const now = Date.now();
        const endTimeMs = now + (totalTime * 60 * 1000);

        set({
          startTime: now,
          endTime: endTimeMs,
          remainingTime: totalTime * 60,
        });
      },

      tick: () => {
        const { endTime, totalTime } = get();

        if (!endTime || totalTime === 0) return;

        const now = Date.now();
        let remainingTime = Math.floor((endTime - now) / 1000);

        if (remainingTime < 0) remainingTime = 0;

        set({ remainingTime });
      },

      getFormattedTime: () => {
        const { remainingTime } = get();
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      },

      nextQuestion: () => {
        const { currentQuestion, totalQuestions, saveAnswers } = get();
        if (currentQuestion < totalQuestions) {
          saveAnswers();
          set({ currentQuestion: currentQuestion + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestion, saveAnswers } = get();
        if (currentQuestion > 1) {
          saveAnswers(get().ExamId);
          set({ currentQuestion: currentQuestion - 1 });
        }
      },

      goToQuestion: (index) => {
        const { totalQuestions, saving,saveAnswers } = get();
        if (index >= 1 && index <= totalQuestions && !saving) {
          saveAnswers();
          set({ currentQuestion: index });
        }
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

      saveAnswers: async () => {
        set({ saving: true, error: null });
        try {
          const response = await fetch(`${get().BASEURL}/questions/submitAnswers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ answers: get().answers, questionSet: get().ExamId }),
          });
          if (!response.ok) {
            throw new Error("Failed to save answers");
          }
          set({ saving: false });
        } catch (error) {
          set({ error: error.message, saving: false });
        }
      },
      finishExam: async () => {
        const { saveAnswers,reset,BASEURL } = get();
        set({ saving: true });
        await saveAnswers();
        const res = await fetch(`${BASEURL}/questions/finishExam`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (res.status !== 200) {
          console.error(`Failed to finish exam. Status: ${res.status}`);
          set({ error: `Failed to finish exam. Status: ${res.status}`, saving: false });
          return;
        }
        reset();
        set({ saving: false });
      }
    }),
   {
    name: "exam-storage",
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => key !== "BASEURL")
      ),
  }
  )
);

export default useExamStore;

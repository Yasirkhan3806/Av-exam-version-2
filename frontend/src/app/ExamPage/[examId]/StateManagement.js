"use client"

import { create } from "zustand";
import { persist } from "zustand/middleware";
import useSubjectStore from '../../StudentDashboard/components/StatesManagement'

const useExamStore = create(
  persist(
    (set, get) => ({
      hydrated: false, // <— NEW
      setHydrated: () => set({ hydrated: true }),
      questionName: "",
      currentQuestion: 1,
      questionsObj: {},
      answers: {},
      workbookStates: {}, // Stores workbook data per question (rough work)
      totalQuestions: 0,
      loading: false,
      error: null,
      saving: false,
      BASEURL: process.env.NEXT_PUBLIC_MODE == "production" ? "https://academicvitality.org/api" : "http://localhost:5000",
      totalTime: 0,
      remainingTime: 0,
      startTime: null,
      endTime: null,
      ExamId: null,
      

      reset: () => {
        console.log("Resetting exam state");
        const subjectStore = useSubjectStore.getState();
        subjectStore.clearSubjectCache(); // Clear cached exams for current subject
        // This will clear all workbook states (rough work) when exam is finished
        set({
          questionName: "",
          currentQuestion: 1,
          questionsObj: {},
          answers: {},
          workbookStates: {}, // Clear all rough work when exam ends
          totalQuestions: 0,
          loading: false,
          error: null,
          saving: false,
          totalTime: 0,
          remainingTime: 0,
          startTime: null,
          endTime: null,
        });

        if (window.localStorage) {
          window.localStorage.removeItem("exam-storage");
        }
      },

      // Save workbook state for a specific question (in-memory only)
      saveWorkbookState: (questionNumber, workbookData) => {
        console.log('Saving workbook state for question:', questionNumber, workbookData)
        set((state) => ({
          workbookStates: {
            ...state.workbookStates,
            [questionNumber]: workbookData
          }
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
            ExamId: data.docId,
            workbookStates: {} // Reset workbook states for new exam
          });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      startExam: async () => {
        const { BASEURL } = get();
        let attempts = 0;
        const maxAttempts = 50;
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        while (attempts < maxAttempts) {
          const { totalTime, totalQuestions } = get();
          if (totalTime > 0 && totalQuestions > 0) {
            break;
          }
          attempts++;
          await delay(100);
        }

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
          saveAnswers();
          set({ currentQuestion: currentQuestion - 1 });
        }
      },

      goToQuestion: (index) => {
        const { totalQuestions, saving, saveAnswers } = get();
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
          // Only send answers to backend, NOT workbook states (rough work)
          const response = await fetch(`${get().BASEURL}/questions/submitAnswers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              answers: get().answers,
              questionSet: get().ExamId
            }),
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
        const { saveAnswers, reset, BASEURL } = get();
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
      onRehydrateStorage: () => (state) => {
        console.log("✅ Zustand rehydrated from localStorage", state);
        state?.setHydrated();
      }
    }
  )
);

export default useExamStore;
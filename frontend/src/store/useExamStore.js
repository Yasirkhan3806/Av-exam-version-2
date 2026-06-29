"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import useSubjectStore from "./useSubjectStore";
import { safeFetch } from "../utils/safeFetch";

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
      uploadProgress: 0,
      uploadDetails: null,
      BASEURL: process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000",
      totalTime: 0,
      remainingTime: 0,
      startTime: null,
      endTime: null,
      ExamId: null,
      isOnline: true,
      pauseStartTime: null,

      reset: () => {
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
          uploadProgress: 0,
          uploadDetails: null,
          totalTime: 0,
          remainingTime: 0,
          startTime: null,
          endTime: null,
          isOnline: true,
          pauseStartTime: null,
        });

        if (window.localStorage) {
          window.localStorage.removeItem("exam-storage");
        }
      },

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
          console.log(data);
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

      startExam: async () => {
        const { BASEURL, startTime, endTime } = get();

        if (startTime && endTime) {
          return;
        }

        const waitForData = () => new Promise((resolve, reject) => {
          const check = setInterval(() => {
            const { totalTime, totalQuestions } = get();
            if (totalTime > 0 && totalQuestions > 0) {
              clearInterval(check);
              resolve();
            }
          }, 200);
          setTimeout(() => { clearInterval(check); reject(new Error('Exam data load timeout')); }, 30000);
        });

        try {
          set({ loading: true });
          await waitForData();

          const res = await safeFetch(`${BASEURL}/questions/startExam`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ questionSet: get().ExamId }),
          }, 15000);

          if (res.status !== 200) {
            console.error(`Failed to start exam. Status: ${res.status}`);
            set({ error: `Failed to start exam. Status: ${res.status}`, loading: false });
            return;
          }

        const { totalTime, totalQuestions } = get();

        if (totalTime === 0 || totalQuestions === 0) {
          return;
        }



        const now = Date.now();
        const endTimeMs = now + totalTime * 60 * 1000;

          set({
            startTime: now,
            endTime: endTimeMs,
            remainingTime: totalTime * 60,
            loading: false
          });
        } catch (error) {
          set({ error: 'Failed to start exam. Please refresh and try again.', loading: false });
        }
      },

      tick: () => {
        const { endTime, totalTime, isOnline } = get();

        if (!endTime || totalTime === 0) return;

        // Don't tick if offline — timer is paused
        if (!isOnline) return;

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
        const { currentQuestion, totalQuestions, saveAnswers, saving } = get();
        if (currentQuestion < totalQuestions && !saving) {
          saveAnswers();
          set({ currentQuestion: currentQuestion + 1 });
        }
      },

      prevQuestion: () => {
        const { currentQuestion, saveAnswers, saving } = get();
        if (currentQuestion > 1 && !saving) {
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
          // After all retries fail, queue for later
          set({ error: error.message, saving: false, hasPendingSave: true });
          return false;
        }
      },

      // --- Offline Pause Logic ---
      setOnline: (status) => {
        const { pauseStartTime, endTime, isOnline } = get();

        if (!status && isOnline) {
          // Going OFFLINE: record the pause start time
          set({
            isOnline: false,
            pauseStartTime: Date.now(),
          });
        } else if (status && !isOnline) {
          // Coming back ONLINE: extend endTime by the offline duration
          if (pauseStartTime && endTime) {
            const offlineDuration = Date.now() - pauseStartTime;
            set({
              isOnline: true,
              pauseStartTime: null,
              endTime: endTime + offlineDuration,
            });
          } else {
            set({
              isOnline: true,
              pauseStartTime: null,
            });
          }

          // Auto-sync answers to server after reconnecting
          get().saveAnswers();
        }
      },

      TimesUp: async () => {
        await get().finishExam();
      },

      finishExam: async () => {
        const { saveAnswers, reset, BASEURL } = get();
        set({ saving: true, error: null });
        
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
          }
        } catch (error) {
          console.error("Critical failure during exam submission:", error);
          set({ error: "Failed to submit exam answers. Please check your connection and try again." });
        } finally {
          set({ saving: false });
        }
      },
      submitCafAnswer: async (cafExamId, file) => {
        set({ saving: true, uploadProgress: 0, uploadDetails: null, error: null });
        const { BASEURL } = get();
        
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${BASEURL}/caf-answers/submitAnswer`);
          xhr.withCredentials = true;
          
          const uploadStartTime = Date.now();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const loaded = e.loaded;
              const total = e.total;
              const progress = Math.round((loaded / total) * 100);

              const currentTime = Date.now();
              const duration = (currentTime - uploadStartTime) / 1000; // duration in seconds
              
              let speed = 0; // Bytes per second
              let remainingTime = 0; // estimated remaining seconds
              if (duration > 0) {
                speed = loaded / duration;
                const remainingBytes = total - loaded;
                remainingTime = speed > 0 ? Math.round(remainingBytes / speed) : 0;
              }

              set({ 
                uploadProgress: progress,
                uploadDetails: { loaded, total, speed, remainingTime }
              });
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                set({ saving: false, uploadProgress: 0, uploadDetails: null });
                resolve(result);
              } catch (e) {
                set({ error: "Failed to parse response", saving: false, uploadProgress: 0, uploadDetails: null });
                reject(e);
              }
            } else {
              let errorMsg = "Failed to submit CAF answer";
              try {
                const errorData = JSON.parse(xhr.responseText);
                errorMsg = errorData.error || errorMsg;
              } catch (e) {}
              set({ error: errorMsg, saving: false, uploadProgress: 0, uploadDetails: null });
              reject(new Error(errorMsg));
            }
          };
          
          xhr.onerror = () => {
            set({ error: "Network error during upload. Please try again.", saving: false, uploadProgress: 0, uploadDetails: null });
            reject(new Error("Network error during upload"));
          };
          
          xhr.ontimeout = () => {
            set({ error: "Upload timed out. Please try again.", saving: false, uploadProgress: 0, uploadDetails: null });
            reject(new Error("Upload timed out"));
          };
          
          xhr.timeout = 300000; // 2 min timeout for large files
          
          const formData = new FormData();
          formData.append("questionId", cafExamId);
          formData.append("pdf", file);
          xhr.send(formData);
        });
      },
    }),
    {
      name: "exam-storage",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              key !== "BASEURL" &&
              key !== "isOnline" &&
              key !== "uploadProgress" &&
              key !== "uploadDetails"
          )
        ),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export default useExamStore;

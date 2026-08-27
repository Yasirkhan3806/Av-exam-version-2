"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import useSubjectStore from "./useSubjectStore";
import { createExamDataSlice } from "./examStoreSlices/examDataSlice";
import { createTimerSlice } from "./examStoreSlices/timerSlice";
import { createAnswersSlice } from "./examStoreSlices/answersSlice";
import { createCafUploadSlice } from "./examStoreSlices/cafUploadSlice";
import { BASEURL } from "@/utils/config";

// This store used to be a single 517-line file. It's now composed from
// focused slices under examStoreSlices/ (exam data + navigation, timer,
// answers + autosave, CAF upload) plus the cross-cutting bits below
// (hydration, BASEURL, reset) that touch all of them. Slices share the
// same set/get, so cross-slice calls like get().saveAnswers() from inside
// a different slice work exactly as they did in the single-file version —
// this is a pure reorganization, no behavior change.
const useExamStore = create(
  persist(
    (set, get) => ({
      hydrated: false, // <— NEW
      setHydrated: () => set({ hydrated: true }),
      BASEURL,

      ...createExamDataSlice(set, get),
      ...createTimerSlice(set, get),
      ...createAnswersSlice(set, get),
      ...createCafUploadSlice(set, get),

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
          isTransitioning: false,
          transitionPauseStart: null,
        });

        if (window.localStorage) {
          window.localStorage.removeItem("exam-storage");
        }
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
              key !== "isTransitioning" &&
              key !== "transitionPauseStart" &&
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

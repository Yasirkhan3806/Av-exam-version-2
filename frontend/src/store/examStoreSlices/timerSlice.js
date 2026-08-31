import { safeFetch } from "../../utils/safeFetch";

// Hard ceiling on how long the timer will wait for the OnlyOffice
// spreadsheet pane to finish loading before giving up and resuming anyway.
// The pane is optional scratch space (see PracticeSheet.jsx) — if the office
// server is genuinely down, "pause until ready" must fail open, not freeze
// the exam forever.
const EDITOR_LOAD_TIMEOUT_MS = 25000;

/**
 * Exam timer: countdown, offline pause, question-transition pause, and
 * OnlyOffice-load pause. One slice of useExamStore.js — see that file for
 * how the slices are composed. Split out of a single 517-line store;
 * state/actions here moved verbatim, no behavior change (editorLoading is
 * new — see setEditorLoading below).
 */
export const createTimerSlice = (set, get) => ({
  totalTime: 0,
  remainingTime: 0,
  startTime: null,
  endTime: null,
  isOnline: true,
  pauseStartTime: null,
  isTransitioning: false,
  transitionPauseStart: null,
  editorLoading: false,
  editorLoadingStart: null,
  editorLoadingTimeoutId: null,
  // Bearer token for /questions/submitAnswers + /questions/finishExam —
  // survives SameSite/Domain cookie misconfig and third-party-cookie
  // blocking that the ExamToken cookie alone doesn't. Captured from
  // startExam()'s response body and re-swapped on every successful
  // submitAnswers (see answersSlice.js), which reissues it server-side.
  examToken: null,

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

      const startData = await res.json();
      if (startData?.ExamToken) {
        set({ examToken: startData.ExamToken });
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
    const { endTime, totalTime, isOnline, isTransitioning, editorLoading } = get();

    if (!endTime || totalTime === 0) return;

    // Don't tick if offline — timer is paused
    if (!isOnline) return;

    // Don't tick during question transition — timer is paused
    if (isTransitioning) return;

    // Don't tick while the OnlyOffice spreadsheet pane is (re)loading —
    // timer is paused. See setEditorLoading below.
    if (editorLoading) return;

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

  // --- Question Transition Pause Logic ---
  setTransitioning: (status) => {
    const { transitionPauseStart, endTime, isTransitioning, remainingTime } = get();

    if (status && !isTransitioning) {
      // Starting transition: pause the timer and freeze remainingTime
      set({
        isTransitioning: true,
        transitionPauseStart: Date.now(),
        // Freeze remainingTime at the current value so it doesn't drift
        remainingTime: remainingTime,
      });
    } else if (!status && isTransitioning) {
      // Transition complete: extend endTime by the paused duration
      if (transitionPauseStart && endTime) {
        const pausedDuration = Date.now() - transitionPauseStart;
        const newEndTime = endTime + pausedDuration;
        // Immediately recalculate remainingTime from the extended endTime
        const now = Date.now();
        let newRemaining = Math.floor((newEndTime - now) / 1000);
        if (newRemaining < 0) newRemaining = 0;
        set({
          isTransitioning: false,
          transitionPauseStart: null,
          endTime: newEndTime,
          remainingTime: newRemaining,
        });
      } else {
        set({
          isTransitioning: false,
          transitionPauseStart: null,
        });
      }
    }
  },

  // --- OnlyOffice Load Pause Logic ---
  // Same freeze-then-extend-endTime shape as setTransitioning above, plus a
  // hard timeout: if the office server never signals ready, resume anyway
  // rather than freeze the exam forever. Called with true when a spreadsheet
  // (re)load starts (every question, not just the first — each navigation
  // re-inits the editor) and with false from useOnlyOfficeEditor's onReady,
  // which fires on genuine ready AND on load failure (see that hook).
  setEditorLoading: (status) => {
    const { editorLoading, editorLoadingStart, editorLoadingTimeoutId, endTime, remainingTime } = get();

    if (status) {
      if (editorLoading) return; // already paused for this load — don't stack
      if (editorLoadingTimeoutId) clearTimeout(editorLoadingTimeoutId);
      const timeoutId = setTimeout(() => {
        get().setEditorLoading(false);
      }, EDITOR_LOAD_TIMEOUT_MS);
      set({
        editorLoading: true,
        editorLoadingStart: Date.now(),
        editorLoadingTimeoutId: timeoutId,
        // Freeze remainingTime at the current value so it doesn't drift
        remainingTime,
      });
    } else {
      if (!editorLoading) return;
      if (editorLoadingTimeoutId) clearTimeout(editorLoadingTimeoutId);
      if (editorLoadingStart && endTime) {
        const pausedDuration = Date.now() - editorLoadingStart;
        const newEndTime = endTime + pausedDuration;
        const now = Date.now();
        let newRemaining = Math.floor((newEndTime - now) / 1000);
        if (newRemaining < 0) newRemaining = 0;
        set({
          editorLoading: false,
          editorLoadingStart: null,
          editorLoadingTimeoutId: null,
          endTime: newEndTime,
          remainingTime: newRemaining,
        });
      } else {
        set({
          editorLoading: false,
          editorLoadingStart: null,
          editorLoadingTimeoutId: null,
        });
      }
    }
  },

  TimesUp: async () => {
    await get().finishExam();
  },
});

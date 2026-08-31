"use client";
import { useEffect, useState } from "react";
import useExamStore from "../../../store/useExamStore";
import { useOnlyOfficeEditor } from "../../../hooks/useOnlyOfficeEditor";
import { BASEURL as BROWSER_BASE_URL } from "@/utils/config";

// OnlyOffice embed for the real exam's spreadsheet pane — replaces the
// previous Univer.js editor. This pane is rough-work scratch space only:
// never graded, never part of the submitted answer (that's AnswerWindow.jsx's
// ReactQuill rich text, POSTed separately to /questions/submitAnswers).
// Same pattern as StudentDashboard/PracticeRoom/components/PracticeSheet.jsx
// (both share hooks/useOnlyOfficeEditor.js) but the editor config here is
// generated server-side from the student's real, verified exam session
// (verifyExamToken) rather than a client-side stand-in id — see
// backend/controllers/onlyofficeExamController.js.
const CONTAINER_ID = "exam-onlyoffice-container";
const FETCH_OPTIONS = { credentials: "include" };

function mapErrorStatus(status) {
  return status === 401
    ? "Exam session expired or not started — please reload."
    : `config request failed: ${status}`;
}

export default function PracticeSheet() {
  const currentQuestion = useExamStore((state) => state.currentQuestion);
  // startTime is only set once startExam() finishes (useExamStore.js) —
  // which is also when the backend actually sets the ExamToken cookie our
  // config request needs. This component can mount well before that
  // completes (it doesn't wait on question data the way startExam() does),
  // so gate on it (via configUrl being null) rather than firing the
  // request immediately and racing.
  const startTime = useExamStore((state) => state.startTime);

  // Hold off the OnlyOffice bootstrap (DocsAPI script eval + DocEditor init —
  // heavy, mostly synchronous main-thread work) until the browser is idle
  // after the exam session has started. startExam() resolving is also when
  // the countdown starts, so kicking the editor off in the same moment makes
  // the two contend for the main thread and — on a slow/throttled device —
  // freezes the timer UI until the editor finishes. Deferring lets the exam
  // shell + timer paint first; the spreadsheet then loads behind them. Only
  // the first load is gated; later question switches re-init immediately.
  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => {
    if (!startTime || deferReady) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setDeferReady(true), { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setDeferReady(true), 1500);
    return () => clearTimeout(t);
  }, [startTime, deferReady]);

  const configUrl = startTime && deferReady
    ? `${BROWSER_BASE_URL}/api/onlyoffice/exam/${currentQuestion}/config`
    : null;

  // Pause the exam timer for every spreadsheet (re)load, not just the first
  // — each question switch re-inits the editor, and a slow office server
  // hits every one of those, not only exam start. useOnlyOfficeEditor's
  // onReady resumes it, on genuine ready or on load failure alike; a hard
  // timeout inside setEditorLoading resumes it regardless if the office
  // server never responds at all (see timerSlice.js).
  const setEditorLoading = useExamStore((state) => state.setEditorLoading);
  useEffect(() => {
    if (configUrl) setEditorLoading(true);
  }, [configUrl, setEditorLoading]);

  const { error } = useOnlyOfficeEditor({
    containerId: CONTAINER_ID,
    configUrl,
    fetchOptions: FETCH_OPTIONS,
    mapErrorStatus,
    onReady: () => setEditorLoading(false),
  });

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm text-red-600">Couldn&apos;t load the spreadsheet editor: {error}</p>
        <p className="text-xs text-gray-500 max-w-xs">
          This pane is scratch space only — your questions, answers, and the timer
          are unaffected. You can keep working and reload the page to retry.
        </p>
      </div>
    );
  }

  if (!startTime || !deferReady) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 text-center text-sm text-gray-500">
        {startTime ? "Preparing spreadsheet…" : "Starting exam session…"}
      </div>
    );
  }

  return (
    <div className="editor-container h-full w-full flex flex-col flex-1 relative" style={{ minHeight: 0 }}>
      <div id={CONTAINER_ID} className="w-full h-full absolute inset-0" />
    </div>
  );
}

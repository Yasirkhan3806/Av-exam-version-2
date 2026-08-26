"use client";
import { useEffect, useRef, useState } from "react";
import useExamStore from "../../../store/useExamStore";

// OnlyOffice embed for the real exam's spreadsheet pane — replaces the
// previous Univer.js editor. This pane is rough-work scratch space only:
// never graded, never part of the submitted answer (that's AnswerWindow.jsx's
// ReactQuill rich text, POSTed separately to /questions/submitAnswers).
// Same pattern as StudentDashboard/PracticeRoom/components/PracticeSheet.jsx,
// but the editor config is generated server-side from the student's real,
// verified exam session (verifyExamToken) rather than a client-side stand-in
// id — see backend/controllers/onlyofficeExamController.js. The config
// arrives already JWT-signed; this component must pass it to
// DocsAPI.DocEditor completely unmodified, or the signature stops matching.
const DOCUMENT_SERVER_URL = "http://localhost:8080";
const BROWSER_BASE_URL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";
const CONTAINER_ID = "exam-onlyoffice-container";

// Loaded once and reused across question switches / remounts.
let docsApiLoadPromise = null;
function loadDocsApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.DocsAPI) return Promise.resolve();
  if (!docsApiLoadPromise) {
    docsApiLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${DOCUMENT_SERVER_URL}/web-apps/apps/api/documents/api.js`;
      script.onload = () => resolve();
      script.onerror = () => {
        docsApiLoadPromise = null; // allow retry on next mount
        reject(new Error("Failed to load OnlyOffice DocsAPI script — is the Document Server container running on :8080?"));
      };
      document.body.appendChild(script);
    });
  }
  return docsApiLoadPromise;
}

export default function PracticeSheet() {
  const editorInstanceRef = useRef(null);
  const [error, setError] = useState(null);

  const currentQuestion = useExamStore((state) => state.currentQuestion);
  // startTime is only set once startExam() finishes (useExamStore.js) —
  // which is also when the backend actually sets the ExamToken cookie our
  // config request needs. This component can mount well before that
  // completes (it doesn't wait on question data the way startExam() does),
  // so gate on it rather than firing the request immediately and racing.
  const startTime = useExamStore((state) => state.startTime);

  useEffect(() => {
    if (!startTime) return;
    let cancelled = false;

    async function init() {
      try {
        await loadDocsApi();
        if (cancelled) return;

        const configRes = await fetch(
          `${BROWSER_BASE_URL}/api/onlyoffice/exam/${currentQuestion}/config`,
          { credentials: "include" }
        );
        if (!configRes.ok) {
          throw new Error(
            configRes.status === 401
              ? "Exam session expired or not started — please reload."
              : `config request failed: ${configRes.status}`
          );
        }
        const signedConfig = await configRes.json();
        if (cancelled) return;

        // Passed through verbatim — the backend already signed this exact
        // object (including height/width). Do not spread/add/mutate any
        // field here.
        editorInstanceRef.current = new window.DocsAPI.DocEditor(CONTAINER_ID, signedConfig);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      editorInstanceRef.current?.destroyEditor?.();
      editorInstanceRef.current = null;
    };
  }, [currentQuestion, startTime]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 text-center text-sm text-red-600">
        Couldn't load the spreadsheet editor: {error}
      </div>
    );
  }

  if (!startTime) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 text-center text-sm text-gray-500">
        Starting exam session…
      </div>
    );
  }

  return (
    <div className="editor-container h-full w-full flex flex-col flex-1 relative" style={{ minHeight: 0 }}>
      <div id={CONTAINER_ID} className="w-full h-full absolute inset-0" />
    </div>
  );
}

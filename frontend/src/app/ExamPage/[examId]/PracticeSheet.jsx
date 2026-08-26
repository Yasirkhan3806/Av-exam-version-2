"use client";
import useExamStore from "../../../store/useExamStore";
import { useOnlyOfficeEditor } from "../../../hooks/useOnlyOfficeEditor";

// OnlyOffice embed for the real exam's spreadsheet pane — replaces the
// previous Univer.js editor. This pane is rough-work scratch space only:
// never graded, never part of the submitted answer (that's AnswerWindow.jsx's
// ReactQuill rich text, POSTed separately to /questions/submitAnswers).
// Same pattern as StudentDashboard/PracticeRoom/components/PracticeSheet.jsx
// (both share hooks/useOnlyOfficeEditor.js) but the editor config here is
// generated server-side from the student's real, verified exam session
// (verifyExamToken) rather than a client-side stand-in id — see
// backend/controllers/onlyofficeExamController.js.
const BROWSER_BASE_URL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";
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

  const configUrl = startTime
    ? `${BROWSER_BASE_URL}/api/onlyoffice/exam/${currentQuestion}/config`
    : null;

  const { error } = useOnlyOfficeEditor({
    containerId: CONTAINER_ID,
    configUrl,
    fetchOptions: FETCH_OPTIONS,
    mapErrorStatus,
  });

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

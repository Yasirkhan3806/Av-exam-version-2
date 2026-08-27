"use client";
import { useMemo } from "react";
import usePracticeStore from "../../../../store/usePracticeStore";
import { useOnlyOfficeEditor } from "../../../../hooks/useOnlyOfficeEditor";
import { BASEURL as BROWSER_BASE_URL } from "@/utils/config";

// OnlyOffice embed for Practice Room's spreadsheet pane — replaces the
// previous Univer.js editor (removed entirely; the real exam interface's
// copy at ExamPage/[examId]/PracticeSheet.jsx was migrated the same way).
// Both share hooks/useOnlyOfficeEditor.js.
//
// Local dev only: points at the OnlyOffice Document Server container running
// on this machine (docker run ... -p 8080:80 onlyoffice/documentserver,
// started with JWT_ENABLED=true and ALLOW_PRIVATE_IP_ADDRESS=true). The
// editor config is built and JWT-signed server-side (see
// backend/controllers/onlyofficeController.js's getConfig) — required once
// the shared container enforces JWT — so this component just fetches the
// finished config and hands it to DocsAPI.DocEditor verbatim; it must not
// construct or mutate any of document/editorConfig/permissions itself, or
// the signature stops matching. Backed by backend/routes/onlyofficeRoutes.js
// — in-memory only, no real persistence (matches Practice Room's existing
// "lost on refresh" behavior).
const CONTAINER_ID = "practice-onlyoffice-container";

export default function PracticeSheet() {
  const currentQuestion = usePracticeStore((state) => state.currentQuestion);

  // Practice Room has no logged-in student identity available client-side
  // (nothing here reads an auth token/student id — checked). Without a
  // per-student key, every student editing "question 1" would share the
  // exact same in-memory document. Stand in with a per-browser-tab id
  // instead so each student gets their own copy; survives refresh within
  // the tab (sessionStorage), not shared across tabs/devices.
  const configUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    let sessionId = sessionStorage.getItem("practiceOnlyOfficeSessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("practiceOnlyOfficeSessionId", sessionId);
    }
    const baseKey = `practice-${sessionId}-q${currentQuestion}`;
    return `${BROWSER_BASE_URL}/api/onlyoffice/practice/${baseKey}/config?userId=${encodeURIComponent(sessionId)}`;
  }, [currentQuestion]);

  const { error } = useOnlyOfficeEditor({ containerId: CONTAINER_ID, configUrl });

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 text-center text-sm text-red-600">
        Couldn't load the spreadsheet editor: {error}
      </div>
    );
  }

  return (
    <div className="editor-container h-full w-full flex flex-col flex-1 relative" style={{ minHeight: 0 }}>
      <div id={CONTAINER_ID} className="w-full h-full absolute inset-0" />
    </div>
  );
}

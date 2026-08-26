"use client";
import { useEffect, useRef, useState } from "react";
import usePracticeStore from "../../../../store/usePracticeStore";

// OnlyOffice embed for Practice Room's spreadsheet pane — replaces the
// previous Univer.js editor (kept intact in ExamPage/[examId]/PracticeSheet.jsx,
// the real exam interface's own copy, which this file does not touch).
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
const DOCUMENT_SERVER_URL = "http://localhost:8080";
const BROWSER_BASE_URL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";
const CONTAINER_ID = "practice-onlyoffice-container";

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

  const currentQuestion = usePracticeStore((state) => state.currentQuestion);

  useEffect(() => {
    let cancelled = false;
    // Practice Room has no logged-in student identity available client-side
    // (nothing here reads an auth token/student id — checked). Without a
    // per-student key, every student editing "question 1" would share the
    // exact same in-memory document. Stand in with a per-browser-tab id
    // instead so each student gets their own copy; survives refresh within
    // the tab (sessionStorage), not shared across tabs/devices.
    let sessionId = sessionStorage.getItem("practiceOnlyOfficeSessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("practiceOnlyOfficeSessionId", sessionId);
    }
    const baseKey = `practice-${sessionId}-q${currentQuestion}`;

    async function init() {
      try {
        await loadDocsApi();
        if (cancelled) return;

        const configRes = await fetch(
          `${BROWSER_BASE_URL}/api/onlyoffice/practice/${baseKey}/config?userId=${encodeURIComponent(sessionId)}`
        );
        if (!configRes.ok) throw new Error(`config request failed: ${configRes.status}`);
        const signedConfig = await configRes.json();
        if (cancelled) return;

        // Passed through verbatim — height/width are already baked in
        // server-side. Do not spread/add/mutate any field here: the
        // backend signed this exact object, and Document Server validates
        // the signature against it as received.
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
  }, [currentQuestion]);

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

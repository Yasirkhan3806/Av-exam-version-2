// Loads the OnlyOffice DocsAPI script once and caches the promise, so
// switching between questions or remounting the editor doesn't re-fetch it.
// Shared by both spreadsheet panes (ExamPage's real exam, Practice Room's
// scratch space) via hooks/useOnlyOfficeEditor.js.
//
// The browser loads api.js from — and the editor iframe then talks directly
// to — the Document Server, so this must be a URL reachable from the
// student's browser. In production set NEXT_PUBLIC_ONLYOFFICE_URL to the
// Document Server's public HTTPS origin (it's inlined at build time, so
// rebuild the frontend after changing it). Falls back to the local dev
// container on :8080.
const DOCUMENT_SERVER_URL =
  process.env.NEXT_PUBLIC_ONLYOFFICE_URL || "http://localhost:8080";

let docsApiLoadPromise = null;

export function loadDocsApi() {
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

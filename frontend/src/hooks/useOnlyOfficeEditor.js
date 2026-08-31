"use client";
import { useEffect, useRef, useState } from "react";
import { loadDocsApi } from "../utils/onlyOfficeLoader";
import { safeFetch } from "@/utils/safeFetch";

/**
 * Mounts an OnlyOffice DocsAPI.DocEditor into #containerId, fetching a
 * server-signed config from configUrl and handing it to DocEditor
 * completely unmodified (the backend signs the exact object it returns —
 * spreading/adding/mutating any field here breaks the signature check).
 *
 * Shared by ExamPage/[examId]/PracticeSheet.jsx (the real exam's
 * spreadsheet pane) and StudentDashboard/PracticeRoom/components/
 * PracticeSheet.jsx (scratch space) — previously ~90% duplicated between
 * the two.
 *
 * @param {object} options
 * @param {string} options.containerId - DOM id to mount the editor into.
 * @param {string|null|undefined} options.configUrl - URL to fetch the
 *   signed config from. Pass null/undefined to hold off firing (e.g. the
 *   real exam pane waits on its exam session to actually start) — the
 *   effect below does nothing until this is a real URL string.
 * @param {RequestInit} [options.fetchOptions] - extra safeFetch() options,
 *   e.g. { credentials: "include" }. Not part of the effect's dependency
 *   array (see note below) — pass a stable value if it ever needs to vary
 *   per render in a way that should re-trigger the fetch; today neither
 *   caller does.
 * @param {(status: number) => string} [options.mapErrorStatus] - optional
 *   override for turning a non-ok response status into an error message
 *   (e.g. a friendlier message for 401).
 * @param {() => void} [options.onReady] - fired once per load, either when
 *   the document genuinely finishes loading (DocsAPI's onDocumentReady —
 *   the real "office server is slow" signal, distinct from the config
 *   fetch resolving) or when the load fails outright. Callers use this to
 *   release an "is loading" pause (e.g. the exam timer) — it must fire on
 *   failure too, or that pause would wait forever for a signal that's
 *   never coming; the error state below already tells the student what
 *   happened.
 * @returns {{ error: string|null }}
 */
export function useOnlyOfficeEditor({ containerId, configUrl, fetchOptions, mapErrorStatus, onReady }) {
  const editorInstanceRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!configUrl) return;
    let cancelled = false;
    let signaled = false;
    const signalReady = () => {
      if (cancelled || signaled) return;
      signaled = true;
      onReady?.();
    };

    async function init() {
      try {
        await loadDocsApi();
        if (cancelled) return;

        const configRes = await safeFetch(configUrl, fetchOptions);
        if (!configRes.ok) {
          const message = mapErrorStatus
            ? mapErrorStatus(configRes.status)
            : `config request failed: ${configRes.status}`;
          throw new Error(message);
        }
        const signedConfig = await configRes.json();
        if (cancelled) return;

        // events is not part of the signed payload (only document/
        // documentType/editorConfig/height/width are — see
        // onlyofficeExamController.js) — adding it here doesn't touch
        // anything the backend signed.
        editorInstanceRef.current = new window.DocsAPI.DocEditor(containerId, {
          ...signedConfig,
          events: { onDocumentReady: signalReady },
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
        signalReady();
      }
    }

    init();

    return () => {
      cancelled = true;
      editorInstanceRef.current?.destroyEditor?.();
      editorInstanceRef.current = null;
    };
    // fetchOptions/mapErrorStatus deliberately excluded: both callers pass
    // values that don't change across a given render's lifetime, and
    // including fresh object/function literals here would re-fire the
    // fetch on every render instead of only when configUrl actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configUrl, containerId]);

  return { error };
}

export default useOnlyOfficeEditor;

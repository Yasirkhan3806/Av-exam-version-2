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
 * @returns {{ error: string|null }}
 */
export function useOnlyOfficeEditor({ containerId, configUrl, fetchOptions, mapErrorStatus }) {
  const editorInstanceRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!configUrl) return;
    let cancelled = false;

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

        editorInstanceRef.current = new window.DocsAPI.DocEditor(containerId, signedConfig);
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
    // fetchOptions/mapErrorStatus deliberately excluded: both callers pass
    // values that don't change across a given render's lifetime, and
    // including fresh object/function literals here would re-fire the
    // fetch on every render instead of only when configUrl actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configUrl, containerId]);

  return { error };
}

export default useOnlyOfficeEditor;

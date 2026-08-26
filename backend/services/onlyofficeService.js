import axios from "axios";
import { DEFAULT_SPREADSHEET_TEMPLATE } from "../utils/onlyofficeTemplate.js";

/**
 * Practice Room OnlyOffice integration — STUB persistence only.
 *
 * Practice Room has no backend data model today (see PracticeRoom/page.js —
 * questions are dummy, answers live only in the browser's Zustand store and
 * are lost on refresh). This mirrors that: documents are held in a plain
 * in-memory Map, not a DB. Restarting the server, or the process recycling,
 * wipes everything — same "lost on refresh" ceiling Practice Room already
 * has, just moved server-side for the duration of one save/reload cycle.
 *
 * NOT wired to any real question/answer/exam model, and NOT for the actual
 * exam interface — Practice Room only, by design (see ExamPage's own
 * PracticeSheet.jsx, which this does not touch).
 */

const store = new Map(); // baseKey -> { buffer: Buffer, version: number }

export function getMeta(baseKey) {
  const entry = store.get(baseKey);
  return { version: entry ? entry.version : 0 };
}

export function getDocument(baseKey) {
  const entry = store.get(baseKey);
  return entry ? entry.buffer : DEFAULT_SPREADSHEET_TEMPLATE;
}

/**
 * Downloads the edited document from the URL the Document Server hands back
 * in its save-callback, and stores it as the new version for baseKey.
 * @returns {Promise<number>} the new version number
 */
export async function saveFromCallback(baseKey, downloadUrl) {
  const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
  const prev = store.get(baseKey);
  const nextVersion = (prev?.version || 0) + 1;
  store.set(baseKey, { buffer: Buffer.from(response.data), version: nextVersion });
  return nextVersion;
}

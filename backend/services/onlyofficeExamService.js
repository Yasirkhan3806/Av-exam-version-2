import axios from "axios";
import { DEFAULT_SPREADSHEET_TEMPLATE } from "../utils/onlyofficeTemplate.js";

/**
 * Real exam's OnlyOffice spreadsheet pane — STUB persistence only, same
 * pattern as backend/services/onlyofficeService.js (Practice Room), but
 * keyed by the real per-student ExamId (the student's Answer._id, from
 * verifyExamToken) instead of a client-generated session id.
 *
 * This spreadsheet is rough-work scratch space only — never graded, never
 * part of the submitted answer (see AnswerWindow.jsx / Answer.answers for
 * the real graded content, untouched by this). In-memory only, matching
 * the user's explicit choice: restarting the backend wipes it, same ceiling
 * Univer's data already had (it never reached the server at all before).
 */

const store = new Map(); // `${examId}:q${questionNumber}` -> { buffer, version }

function keyFor(examId, questionNumber) {
  return `${examId}:q${questionNumber}`;
}

export function getMeta(examId, questionNumber) {
  const entry = store.get(keyFor(examId, questionNumber));
  return { version: entry ? entry.version : 0 };
}

export function getDocument(examId, questionNumber) {
  const entry = store.get(keyFor(examId, questionNumber));
  return entry ? entry.buffer : DEFAULT_SPREADSHEET_TEMPLATE;
}

/**
 * Downloads the edited document from the URL Document Server hands back in
 * its save-callback, and stores it as the new version for this exam/question.
 * @returns {Promise<number>} the new version number
 */
export async function saveFromCallback(examId, questionNumber, downloadUrl) {
  const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
  const key = keyFor(examId, questionNumber);
  const prev = store.get(key);
  const nextVersion = (prev?.version || 0) + 1;
  store.set(key, { buffer: Buffer.from(response.data), version: nextVersion });
  return nextVersion;
}

/**
 * examDebugTrail.js
 * -------------------
 * Domain-level breadcrumb trail for the exam flow, mirrored into
 * localStorage so it survives a hard freeze or tab kill that never gives
 * Sentry a chance to flush from memory. On the next load, any leftover
 * trail is uploaded to Sentry as a recovery message and cleared.
 *
 * This is intentionally generic (not tied to any specific editor) — it logs
 * exam-level state transitions (start, finish, connectivity) so a bug
 * report can be reconstructed into a timeline even if the crash itself
 * left no stack trace.
 */

import * as Sentry from "@sentry/nextjs";

const TRAIL_KEY = "exam_debug_trail";
const MAX_ENTRIES = 30;

export function logExamEvent(action, data = {}) {
  try {
    Sentry.addBreadcrumb({ category: "exam", message: action, data, level: "info" });
  } catch (_) {
    // Sentry not initialized yet — ignore, this is best-effort.
  }

  try {
    if (typeof window === "undefined") return;
    const trail = JSON.parse(localStorage.getItem(TRAIL_KEY) || "[]");
    trail.push({ t: Date.now(), action, data });
    if (trail.length > MAX_ENTRIES) trail.shift();
    localStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch (_) {
    // localStorage unavailable/full/private-mode — ignore, non-critical.
  }
}

/**
 * Call once on app init. If a trail was left behind by a session that
 * never got to clean up after itself, upload it to Sentry and clear it so
 * it isn't re-reported on the next load.
 */
export function recoverExamDebugTrail() {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(TRAIL_KEY);
    if (!raw) return;

    localStorage.removeItem(TRAIL_KEY);

    const trail = JSON.parse(raw);
    if (!Array.isArray(trail) || trail.length === 0) return;

    Sentry.captureMessage("Recovered exam debug trail from previous session", {
      level: "warning",
      tags: { source: "exam_debug_trail_recovery" },
      extra: { trail },
    });
  } catch (_) {
    // Corrupt trail or storage error — nothing useful to recover, ignore.
  }
}

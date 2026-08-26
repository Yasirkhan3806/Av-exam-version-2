# Comprehensive Frontend Error Tracking Plan

**Goal:** Catch every class of frontend failure — not just the three reported bugs — by layering automatic, structural, and domain-specific instrumentation. No single mechanism catches everything (thrown errors, promise rejections, network failures, render crashes, freezes, and silent logic bugs are all different failure shapes). This plan stacks them so a bug has to slip past multiple layers to go unseen.

---

## Priority Order

Fix in this order — priority 1 is causing actual data loss, not just bad UX.

1. **False "completed" status on refresh** — silent data loss, fixable now without any new tooling
2. **Instrumentation layer (Layers 1-6)** — needed before you can diagnose #3 and #1 with real data
3. **Paste freeze root cause** — needs the instrumentation from step 2 to catch in the wild
4. **Formula calculation bug** — most straightforward to trace once breadcrumbs are in place

---

## Phase 1: Stop the bleeding (Fix the false-completion bug)

This doesn't require Sentry at all. Before instrumenting anything, find and guard the code path.

### 1.1 Locate the trigger
Search your frontend for anywhere exam status gets set to `completed`/`submitted`. Common culprits:
- A `beforeunload` or `pagehide` handler that submits/finalizes on any unload, not just explicit submit
- A `visibilitychange` handler treating tab-hidden as "done"
- A stale WebSocket/polling disconnect being misread as "session ended → mark complete"

```bash
grep -rn "beforeunload\|visibilitychange\|pagehide" frontend/src
grep -rn "status.*completed\|status.*submitted" frontend/src backend/src
```

### 1.2 Guard it
Status should only ever be set to `completed` from **one** place: the explicit submit action. Everything else should at most mark the session as `interrupted` or `disconnected`.

```javascript
// GOOD
window.addEventListener('beforeunload', (e) => {
  if (!examSubmittedExplicitly) {
    saveProgressSnapshot(); // just persist state, don't finalize
    e.preventDefault();
    e.returnValue = ''; // triggers native "are you sure?" browser prompt
  }
});
```

### 1.3 Backend safety net
Add a server-side rule: a session can only transition to `completed` via the explicit `/submit` endpoint, never via a timeout/disconnect handler. Disconnects should set `interrupted`.

---

## Phase 2: Layered Instrumentation Strategy

### Layer 1: Automatic capture (Baseline)

Don't assume defaults cover everything. Explicitly enable these integrations.

```javascript
// sentry.client.config.mjs
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION, 

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error", "warn"] }), // Catches silent bugs that log
    Sentry.extraErrorDataIntegration(),
    Sentry.httpClientIntegration(), // Captures 4xx/5xx as errors
  ],
  beforeSend(event, hint) {
    if (typeof window !== "undefined" && window.__examContext) {
      event.tags = { ...event.tags, ...window.__examContext };
    }
    return event;
  },
});
```

**Audit for error-swallowing code:** Search for any `catch (e) {}` blocks that don't call `Sentry.captureException(e)`. These are blind spots.

### Layer 2: Structural coverage (Error Boundaries)

One boundary around the editor isn't enough. Wrap major independent regions so one component doesn't take down the whole page.

**Next.js App Router error files:**
- `app/exam/[examId]/error.jsx`: Catches errors in the route segment.
- `app/global-error.jsx`: The LAST line of defense for the root layout.

**Nested feature-level boundaries:**
```jsx
<ExamLayout>
  <ErrorBoundary tag="timer">      <ExamTimer />       </ErrorBoundary>
  <ErrorBoundary tag="question-nav"><QuestionNav />     </ErrorBoundary>
  <ErrorBoundary tag="editor">      <GlobalErrorBoundary><Univer/></GlobalErrorBoundary></ErrorBoundary>
  <ErrorBoundary tag="submit-bar">  <SubmitBar />        </ErrorBoundary>
</ExamLayout>
```

### Layer 3: Network & API failure coverage

Route all API calls through a wrapper to catch timeouts, 500s, and offline drops.

```javascript
// Central fetch/axios wrapper
async function apiCall(url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      Sentry.captureMessage(`API ${res.status}: ${url}`, {
        level: res.status >= 500 ? "error" : "warning",
        extra: { status: res.status, durationMs: performance.now() - start },
      });
    }
    if (res.status === 401) {
      Sentry.captureMessage("Session expired mid-exam", { level: "error", tags: { critical: "true" } });
    }
    return res;
  } catch (err) {
    Sentry.captureException(err, { tags: { source: "network" }, extra: { url } });
    throw err;
  }
}
```

### Layer 4: Performance & freeze coverage

This is the single most important addition for the **paste-freeze bug**. A hang isn't a thrown error.

```javascript
// utils/freezeWatchdog.js
export function initFreezeWatchdog() {
  if (typeof PerformanceObserver === "undefined") return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        Sentry.addBreadcrumb({ category: "performance", message: `Long task: ${Math.round(entry.duration)}ms`, level: entry.duration > 3000 ? "error" : "warning" });
      }
      if (entry.duration > 3000) {
        Sentry.captureMessage(`Main thread blocked ${Math.round(entry.duration)}ms`, "warning");
      }
    }
  });

  observer.observe({ entryTypes: ["longtask"] });
}
```

### Layer 5: Domain-specific breadcrumbs 

This turns a vague "it froze" into a reconstructable timeline.

**1. Global Exam Context:**
```javascript
function setExamContext({ examId, questionId, studentId, attemptId }) {
  window.__examContext = { examId, questionId, attemptId };
  Sentry.setUser({ id: studentId });
  Sentry.setTag("examId", examId);
  Sentry.setTag("questionId", questionId);
}
```

**2. State Transitions & Paste Instrumentation:**
```javascript
function logExamEvent(action, data = {}) {
  Sentry.addBreadcrumb({ category: "exam", message: action, data, level: "info" });
}

// In your paste handler:
logExamEvent("paste_attempted", { htmlSize: html.length, estimatedRows });
try {
  handleUniverPaste(e); 
  logExamEvent("paste_completed", { durationMs: performance.now() - start });
} catch (err) {
  Sentry.captureException(err, { extra: { htmlSize: html.length, estimatedRows } });
  throw err;
}
```

**3. localStorage Fallback Trail (Survives Hard Freezes):**
```javascript
function logLocalBreadcrumb(action, data) {
  try {
    const trail = JSON.parse(localStorage.getItem("exam_debug_trail") || "[]");
    trail.push({ t: Date.now(), action, data });
    if (trail.length > 30) trail.shift();
    localStorage.setItem("exam_debug_trail", JSON.stringify(trail));
  } catch {}
}
// On app init, read this trail. If it exists, upload to Sentry and clear it.
```

### Layer 6: Source maps & release tracking

Ensure `SENTRY_AUTH_TOKEN` is set in your build environment so source maps are uploaded.
Tag every deploy in `next.config.mjs` with a release name (e.g., `GIT_COMMIT_SHA`) to trace regressions to specific deployments.

---

## Phase 3: Reproduce the paste freeze deliberately

Actively try to trigger the freeze using a Playwright stress suite with CPU throttling.

```javascript
// tests/paste-stress.spec.js
test(`paste: large-grid`, async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // simulate weak device

  await page.goto('/exam/test-question-2');
  const html = buildFakeExcelClipboard({ rows: 100, cols: 20 });
  
  await page.evaluate((htmlContent) => {
    const dt = new DataTransfer();
    dt.setData('text/html', htmlContent);
    document.querySelector('.univer-container').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, html);

  await expect(page.locator('.univer-container')).toBeVisible({ timeout: 5000 });
});
```

---

## Phase 4: Fix the formula calculation bug

With breadcrumbs from Layer 5 in place (`formula_recalc_triggered` / `formula_recalc_result`), cross-check against known issues when it reproduces. You will have the exact cell reference, formula, and whether recalculation fired.

---

## Phase 5: Alerting & Dashboard Setup

- **Alert:** Any event tagged `critical: true` (auth expiry, false-completion trigger) → immediate Slack/email.
- **Alert:** Any event tagged `category: performance` with `level: error` (long task >3s).
- **Alert:** Error rate spike >3x baseline within 10 minutes.
- **Alert:** Any `global-error` or root boundary hit.
- **Saved Views:** Group by `release`, `boundary`, and `questionId`.

---

## Phase 6: Validation Checklist

Deliberately trigger each layer in staging:
- [ ] Locate + fix beforeunload/status handler (Phase 1)
- [ ] Thrown error in a component with no boundary → caught by `global-error.jsx`
- [ ] Thrown error inside a feature boundary → tagged correctly, page stays usable
- [ ] `console.error("test")` → shows up via `captureConsoleIntegration`
- [ ] Bare `try/catch` audited and fixed
- [ ] Force a 500 API route → `httpClientIntegration` reports it
- [ ] Force a 401 → session-expiry capture fires
- [ ] Throttle network to offline → `connectivity_lost` breadcrumb logs
- [ ] Simulate a long task (`for(let i=0;i<1e9;i++){}`) → long-task watchdog fires
- [ ] Trigger a large paste → breadcrumbs + replay attached
- [ ] Confirm stack traces show real file names (source maps working)
- [ ] Kill the tab mid-freeze, reopen → `exam_debug_trail` recovery message appears

---

## What this still won't catch (The honest ceiling)

- **True process/tab kill (OOM, force-close)** before any flush. The localStorage recovery trail mitigates this, but requires the student to reopen the app.
- **Bugs with no observable symptom** (e.g. a value silently computed wrong but never logged). Domain breadcrumbs are required at every calculation point to catch these silent-wrong-value bugs.
- **Third-party script failures** outside your control (e.g., Adblockers blocking passive scripts).

"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

// Dynamically load to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const TOOLBAR_OPTIONS = [
  [{ font: [] }],
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  ["link", "image", "video", "formula", "table"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ["clean"],
];

const MODULES = { toolbar: TOOLBAR_OPTIONS };

// --- Paste hardening -------------------------------------------------------
// Pasting a whole Ctrl+A selection out of the OnlyOffice / Excel spreadsheet
// used to freeze the tab: the clipboard carries a multi-MB <table> with
// per-cell inline styles, mso-* junk, <colgroup> widths and embedded images,
// and Quill's clipboard module converts all of it synchronously on the main
// thread, then re-renders. We intercept the paste in the capture phase
// (before Quill's own bubble-phase handler — calling preventDefault() there
// makes Quill bail), strip the payload down to a safe formatting subset,
// cap the table size, and enforce a hard character ceiling on the answer.

// Real answers run a few thousand characters; this only ever trips on a bulk
// spreadsheet paste.
const MAX_ANSWER_CHARS = 200000;
// Below this, a plain-text paste with no HTML is left to Quill's native path
// (keeps its undo history behaviour intact).
const PLAIN_TAKEOVER_CHARS = 20000;
// If the raw clipboard HTML is bigger than this we don't even parse it —
// straight to truncated plain text.
const MAX_RAW_HTML = 5000000;
// Hard ceiling on table cells kept from a paste.
const MAX_TABLE_CELLS = 4000;

const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SPAN", "DIV",
  "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE",
  "PRE", "CODE", "A", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH",
  "SUB", "SUP",
]);

// Per-tag attribute allowlist. Anything not listed (style, class, width,
// bgcolor, lang, dir, mso-*, data-*, ...) is dropped.
const ALLOWED_ATTRS = {
  A: new Set(["href"]),
  TD: new Set(["colspan", "rowspan"]),
  TH: new Set(["colspan", "rowspan"]),
};

// Elements removed together with their contents.
const DROP_WITH_CONTENT = new Set([
  "STYLE", "SCRIPT", "META", "LINK", "TITLE", "HEAD", "IMG", "SVG", "PICTURE",
  "VIDEO", "AUDIO", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON",
  "SELECT", "TEXTAREA", "NOSCRIPT", "XML",
]);

/**
 * Reduce arbitrary clipboard HTML (Excel, OnlyOffice, Word, Google Sheets)
 * to a small, style-free subset Quill can absorb cheaply. Returns an HTML
 * string, or null if the input can't be parsed.
 */
function sanitizePastedHtml(html, maxCells) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return null;
  }
  const body = doc?.body;
  if (!body) return null;

  // 1. Strip comments (Word/Excel bury conditional markup in them).
  const commentWalker = doc.createTreeWalker(body, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (commentWalker.nextNode()) comments.push(commentWalker.currentNode);
  comments.forEach((c) => c.remove());

  // 2. Remove unwanted subtrees outright (includes namespaced tags like <o:p>, <v:shape>).
  body.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toUpperCase();
    if (DROP_WITH_CONTENT.has(tag) || tag.includes(":")) el.remove();
  });

  // 3. Walk the survivors: drop attributes, unwrap non-allowlisted tags.
  //    Static list up front because the tree is mutated during the loop;
  //    document order means parents are handled before their children, and
  //    children unwrapped up a level are still visited later in the list.
  const all = Array.from(body.querySelectorAll("*"));
  for (const el of all) {
    if (!el.isConnected) continue;
    const tag = el.tagName.toUpperCase();

    const keep = ALLOWED_ATTRS[tag];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!keep || !keep.has(name)) {
        el.removeAttribute(attr.name);
      } else if (name === "href" && !/^(https?:|mailto:|\/|#)/i.test(attr.value.trim())) {
        el.removeAttribute("href");
      }
    }

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    }
  }

  // 4. Cap table size so a whole-sheet paste can't blow up the document.
  const cells = body.querySelectorAll("td, th");
  if (cells.length > maxCells) {
    let count = 0;
    body.querySelectorAll("tr").forEach((row) => {
      if (count > maxCells) {
        row.remove();
        return;
      }
      count += row.querySelectorAll("td, th").length;
    });
  }

  return body.innerHTML;
}

/**
 * Rich-text answer editor (ReactQuill + toolbar + layout) — shared by the
 * real exam's AnswerWindow.jsx and Practice Room's PracticeAnswerWindow.jsx,
 * previously ~90% duplicated between the two. Each caller keeps its own
 * store wiring (load-on-question-change, autosave debounce, saving-state
 * flag) since those genuinely differ between the two contexts — e.g. the
 * real exam autosaves on a 2s debounce and skips saving an empty value,
 * Practice Room autosaves at 500ms with no such guard. This component is
 * just the editor itself: a controlled value/onChange pair.
 */
export default function RichTextAnswerEditor({ value, onChange }) {
  const wrapperRef = useRef(null);
  const [pasteTrimmed, setPasteTrimmed] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;
    let quill = null;
    let root = null;
    const noticeTimer = { id: null };

    const notifyTrimmed = () => {
      setPasteTrimmed(true);
      clearTimeout(noticeTimer.id);
      noticeTimer.id = setTimeout(() => setPasteTrimmed(false), 6000);
    };

    const onPaste = (e) => {
      if (!quill || e.defaultPrevented || !e.clipboardData) return;

      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain") || "";

      // Small plain-text paste with no HTML: let Quill handle it natively.
      if (!html && text.length <= PLAIN_TAKEOVER_CHARS) return;

      // Stop Quill's own (bubble-phase) paste handler from running.
      e.preventDefault();

      const range =
        quill.getSelection(true) || { index: Math.max(0, quill.getLength() - 1), length: 0 };
      const usedChars = Math.max(0, quill.getText().length - 1);
      const budget = MAX_ANSWER_CHARS - usedChars;
      if (budget <= 0) {
        notifyTrimmed();
        return;
      }

      if (range.length) quill.deleteText(range.index, range.length, "user");

      let trimmed = false;
      const cleaned =
        html && html.length <= MAX_RAW_HTML
          ? sanitizePastedHtml(html, MAX_TABLE_CELLS)
          : null;
      const cleanedText = cleaned ? cleaned.replace(/<[^>]+>/g, "") : "";

      if (cleaned && cleanedText.length <= budget) {
        quill.clipboard.dangerouslyPasteHTML(range.index, cleaned, "user");
      } else {
        // Nothing usable after cleaning, or still too large — plain text, truncated.
        const source = text || cleanedText;
        const slice = source.slice(0, budget);
        trimmed = slice.length < source.length;
        if (slice) quill.insertText(range.index, slice, "user");
      }

      // Hard ceiling regardless of the path above.
      const overflow = quill.getText().length - 1 - MAX_ANSWER_CHARS;
      if (overflow > 0) {
        quill.deleteText(MAX_ANSWER_CHARS, overflow, "user");
        trimmed = true;
      }

      if (trimmed) notifyTrimmed();
    };

    // ReactQuill mounts after its own dynamic import resolves; poll briefly
    // for the editor instance, then bind the capture-phase listener.
    let tries = 0;
    const attach = async () => {
      if (cancelled) return;
      let QuillClass;
      try {
        QuillClass = (await import("react-quill-new")).default.Quill;
      } catch {
        return;
      }
      if (cancelled) return;

      const container = wrapper.querySelector(".ql-container");
      const found = container && QuillClass.find(container);
      if (found) {
        quill = found;
        root = found.root;
        root.addEventListener("paste", onPaste, true);
        return;
      }
      if (tries++ < 100) setTimeout(attach, 100);
    };

    attach();

    return () => {
      cancelled = true;
      clearTimeout(noticeTimer.id);
      if (root) root.removeEventListener("paste", onPaste, true);
    };
  }, []);

  return (
    <div className="h-full flex flex-col" ref={wrapperRef}>
      {pasteTrimmed && (
        <div className="flex-none px-3 py-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md mb-1">
          Pasted content was large — formatting was simplified and the text was
          trimmed to fit. Please review your answer.
        </div>
      )}
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES}
        placeholder="Write something..."
        className="flex flex-col h-full"
      />
      <style jsx global>{`
        /* Make toolbar fixed at top */
        .ql-toolbar {
          flex: 0 0 auto;
        }

        /* Editor body takes the rest of the height */
        .ql-container {
          flex: 1 1 auto;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

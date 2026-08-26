"use client";
import dynamic from "next/dynamic";
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
  return (
    <div className="h-full flex flex-col">
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

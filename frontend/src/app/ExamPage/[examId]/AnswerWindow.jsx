"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import useExamStore from "./StateManagement";

// Dynamically load to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const Editor = () => {
  const [value, setValue] = useState("");
  const { setAnswer, setSaving, answers, currentQuestion } = useExamStore((state) => state);

  useEffect(() => {
    // Load existing answer when currentQuestion changes
    const existingAnswer = answers[`q${currentQuestion}`] || "";
    setValue(existingAnswer);
  }, [currentQuestion, answers]);


  // 📝 Auto-save with debounce
  useEffect(() => {
    if (!value) return;

    setSaving(true);

    const timer = setTimeout(() => {
      setAnswer(value);
      setSaving(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [value, setAnswer, setSaving]);

  const toolbarOptions = [
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

  const modules = {
    toolbar: toolbarOptions,
  };

  return (
    <div className="h-full flex flex-col">
      {/* ReactQuill needs a wrapper with flex-grow for editor body */}
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        modules={modules}
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
};

export default Editor;

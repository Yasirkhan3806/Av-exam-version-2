"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import usePracticeStore from "../../../../store/usePracticeStore";

// Dynamically load to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const PracticeAnswerWindow = () => {
  const [value, setValue] = useState("");
  const { setAnswer, answers, currentQuestion } = usePracticeStore();

  useEffect(() => {
    // Load existing answer when currentQuestion changes
    const existingAnswer = answers[`q${currentQuestion}`] || "";
    setValue(existingAnswer);
  }, [currentQuestion, answers]);

  // Auto-save to store (local state)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnswer(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, setAnswer]);

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

  return (
    <div className="h-full flex flex-col">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        modules={{ toolbar: toolbarOptions }}
        placeholder="Write something..."
        className="flex flex-col h-full"
      />
      <style jsx global>{`
        .ql-toolbar {
          flex: 0 0 auto;
        }
        .ql-container {
          flex: 1 1 auto;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default PracticeAnswerWindow;

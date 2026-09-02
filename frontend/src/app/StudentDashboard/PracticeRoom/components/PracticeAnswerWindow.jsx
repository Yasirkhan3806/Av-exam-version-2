"use client";

import React, { useState, useEffect, useRef } from "react";
import usePracticeStore from "../../../../store/usePracticeStore";
import RichTextAnswerEditor from "../../../../components/RichTextAnswerEditor";

const PracticeAnswerWindow = () => {
  const [value, setValue] = useState("");
  const { setAnswer, answers, currentQuestion } = usePracticeStore();

  // Latest answers map, read without making it an effect dependency — see below.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    // Load the saved answer for this question on question change only —
    // deliberately NOT on every `answers` change. The autosave replaces the
    // `answers` object reference, and depending on it here pushed the full
    // HTML back into Quill as a controlled value on every save.
    const existingAnswer = answersRef.current[`q${currentQuestion}`] || "";
    setValue(existingAnswer);
  }, [currentQuestion]);

  // Auto-save to store (local state)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnswer(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, setAnswer]);

  return <RichTextAnswerEditor value={value} onChange={setValue} />;
};

export default PracticeAnswerWindow;

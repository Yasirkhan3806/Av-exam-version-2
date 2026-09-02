"use client";

import React, { useState, useEffect, useRef } from "react";
import useExamStore from "../../../store/useExamStore";
import RichTextAnswerEditor from "../../../components/RichTextAnswerEditor";

const Editor = () => {
  const [value, setValue] = useState("");
  const { setAnswer, setSaving, answers, currentQuestion, hydrated } = useExamStore((state) => state);

  // Latest answers map, read without making it an effect dependency — see below.
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    // Load the saved answer for this question. This runs on question change
    // and once rehydration completes — deliberately NOT on every `answers`
    // change: the 2s autosave replaces the `answers` object reference, and
    // depending on it here pushed the full (possibly huge) HTML back into
    // Quill as a controlled value on every save, forcing a re-parse.
    if (!hydrated) return;
    const existingAnswer = answersRef.current[`q${currentQuestion}`] || "";
    setValue(existingAnswer);
  }, [currentQuestion, hydrated]);

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

  if (!hydrated) return null; // or show loader

  return <RichTextAnswerEditor value={value} onChange={setValue} />;
};

export default Editor;

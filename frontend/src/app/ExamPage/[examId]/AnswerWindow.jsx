"use client";

import React, { useState, useEffect } from "react";
import useExamStore from "../../../store/useExamStore";
import RichTextAnswerEditor from "../../../components/RichTextAnswerEditor";

const Editor = () => {
  const [value, setValue] = useState("");
  const { setAnswer, setSaving, answers, currentQuestion, hydrated } = useExamStore((state) => state);

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

  if (!hydrated) return null; // or show loader

  return <RichTextAnswerEditor value={value} onChange={setValue} />;
};

export default Editor;

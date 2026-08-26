"use client";

import React, { useState, useEffect } from "react";
import usePracticeStore from "../../../../store/usePracticeStore";
import RichTextAnswerEditor from "../../../../components/RichTextAnswerEditor";

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

  return <RichTextAnswerEditor value={value} onChange={setValue} />;
};

export default PracticeAnswerWindow;

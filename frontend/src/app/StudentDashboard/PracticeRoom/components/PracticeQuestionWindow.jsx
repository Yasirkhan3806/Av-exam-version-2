"use client";

import usePracticeStore from "../../../../store/usePracticeStore";

export default function PracticeQuestionWindow() {
  const { questionsObj, currentQuestion } = usePracticeStore();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <iframe
        src={questionsObj[`q${currentQuestion}`]}
        className="w-full h-full border"
        title="PDF Viewer"
        style={{ minHeight: "80vh", width: "100%" }}
      ></iframe>
    </div>
  );
}

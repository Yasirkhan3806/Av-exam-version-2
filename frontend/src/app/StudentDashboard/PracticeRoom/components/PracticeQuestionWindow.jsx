"use client";

import usePracticeStore from "../../../../store/usePracticeStore";

export default function PracticeQuestionWindow() {
  const { questionsObj, currentQuestion } = usePracticeStore();

  const pdfUrl = questionsObj?.[`q${currentQuestion}`];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          className="w-full h-full border"
          title="PDF Viewer"
          style={{ minHeight: "80vh", width: "100%" }}
        ></iframe>
      ) : (
        <div className="w-full h-full p-4 flex flex-col gap-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg w-full shadow-sm opacity-70"></div>
          <div className="flex-1 bg-gray-200 rounded-lg w-full shadow-sm opacity-50 flex items-center justify-center">
            <span className="text-gray-500">Fetching document...</span>
          </div>
        </div>
      )}
    </div>
  );
}

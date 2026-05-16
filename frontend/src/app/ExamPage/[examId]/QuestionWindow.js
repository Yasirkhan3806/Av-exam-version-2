"use client";

import { use, useEffect, useRef } from "react";
import useExamStore from "../../../store/useExamStore";
import useSubjectStore from "../../../store/useSubjectStore";

export default function QuestionPanel({ examId }) {
  const {
    fetchExam,
    questionName,
    currentQuestion,
    questionsObj,
    totalQuestions,
    loading,
    error,
    BASEURL,
  } = useExamStore();
  const { currentSubjectType } = useSubjectStore();

  useEffect(() => {
    if (examId) {
      fetchExam(examId, currentSubjectType);
    }
  }, [examId, fetchExam, currentSubjectType]);

  if (loading) {
    return (
      <div className="w-full h-full p-4 flex flex-col gap-4 animate-pulse">
        {/* PDF Toolbar Skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg w-full shadow-sm opacity-70"></div>
        {/* PDF Content Skeleton */}
        <div className="flex-1 bg-gray-200 rounded-lg w-full shadow-sm opacity-50"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      {/* PDF Viewer */}
      <div className="w-full h-full flex flex-col items-center justify-center">
        <iframe
          src={`${BASEURL}/${questionsObj[`q${currentQuestion}`]}`}
          className="w-full h-full border"
          title="PDF Viewer"
          style={{ minHeight: "80vh", width: "100%" }}
        ></iframe>
      </div>
    </>
  );
}

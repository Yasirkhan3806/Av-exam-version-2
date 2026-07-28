"use client";

import { useEffect, useRef, useCallback } from "react";
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
    setTransitioning,
    isTransitioning,
  } = useExamStore();
  const { currentSubjectType } = useSubjectStore();

  const safetyTimeoutRef = useRef(null);

  useEffect(() => {
    if (examId) {
      fetchExam(examId, currentSubjectType);
    }
  }, [examId, fetchExam, currentSubjectType]);

  // Safety timeout: if iframe never fires onLoad within 30s, resume the timer anyway
  useEffect(() => {
    if (isTransitioning) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = setTimeout(() => {
        const { isTransitioning } = useExamStore.getState();
        if (isTransitioning) {
          setTransitioning(false);
        }
      }, 30000);
    }

    return () => clearTimeout(safetyTimeoutRef.current);
  }, [isTransitioning, setTransitioning]);

  // Called when the iframe finishes loading the new question PDF
  const handleIframeLoad = useCallback(() => {
    clearTimeout(safetyTimeoutRef.current);
    const { isTransitioning } = useExamStore.getState();
    if (isTransitioning) {
      setTransitioning(false);
    }
  }, [setTransitioning]);

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
          onLoad={handleIframeLoad}
        ></iframe>
      </div>
    </>
  );
}

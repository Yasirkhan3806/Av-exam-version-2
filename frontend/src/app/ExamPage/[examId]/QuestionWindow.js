"use client";

import { use, useEffect, useRef } from "react";
import useExamStore from "../../../store/useExamStore";

export default function QuestionPanel({ examId }) {
  const { fetchExam, questionName, currentQuestion, questionsObj, totalQuestions, loading, error,BASEURL } = useExamStore();
  useEffect(() => {
    if (examId) {
      fetchExam(examId);
    }
  }, [examId, fetchExam]);

  if (loading) {
    return <div>Loading...</div>;
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
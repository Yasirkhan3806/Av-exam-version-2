"use client";

import { useEffect, useState, use } from "react";
import QuestionPanel from "./components/QuestionPanel";
import AnswerPanel from "./components/AnswerPanel";
import useExamStore from "../../../store/useExamStore";

export default function CafExamPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { CafExamId } = params;
  const { fetchExam, questionsObj, BASEURL, loading, error } = useExamStore();
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (CafExamId) {
      fetchExam(CafExamId);
    }
  }, [CafExamId, fetchExam]);

  useEffect(() => {
    // For CAF exams, we assume the first question PDF is the main exam paper
    if (questionsObj && Object.keys(questionsObj).length > 0) {
      const firstQKey = Object.keys(questionsObj)[0];
      setPdfUrl(`${BASEURL}/${questionsObj[firstQKey]}`);
    }
  }, [questionsObj, BASEURL]);

  const handleSubmit = async (file) => {
    console.log("Submitting file:", file);
    // TODO: Implement actual upload logic
    alert(
      `File "${file.name}" ready for upload! Implementation pending based on backend API.`
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-red-500 bg-red-50 p-6 rounded-lg shadow-sm border border-red-100">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 border-r border-gray-200">
        <QuestionPanel pdfUrl={pdfUrl} />
      </div>
      <div className="w-full md:w-1/3 min-w-[350px] bg-white">
        <AnswerPanel onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

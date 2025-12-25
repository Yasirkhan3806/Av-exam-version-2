"use client";

import { useEffect, useState, use } from "react";
import QuestionPanel from "./components/QuestionPanel";
import AnswerPanel from "./components/AnswerPanel";
import useExamStore from "../../../store/useExamStore";
import useSubjectStore from "../../../store/useSubjectStore";

export default function CafExamPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { CafExamId } = params;
  const { fetchExam, BASEURL, submitCafAnswer, saving } = useExamStore();
  const currentSubjectType = useSubjectStore(
    (state) => state.currentSubjectType
  );
  const [pdfUrl, setPdfUrl] = useState("");
  const [examData, setExamData] = useState({});

  console.log(currentSubjectType);

  useEffect(() => {
    const getExamData = async () => {
      if (CafExamId && currentSubjectType) {
        const response = await fetchExam(CafExamId, currentSubjectType);
        console.log(response);
        setExamData(response);
      }
    };

    getExamData();
  }, [CafExamId, fetchExam, currentSubjectType]);

  useEffect(() => {
    // For CAF exams, we assume the first question PDF is the main exam paper
    if (examData?.pdfPath) {
      setPdfUrl(`${BASEURL}/${examData.pdfPath}`);
    }
  }, [examData, BASEURL]);

  const handleSubmit = async (file) => {
    try {
      const result = await submitCafAnswer(CafExamId, file);
      alert("Exam submitted successfully!");
      windows.location.href = "/StudentDashboard/MySubjects";
    } catch (error) {
      alert(`Submission failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 border-r border-gray-200">
        <QuestionPanel pdfUrl={pdfUrl} />
      </div>
      <div className="w-full md:w-1/3 min-w-[350px] bg-white">
        <AnswerPanel onSubmit={handleSubmit} isLoading={saving} />
      </div>
    </div>
  );
}

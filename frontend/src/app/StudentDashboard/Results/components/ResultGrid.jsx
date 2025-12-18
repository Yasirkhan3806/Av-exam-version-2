"use client";

import React, { useEffect, useState } from "react";
import ResultCard from "./ResultCard";
import useSubjectStore from "../../../../store/useSubjectStore";
// import ExamInstructionsPopup from '../../../../components/BeforeExamPopUp'

const ResultGrid = () => {
  const { fetchStudentResults, studentResults, loading, error } =
    useSubjectStore();
  const [selectedExam, setSelectedExam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    fetchStudentResults();
  }, [fetchStudentResults]);
  console.log("Student Results:", studentResults);

  const handleExamClick = (examId, exam) => {
    setSelectedExam(exam);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedExam(null);
  };

  const handleStartExam = (examId) => {
    // Close popup and navigate to exam page
    setIsPopupOpen(false);
    window.location.href = `/ExamPage/${examId}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Tests</h1>

        {loading && (
          <p className="text-gray-600 mb-4 animate-pulse">Loading exams...</p>
        )}
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {!loading && !studentResults.length && (
          <p className="text-gray-600">No exams available for this subject.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studentResults?.map((result) => (
            <ResultCard
              key={result._id || result.id}
              result={result}
              onReviewResults={handleExamClick}
            />
          ))}
        </div>
      </div>
      {/* {isPopupOpen && selectedExam && (
                <ExamInstructionsPopup
                    exam={selectedExam}
                    onClose={handleClosePopup}
                    onStartExam={handleStartExam}
                />
            )} */}
    </div>
  );
};

export default ResultGrid;

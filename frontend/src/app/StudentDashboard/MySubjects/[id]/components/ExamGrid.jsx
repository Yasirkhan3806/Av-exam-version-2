"use client";

import React, { use, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import ExamCard from "./ExamCard";
import useSubjectStore from "../../../../../store/useSubjectStore";
import ExamInstructionsPopup from "../components/BeforeExamPopUp";
import PRCResultModal from "./PRCResultModal";

const ExamGrid = ({ subjectId, subjectType }) => {
  const {
    fetchExamsForSubject,
    examsBySubject,
    loading,
    error,
    setCurrentSubject,
    setCurrentSubjectType,
    currentSubjectType,
  } = useSubjectStore();
  const [selectedExam, setSelectedExam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mockExams, setMockExams] = useState([]);
  const [regularExams, setRegularExams] = useState([]);
  const [showPRCResult, setShowPRCResult] = useState(false);
  const [selectedPRCExamId, setSelectedPRCExamId] = useState(null);

  useEffect(() => {
    setCurrentSubject(subjectId);
    setCurrentSubjectType(subjectType);
  }, [subjectId, subjectType]);

  const handleExamClick = (examId, exam) => {
    setSelectedExam(exam);
    if (currentSubjectType === "CAF") {
      window.location.href = `/CAFExamPage/${examId}`;
    } else if (currentSubjectType === "PRC") {
      window.location.href = `/PRCExamPage/${examId}`;
    } else {
      setIsPopupOpen(true);
    }
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

  const handlePrcResult = (examId) => {
    setSelectedPRCExamId(examId);
    setShowPRCResult(true);
  };

  const handleClosePRCResult = () => {
    setShowPRCResult(false);
    setSelectedPRCExamId(null);
  };

  // Get cached exams or default to an empty array
  const exams = examsBySubject?.[subjectId] || [];

  useEffect(() => {
    // Filter mock exams for the current subject
    const mockedExams = exams.filter((exam) => exam.mockExam == true);
    setMockExams(mockedExams);
    const regularExams = exams.filter((exam) => exam.mockExam != true);
    setRegularExams(regularExams);
  }, [exams]);

  // Fetch exams for this subject if not cached (passing subjectType properly)
  useEffect(() => {
    if (!subjectId) return;
    if (!examsBySubject?.[subjectId]) {
      fetchExamsForSubject(subjectId, subjectType);
    }
  }, [subjectId, subjectType, examsBySubject, fetchExamsForSubject]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Tests</h1>
          <button
            onClick={() => fetchExamsForSubject(subjectId, subjectType, true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Refresh exams list"
          >
            <RefreshCw className={`w-4.5 h-4.5 text-gray-500 group-hover:text-gray-700 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <p className="text-gray-600 mb-4 animate-pulse">Loading exams...</p>
        )}
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {!loading && !exams.length && (
          <p className="text-gray-600">No exams available for this subject.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularExams.map((test) => (
            <ExamCard
              key={test._id || test.id}
              test={test}
              handleExamClick={handleExamClick}
              subjectType={subjectType}
              onReviewResults={handlePrcResult}
            />
          ))}
        </div>
        <br />

        <br />

        <h1 className="text-2xl text-black font-bold">Mock Exams</h1>
        <br />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockExams.map((test) => (
            <ExamCard
              key={test._id || test.id}
              test={test}
              handleExamClick={handleExamClick}
              subjectType={subjectType}
              onReviewResults={handlePrcResult}
            />
          ))}
        </div>
      </div>
      {isPopupOpen && selectedExam && (
        <ExamInstructionsPopup
          exam={selectedExam}
          onClose={handleClosePopup}
          onStartExam={handleStartExam}
        />
      )}

      {showPRCResult && selectedPRCExamId && (
        <PRCResultModal examId={selectedPRCExamId} onClose={handleClosePRCResult} />
      )}
    </div>
  );
};

export default ExamGrid;

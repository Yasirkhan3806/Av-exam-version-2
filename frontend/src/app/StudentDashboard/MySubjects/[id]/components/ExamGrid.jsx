"use client";

import React, { use, useEffect, useState } from "react";
import ExamCard from "./ExamCard";
import useSubjectStore from "../../../../../store/useSubjectStore";
import ExamInstructionsPopup from "../components/BeforeExamPopUp";

const ExamGrid = ({ subjectId, subjectType }) => {
  const {
    fetchExamsForSubject,
    examsBySubject,
    loading,
    error,
    setCurrentSubject,
    setCurrentSubjectType,
    currentSubjectType
  } = useSubjectStore();
  const [selectedExam, setSelectedExam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mockExams, setMockExams] = useState([]);
  const [regularExams, setRegularExams] = useState([]);

  useEffect(() => {
    setCurrentSubject(subjectId);
    setCurrentSubjectType(subjectType);
  }, [subjectId, subjectType]);

  const handleExamClick = (examId, exam) => {
    setSelectedExam(exam);
    if(currentSubjectType === 'CAF'){
      window.location.href = `/CAFExamPage/${examId}`;
    }else if(currentSubjectType === 'PRC'){
      window.location.href = `/PRCExamPage/${examId}`;
    }
    else{
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

  // Get cached exams or default to an empty array
  const exams = examsBySubject?.[subjectId] || [];

  useEffect(() => {
    // Filter mock exams for the current subject
    const mockedExams = exams.filter((exam) => exam.mockExam == true);
    setMockExams(mockedExams);
    const regularExams = exams.filter((exam) => exam.mockExam != true);
    setRegularExams(regularExams);
  }, [exams]);

  // Fetch exams for this subject if not cached
  useEffect(() => {
    if (!subjectId) return;
    if (!examsBySubject?.[subjectId]) {
      fetchExamsForSubject(subjectId);
    }
  }, [subjectId, examsBySubject, fetchExamsForSubject]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Tests</h1>

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
              onReviewResults={handleExamClick}
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
    </div>
  );
};

export default ExamGrid;

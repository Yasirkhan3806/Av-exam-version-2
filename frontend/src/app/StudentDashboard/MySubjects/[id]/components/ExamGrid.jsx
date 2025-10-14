'use client';

import React, { useEffect,useState } from 'react';
import ExamCard from './ExamCard';
import useSubjectStore from '../../../components/StatesManagement';
import ExamInstructionsPopup from './BeforeExamPopUp'

const ExamGrid = ({ subjectId }) => {
  const { fetchExamsForSubject, examsBySubject, loading, error } = useSubjectStore();
      const [selectedExam, setSelectedExam] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);


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

  // Get cached exams or default to an empty array
  const exams = examsBySubject?.[subjectId] || [];

  // Fetch exams for this subject if not cached
  useEffect(() => {
    if (!subjectId) return;
    if (!examsBySubject?.[subjectId]) {
      fetchExamsForSubject(subjectId);
    }
  }, [subjectId, examsBySubject, fetchExamsForSubject]);

  const handleReviewResults = (testId) => {
    console.log(`Reviewing results for test ID: ${testId}`);
    // Add logic here to navigate to a results page or open a modal
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Tests</h1>

        {loading && (
          <p className="text-gray-600 mb-4 animate-pulse">Loading exams...</p>
        )}
        {error && (
          <p className="text-red-600 mb-4">Error: {error}</p>
        )}
        {!loading && !exams.length && (
          <p className="text-gray-600">No exams available for this subject.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((test) => (
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

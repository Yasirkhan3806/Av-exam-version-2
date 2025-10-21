"use client";
import React, { use, useEffect, useState } from 'react';
import QuestionPanel from '../../components/QuestionWindow';
import AnswerPanel from '../../components/AnswerWindow';
import GradingPanel from '../../components/GradingPanel';
import useInstructorStore from '../../components/StateManagement';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Main App Component
export default function ReviewAnswer() {
  const params = useParams();
  const studentId = params.studentId;
  const [currentMarks, setCurrentMarks] = useState(0);
  const [showAnswer, setShowAnswer] = useState(true);

  const { fetchExamById, fetchAnswersByQuestionId, examQuestions, studentAnswers, currentQuestion, nextQuestion, prevQuestion, setMarks, marks, finishExamReview } = useInstructorStore((state) => state);

  useEffect(() => {
    fetchExamById();
    fetchAnswersByQuestionId(studentId);
  }, [studentId, fetchExamById, fetchAnswersByQuestionId]);


  useEffect(() => {
    if (!studentAnswers[`q${currentQuestion}`]) {
      setShowAnswer(false)
    } else {
      setShowAnswer(true)
    }
  }, [currentQuestion, studentAnswers])

  const currentAnswer = studentAnswers[`q${currentQuestion}`];


  const handleMarksChange = (marks) => {
    setCurrentMarks(marks);

  };

  const handleSave = () => {
    setMarks(currentQuestion, currentMarks);
    if (currentQuestion < Object.keys(examQuestions).length) {
      nextQuestion();
    }
  };

  const handleSkip = () => {
    if (currentQuestion < Object.keys(examQuestions).length) {
      nextQuestion();
    }
  };

  const finishReview = async () => {
    const done = await finishExamReview();
    if (done) {
      window.location.href = '/Instructor';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <button 
        onClick={finishReview}
        className='bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium shadow-sm'>
          Done
        </button>
          {/* Question and Answer Panels - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[100vh]">
          <QuestionPanel
            currentQuestionPath={examQuestions[`q${currentQuestion}`]}
            currentQuestionIndex={currentQuestion}
            totalQuestions={Object.keys(examQuestions).length}
            nextQuestion={nextQuestion}
            prevQuestion={prevQuestion}
          />
          <AnswerPanel
            answer={currentAnswer}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer(!showAnswer)}
          />
        </div>

        {/* Grading Panel - Full Width */}
        <GradingPanel
          currentMarks={marks[`q${currentQuestion}`]?.marks || 0}
          onMarksChange={handleMarksChange}
          onSave={handleSave}
          onSkip={handleSkip}
        />
      </main>
    </div>
  );
}
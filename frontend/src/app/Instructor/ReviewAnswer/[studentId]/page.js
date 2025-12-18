"use client";
import React, { use, useEffect, useState } from 'react';
import QuestionPanel from '../../components/QuestionWindow';
import AnswerPanel from '../../components/AnswerWindow';
import GradingPanel from '../../components/GradingPanel';
import useInstructorStore from '../../../../store/useInstructorStore';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * ReviewAnswer component allows instructors to review and grade student answers.
 * It displays questions, student answers, and provides a grading interface.
 */
export default function ReviewAnswer() {
  // Get studentId from the URL parameters
  const params = useParams();
  const studentId = params.studentId;

  // Local state for managing grading process
  const [currentMarks, setCurrentMarks] = useState(0); // Marks currently being entered by the instructor
  const [showAnswer, setShowAnswer] = useState(true); // Toggles visibility of the student's answer PDF
  const [currentCheckedPdf, setCurrentCheckedPdf] = useState(null); // Stores the PDF uploaded by the instructor (e.g., for marking)
  const [currentPdf, setCurrentPdf] = useState(null); // Stores the currently displayed checked PDF from the store

  // Access state and actions from the Zustand store for instructor data
  const {
    fetchExamById,
    fetchAnswersByQuestionId,
    examQuestions,
    studentAnswers,
    currentQuestion,
    nextQuestion,
    prevQuestion,
    setMarks,
    marks,
    finishExamReview,
    setCheckedPdf,
    checkedPdfs
  } = useInstructorStore((state) => state);

  /**
   * Effect to fetch exam details and student answers when the component mounts
   * or studentId changes.
   */
  useEffect(() => {
    fetchExamById();
    fetchAnswersByQuestionId(studentId);
  }, [studentId, fetchExamById, fetchAnswersByQuestionId]);

  /**
   * Effect to control the visibility of the answer panel based on whether
   * marks have already been obtained for the current question.
   */
  useEffect(() => {
    if (!studentAnswers?.marksObtained?.[`q${currentQuestion}`]) {
      setShowAnswer(false);
    } else {
      setShowAnswer(true);
    }
  }, [currentQuestion, studentAnswers]);

  /**
   * Effect to update the currently displayed checked PDF when the `checkedPdfs`
   * in the store or `currentQuestion` changes.
   */
  useEffect(() => {
    console.log("Checked PDF changed:", checkedPdfs[`q${currentQuestion}`]);
    setCurrentPdf(checkedPdfs[`q${currentQuestion}`] || null);
  }, [checkedPdfs, currentQuestion]);

  // Derive the URL of the current student's answer PDF
  const currentAnswer = studentAnswers?.marksObtained?.[`q${currentQuestion}`]?.pdfUrl || "";

  /**
   * Handler for when the instructor changes the marks in the grading panel.
   * @param {number} marks - The new marks value.
   */
  const handleMarksChange = (marks) => {
    setCurrentMarks(marks);
  };

  /**
   * Handler for saving the current question's marks and uploaded checked PDF.
   * Then moves to the next question if available.
   */
  const handleSave = () => {
    setCheckedPdf(currentQuestion, currentCheckedPdf); // Save the uploaded checked PDF to the store
    setMarks(currentQuestion, currentMarks); // Save the marks to the store
    // Move to the next question if not the last one
    if (currentQuestion < Object.keys(examQuestions).length) {
      nextQuestion();
    }
  };

  /**
   * Handler for when an instructor uploads a PDF (e.g., a marked script).
   * @param {File} pdfFile - The uploaded PDF file.
   */
  const handlePdfUpload = (pdfFile) => {
    setCurrentCheckedPdf(pdfFile);
  };

  /**
   * Handler for finishing the entire exam review process.
   * Redirects to the instructor dashboard upon completion.
   */
  const finishReview = async () => {
    const done = await finishExamReview();
    if (done) {
      window.location.href = '/Instructor'; // Redirect to the instructor dashboard
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Button to finalize the review process */}
        <button
          onClick={finishReview}
          className='bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium shadow-sm'>
          Done
        </button>

        {/* Question and Answer Panels - Displayed side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[100vh]">
          <QuestionPanel
            currentQuestionPath={examQuestions?.[`q${currentQuestion}`]}
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

        {/* Grading Panel - Full Width, positioned below question/answer panels */}
        <GradingPanel
          currentMarks={marks?.[`q${currentQuestion}`]?.marks || 0} // Display marks from the store
          onMarksChange={handleMarksChange}
          onSave={handleSave}
          onPdfUpload={handlePdfUpload}
          currentPdf={currentPdf} // PDF previously uploaded by instructor for this question
        />
      </main>
    </div>
  );
}
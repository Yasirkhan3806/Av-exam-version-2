import { useState } from 'react';
import { FileText, FileCheck, Award, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

// Question Panel Component
const QuestionPanel = ({ currentQuestionPath, currentQuestionIndex, totalQuestions, prevQuestion,nextQuestion }) => {
const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Question</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Question {currentQuestionIndex} of {totalQuestions}</span>
            <button
              onClick={() => prevQuestion()}
              disabled={currentQuestionIndex === 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextQuestion()}
              disabled={currentQuestionIndex === totalQuestions}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <iframe src={`${BaseUrl}/${currentQuestionPath}`} className="w-full h-full" />

    </div>
  );
};

export default QuestionPanel;



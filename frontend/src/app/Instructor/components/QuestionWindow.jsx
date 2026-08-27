import { useState } from 'react';
import { FileText, FileCheck, Award, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { BASEURL as BaseUrl } from "@/utils/config";

// Question Panel Component
const QuestionPanel = ({ currentQuestionPath, currentQuestionIndex, totalQuestions, prevQuestion,nextQuestion }) => {

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

      {currentQuestionPath ? (
        <iframe src={`${BaseUrl}/${currentQuestionPath}`} className="w-full h-full" title="PDF Viewer" />
      ) : (
        <div className="w-full h-full p-4 flex flex-col gap-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg w-full shadow-sm opacity-70"></div>
          <div className="flex-1 bg-gray-200 rounded-lg w-full shadow-sm opacity-50 flex items-center justify-center">
            <span className="text-gray-500">Fetching document...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionPanel;



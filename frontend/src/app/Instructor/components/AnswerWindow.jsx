import React from 'react';
import { FileCheck, Eye, EyeOff } from 'lucide-react';
// Mock data for student answer



const AnswerPanel = ({ answer, showAnswer, onToggleAnswer }) => {
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Student Answer</h2>
            {/* <p className="text-gray-600 mt-1">
              {answer.studentName} • {answer.studentId}
            </p> */}
          </div>
          {/* <button 
            onClick={onToggleAnswer}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswer ? 'Hide' : 'Show'} Answer
          </button> */}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {showAnswer ? (
          <div 
            className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-6 min-h-64"
            dangerouslySetInnerHTML={{ __html: answer }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No Answer For This Question</p>
              <p className="text-gray-400 text-sm mt-2">Proceed to New Question</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerPanel;
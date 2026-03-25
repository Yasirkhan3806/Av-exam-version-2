'use client';
import { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

/**
 * AnswerPanel Component
 * 
 * Displays a student's answer for a single question, including:
 * - Question title and marks obtained with color-coded indicators
 * - The checked answer PDF in an iframe
 * - An optional tab to view the suggested solution PDF if one was attached
 * 
 * @param {string} question - The question title/text
 * @param {string} studentAnswer - The raw student answer data
 * @param {number} marksObtained - Marks the student obtained
 * @param {number} totalMarks - Total possible marks for this question
 * @param {string} pdfUrl - Path to the checked answer PDF
 * @param {string} suggestedSolutionUrl - Path to the suggested solution PDF (optional)
 */
const AnswerPanel = ({ question, studentAnswer, marksObtained, totalMarks, pdfUrl, suggestedSolutionUrl }) => {
  const BaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const [activeTab, setActiveTab] = useState('answer'); // 'answer' or 'solution'

  const getMarksColor = () => {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = () => {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (percentage >= 40) return <HelpCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const hasSuggestedSolution = suggestedSolutionUrl && suggestedSolutionUrl.trim() !== '';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{question}</h3>
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className={`text-sm font-semibold ${getMarksColor()}`}>
              {marksObtained}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Tab Header — only shown when suggested solution is available */}
        {hasSuggestedSolution ? (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('answer')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'answer'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Your Answer
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'solution'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 Suggested Solution
            </button>
          </div>
        ) : (
          <h4 className="text-sm font-semibold text-gray-700">Your Answer:</h4>
        )}

        {/* PDF Viewer */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 h-[80vh]">
          {activeTab === 'answer' ? (
            <iframe src={`${BaseUrl}/${pdfUrl}`} className='h-full w-full'></iframe>
          ) : (
            <iframe src={`${BaseUrl}/${suggestedSolutionUrl}`} className='h-full w-full'></iframe>
          )}
        </div>
      </div>
    </div>
  );
};
export default AnswerPanel;
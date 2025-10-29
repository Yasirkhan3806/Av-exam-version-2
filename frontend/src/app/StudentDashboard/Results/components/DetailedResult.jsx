'use client';

import { useState } from 'react';
import {  HelpCircle } from 'lucide-react';
import AnswerPanel from '../components/AnswerPanel';



const DetailedResult = ({ result }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
console.log('DetailedResult received result:', result);

  const toggleExpand = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Detailed Result
        </h1>
        <p className="text-gray-600">
          Review your answers and performance for {result.questionSet.name}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {result.questionSet.name}
            </h2>
            <p className="text-gray-600">
              {result.questionSet.totalQuestions} questions • {result.questionSet.totalMarks} total marks
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(result.marksObtained).reduce((sum, mark) => sum + Number(mark.marks), 0)} / {result.questionSet.totalMarks}
            </div>
            <div className="text-sm text-gray-600">
              {Math.round((Object.values(result.marksObtained).reduce((sum, mark) => sum + Number(mark.marks), 0) / result.questionSet.totalMarks) * 100)}% Score
            </div>
          </div>
        </div>
      </div>

      {/* Answer Panels */}
      <div className="space-y-4">
        {Object.entries(result.answers).map(([questionId, answerData]) => {
          const marksData = result.marksObtained[questionId] || { marks: 0 };
          const questionText = result.questionSet.questions?.find(q => q.id === questionId)?.text || `Question ${questionId[1]}`;
          
          return (
            <AnswerPanel
              key={questionId}
              question={questionText}
              studentAnswer={answerData}
              pdfUrl={marksData.pdfUrl || ""}
              marksObtained={Number(marksData.marks)}
              totalMarks={result.questionSet.questions?.find(q => q.id === questionId)?.marks || 1}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(result.answers).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <HelpCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No answers to display</h3>
          <p className="text-gray-600">It looks like you haven't attempted any questions yet.</p>
        </div>
      )}
    </div>
  );
};

export default DetailedResult;

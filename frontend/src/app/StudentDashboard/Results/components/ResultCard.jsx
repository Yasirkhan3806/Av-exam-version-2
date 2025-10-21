
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Play, Clock, BookOpen, BarChart } from 'lucide-react';

const scoreCalculation = (marksObtained) => {
  let totalMarks = 0;
  for (const mark of Object.keys(marksObtained)) {
    totalMarks += Number(marksObtained[mark].marks);
  }
  return totalMarks;
};

const ResultCard = ({ result, onReviewResults }) => {
  const [scorePercentage, setScorePercentage] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const calculatedScore = scoreCalculation(result.marksObtained);
    const percentage = (calculatedScore / result.questionSet.totalMarks) * 100;
    setScorePercentage(Math.round(percentage));
    setScore(calculatedScore);
  }, [result.marksObtained]);

  const getProgressClass = () => {
    if (scorePercentage >= 80) return 'bg-green-500 text-white';
    if (scorePercentage >= 60) return 'bg-blue-500 text-white';
    if (scorePercentage >= 40) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="border border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:shadow-green-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-gray-900">{result.questionSet.name}</h2>
          <h3 className="text-base font-semibold text-gray-800">{result?.questionSet?.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-600" />
              {result?.questionSet?.totalAttempt} min
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-green-600" />
              {result?.questionSet?.totalQuestions} questions
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-green-600" />
              {result?.questionSet?.totalMarks} marks
            </span>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getProgressClass()} shadow-sm`}>
          {scorePercentage}%
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Performance Summary</h4>
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-gray-900">
            {score} / {result.questionSet.totalMarks}
          </p>
          <div className="w-px h-6 bg-gray-200"></div>
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{Object.keys(result.answers).length}</span> question(s) attempted
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          {result?.status?.toUpperCase()}
        </span>
        <button
          onClick={() => onReviewResults(result.id, result)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-white text-green-700 border border-green-300 hover:bg-green-50 hover:border-green-400 hover:shadow-sm active:scale-95 cursor-pointer"
        >
          Show Details
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Play, Clock, BookOpen, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
    <div className="border border-green-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:shadow-green-100">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex-1">{result.questionSet.name}</h2>
            <span className={`px-2.5 py-1 sm:hidden rounded-full text-xs font-bold ${getProgressClass()} shadow-sm whitespace-nowrap flex-shrink-0`}>
              {scorePercentage}%
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">{result?.questionSet?.title}</h3>
          <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
              {result?.questionSet?.totalAttempt} min
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
              {result?.questionSet?.totalQuestions} questions
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
              {result?.questionSet?.totalMarks} marks
            </span>
          </div>
        </div>
        <span className={`hidden sm:block px-3 py-1.5 rounded-full text-sm font-bold ${getProgressClass()} shadow-sm whitespace-nowrap`}>
          {scorePercentage}%
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Performance Summary</h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <p className="text-base sm:text-lg font-bold text-gray-900">
            {score} / {result.questionSet.totalMarks}
          </p>
          <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
          <div className="sm:hidden w-full h-px bg-gray-200"></div>
          <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <span className="font-semibold text-gray-800">{Object.keys(result.answers).length}</span> question(s) attempted
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-100 gap-3 sm:gap-0">
        <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1.5 justify-center sm:justify-start">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          {result?.status?.toUpperCase()}
        </span>
        <button
          onClick={() => router.push(`Results/${result?.questionSet?._id}`)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all bg-white text-green-700 border border-green-300 hover:bg-green-50 hover:border-green-400 hover:shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Show Details
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
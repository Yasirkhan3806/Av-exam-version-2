"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Play, Clock, BookOpen, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";

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
    const calculatedScore = scoreCalculation(result?.marksObtained || {});
    const percentage =
      (calculatedScore / result?.questionSet?.totalMarks) * 100;
    setScorePercentage(Math.round(percentage));
    setScore(calculatedScore);
  }, [result?.marksObtained]);

  const getProgressStyles = () => {
    if (scorePercentage >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-emerald-200";
    if (scorePercentage >= 60) return "bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow-blue-200";
    if (scorePercentage >= 40) return "bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-amber-200";
    return "bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-rose-200";
  };

  return (
    <div className="relative overflow-hidden border border-slate-200/60 rounded-2xl p-5 sm:p-7 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 group">
      {/* Decorative top-right abstract shape */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight flex-1">
              {result?.questionSet?.name}
            </h2>
            <span
              className={`px-3 py-1 sm:hidden rounded-full text-xs font-bold shadow-md whitespace-nowrap flex-shrink-0 ${getProgressStyles()}`}
            >
              {scorePercentage}%
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-medium text-slate-500 mb-3">
            {result?.questionSet?.title || "Assessment"}
          </h3>
          <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
              {result?.questionSet?.totalAttempt} min
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
              {result?.questionSet?.totalQuestions} Questions
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <BarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
              {result?.questionSet?.totalMarks} Marks
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end justify-start">
          <span
            className={`px-3.5 py-1.5 rounded-full text-sm font-bold shadow-md whitespace-nowrap ${getProgressStyles()}`}
          >
            {scorePercentage}%
          </span>
        </div>
      </div>

      <div className="relative z-10 mb-5 pb-5 border-b border-slate-100">
        <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Performance Summary
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
          <p className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            {result?.subjectType === "CAF" ? result?.marksObtained : score}
            <span className="text-sm sm:text-base font-medium text-slate-400 ml-1">
              / {result.questionSet.totalMarks}
            </span>
          </p>
          <div className="hidden sm:block w-[4px] h-[4px] rounded-full bg-slate-200"></div>
          <span className="text-xs sm:text-sm font-medium text-slate-500">
            <span className="font-bold text-slate-700">
              {result?.subjectType === "CAF"
                ? result?.questionSet?.totalQuestions
                : result?.answers ? Object.keys(result.answers).length : 0}
            </span>{" "}
            question{result?.answers && Object.keys(result.answers).length !== 1 ? 's' : ''} attempted
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <span className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5 justify-center sm:justify-start bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100/50">
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          {result?.status?.toUpperCase()}
        </span>
        <button
          onClick={() => {
            if (result?.subjectType === "CAF") {
              router.push(`Results/Caf/${result?.questionSet?._id}`);
            } else {
              router.push(`Results/${result?.questionSet?._id}`);
            }
          }}
          className="group/btn flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all bg-emerald-600 text-white shadow-[0_4px_14px_0_rgb(5,150,105,0.39)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.23)] hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Show Details
          <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ResultCard;

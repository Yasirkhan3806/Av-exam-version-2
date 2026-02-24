"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Book } from "lucide-react";
import ResultCard from "./ResultCard";
import useSubjectStore from "../../../../store/useSubjectStore";

const ResultGrid = () => {
  const { fetchStudentResults, studentResults, loading, error, subjects, fetchSubjects } =
    useSubjectStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    fetchStudentResults();
    if (!subjects || subjects.length === 0) {
      fetchSubjects();
    }
  }, [fetchStudentResults, fetchSubjects, subjects?.length]);

  const handleExamClick = (examId, exam) => {
    setSelectedExam(exam);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedExam(null);
  };

  const handleStartExam = (examId) => {
    setIsPopupOpen(false);
    window.location.href = `/ExamPage/${examId}`;
  };

  // Group exams by subject
  const groupedResults = useMemo(() => {
    if (!studentResults) return {};
    return studentResults.reduce((acc, result) => {
      const subjectIdStr = result.questionSet?.subject?.toString();
      const subjectId = subjectIdStr || "unknown";

      if (!acc[subjectId]) {
        // Find the subject from the store subjects array
        const matchedSubject = subjects?.find(s => s._id === subjectId || s.id === subjectId);
        acc[subjectId] = {
          id: subjectId,
          name: matchedSubject?.name || "Unknown Subject",
          results: [],
        };
      }
      acc[subjectId].results.push(result);
      return acc;
    }, {});
  }, [studentResults, subjects]);

  const subjectsWithResults = Object.values(groupedResults);
  const selectedSubject = selectedSubjectId ? groupedResults[selectedSubjectId] : null;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-4">
            {selectedSubjectId ? (
              <>
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-all duration-300 flex items-center justify-center text-slate-500 hover:text-emerald-600 border border-slate-200/60 hover:border-emerald-200 group"
                  title="Back to Subjects"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {selectedSubject?.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-1">Detailed Assessment Results</p>
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  Your Learning Journey
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Select a subject to view your specific exam results</p>
              </div>
            )}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Loading amazing results...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 font-medium shadow-sm flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error: {error}
          </div>
        )}

        {!loading && studentResults?.length === 0 && (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Book className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Results Found</h3>
            <p className="text-slate-500">You haven't completed any assessments yet.</p>
          </div>
        )}

        {/* View Selection */}
        {!loading && studentResults?.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!selectedSubjectId ? (
              // 1) Subject Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectsWithResults.map((subjectGroup) => (
                  <div
                    key={subjectGroup.id}
                    onClick={() => setSelectedSubjectId(subjectGroup.id)}
                    className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/60 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(5,150,105,0.08)] hover:-translate-y-1 hover:border-emerald-200/60 cursor-pointer flex flex-col items-center justify-center gap-4 text-center"
                  >
                    {/* Decorative abstract corner fade */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Book className="w-7 h-7" />
                    </div>

                    <div className="relative z-10 space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight transition-colors group-hover:text-emerald-700">
                        {subjectGroup.name}
                      </h3>
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                        <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-600 transition-colors">
                          {subjectGroup.results.length} Assessment{subjectGroup.results.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 2) Exam Results Grid for the selected subject
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {selectedSubject?.results.map((result) => (
                  <ResultCard
                    key={result._id || result.id}
                    result={result}
                    onReviewResults={handleExamClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* {isPopupOpen && selectedExam && (
                <ExamInstructionsPopup
                    exam={selectedExam}
                    onClose={handleClosePopup}
                    onStartExam={handleStartExam}
                />
            )} */}
    </div>
  );
};

export default ResultGrid;

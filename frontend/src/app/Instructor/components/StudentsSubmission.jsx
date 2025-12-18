"use client";
import React, { useEffect } from "react";
import useInstructorStore from "../../../store/useInstructorStore";
import StudentSubmissionsCard from "./StudentSubmissionsCard";

const StudentSubmissions = ({ questionId, examInfo }) => {
  const { fetchSubmissions, submissions } = useInstructorStore(
    (state) => state
  );

  useEffect(() => {
    fetchSubmissions(questionId);
  }, [fetchSubmissions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Exams
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Student Submissions
              </h1>
              <p className="text-sm text-gray-500">{examInfo?.title}</p>
            </div>
          </div>
          {/* <div className="flex space-x-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">3 submitted</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">1 in progress</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">1 not started</span>
          </div> */}
        </div>
      </header>

      {/* Exam Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>{examInfo?.subject}</span>
          <span>•</span>
          <span>{examInfo?.date}</span>
          <span>•</span>
          <span>{examInfo?.duration}</span>
          <span>•</span>
          <span>{examInfo?.questions}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Student List</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a student submission to review their answers
          </p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((student) => (
            <StudentSubmissionsCard key={student.id} student={student} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentSubmissions;

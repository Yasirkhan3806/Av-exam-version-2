"use client";

import React from "react";
import { useEffect } from "react";
import useInstructorStore from "../../../store/useInstructorStore";
import InstructorExamCard from "./InstructorExamCard";

const InstructorExamGrid = ({ subjectId }) => {
  const { fetchExams, exams } = useInstructorStore((state) => state);

  useEffect(() => {
    fetchExams(subjectId);
  }, [fetchExams]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Examinations</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select an exam to view student submissions
            </p>
          </div>
          <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium text-gray-700">
            {exams.length} exams
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <InstructorExamCard
              key={exam.id}
              exam={exam}
              subjectId={subjectId}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default InstructorExamGrid;

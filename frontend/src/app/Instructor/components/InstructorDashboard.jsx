"use client";

import React from 'react';
import { useEffect } from 'react';
import useInstructorStore from './StateManagement'
import InstructorSubjectCard from './InstructorSubjectCard';

const InstructorDashboard = () => {
  const { fetchSubjects, subjects } = useInstructorStore((state) => state);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);
  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
    

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Subjects</h2>
            <p className="text-sm text-gray-500 mt-1">Select a subject to view details</p>
          </div>
          <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium text-gray-700">
            {subjects.length} subject(s)
          </div>
        </div>

        {/* subjects Grid */}
        <InstructorSubjectCard subjects={subjects} />
      </main>
    </div>
  );
};

export default InstructorDashboard;
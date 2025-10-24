"use client";
import React from 'react';
import SubjectCard  from './SubjectCard';
import useSubjectStore from '../../components/StatesManagement';

// Example usage component
const SubjectsGrid = () => {
    const fetchSubjects = useSubjectStore((state) => state.fetchSubjects);
    const subjects = useSubjectStore((state) => state.subjects);
    const loading = useSubjectStore((state) => state.loading);
    const error = useSubjectStore((state) => state.error);
    const fetchStudentGrade = useSubjectStore((state) => state.fetchStudentGrade);

    React.useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    React.useEffect(() => {
        subjects.forEach((subject) => {
            fetchStudentGrade(subject._id);
        });
    }, [subjects, fetchStudentGrade]);

    if (loading) return <div className="p-6">Loading subjects...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (subjects.length === 0) return <div className="p-6">No subjects enrolled.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard key={subject._id} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsGrid;
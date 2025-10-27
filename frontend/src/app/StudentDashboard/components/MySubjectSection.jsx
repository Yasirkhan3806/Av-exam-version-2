'use client';
import React from 'react';
import { BookOpen } from 'lucide-react';
import useSubjectStore from './StatesManagement'
import SubjectCard from '../MySubjects/components/SubjectCard';
import Link from 'next/link';

export default function MySubjectsSection() {
   const fetchSubjects = useSubjectStore((state) => state.fetchSubjects);
   const userInfo = useSubjectStore((state) => state.userInfo);
  const subjects = useSubjectStore((state) => state.subjects);


  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects, userInfo]);

  console.log(subjects);
 
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Subjects</h3>
        </div>
        <Link href="/StudentDashboard/MySubjects" className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          View All
        </Link>
      </div>
      
      <p className="text-gray-600 mb-6">Track your progress across enrolled subjects</p>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject._id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
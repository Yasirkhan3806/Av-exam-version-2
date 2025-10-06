'use client';

import { BookOpen, ChevronRight } from 'lucide-react';

export default function MySubjectsSection() {
  const subjects = [
    {
      name: 'Mathematics',
      progress: 75,
      nextExam: 'Next exam in 2 days',
      color: 'bg-blue-500'
    },
    {
      name: 'Physics',
      progress: 60,
      nextExam: 'Next exam in 5 days',
      color: 'bg-green-500'
    },
    {
      name: 'Chemistry',
      progress: 85,
      nextExam: 'Next exam in 1 week',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Subjects</h3>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          View All
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">Track your progress across enrolled subjects</p>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map((subject, index) => (
          <div 
            key={index} 
            className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {subject.nextExam}
              </span>
            </div>
            
            <h4 className="font-semibold text-gray-800 mb-2">{subject.name}</h4>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{subject.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${subject.color}`} 
                style={{ width: `${subject.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
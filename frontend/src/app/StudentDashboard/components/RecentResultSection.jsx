// components/RecentResultsSection.jsx
'use client';

import { TrendingUp, ChevronRight } from 'lucide-react';

export default function RecentResultsSection() {
  const results = [
    {
      title: 'Mechanics Test',
      subject: 'Physics',
      date: '2 days ago',
      score: 85,
      percentile: 92,
      color: 'bg-blue-600'
    },
    {
      title: 'Organic Chemistry Quiz',
      subject: 'Chemistry',
      date: '1 week ago',
      score: 78,
      percentile: 85,
      color: 'bg-green-600'
    },
    {
      title: 'Calculus Assessment',
      subject: 'Mathematics',
      date: '2 weeks ago',
      score: 92,
      percentile: 96,
      color: 'bg-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Recent Results</h3>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          View All
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">Your latest exam performance</p>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{result.title}</h4>
              <p className="text-sm text-gray-500">
                {result.subject} • {result.date}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full ${result.color} text-white text-sm font-medium`}>
                {result.score}%
              </div>
              <span className="text-sm text-gray-600">
                {result.percentile}th percentile
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
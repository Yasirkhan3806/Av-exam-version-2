'use client';

import { useState,useEffect,useMemo } from 'react';
import { Calendar, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

 const SubjectCard = ({ subject }) => {
    const [exams, setExams] = useState([]);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'; 

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await fetch(`${baseUrl}/subjects/getExamsForSubject/${subject._id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Include cookies for authentication
                });
                const data = await response.json();
                setExams(data);
            } catch (error) {
                console.error('Error fetching exams:', error);
            }
        };

        fetchExams();
    }, [subject._id]);

   const { mockExamCount, testsCompleted, totalTests, progress } = useMemo(() => {
  const total = exams.length;
  const completed = exams.filter(e => e.completed).length;
  const mockCount = exams.filter(e => e.mockExam).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { mockExamCount: mockCount, testsCompleted: completed, totalTests: total, progress };
}, [exams]);




  return (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={`w-4 h-4 rounded-full ${
              subject.color === 'blue' ? 'bg-blue-500' :
              subject.color === 'green' ? 'bg-green-500' :
              subject.color === 'purple' ? 'bg-purple-500' :
              'bg-gray-500'
            }`}
          ></div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{subject.name}</h3>
          </div>
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          Grade: {subject.grade}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              progress >= 80 ? 'bg-green-500' :
              progress >= 60 ? 'bg-blue-500' :
              progress >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className=" mb-4">
        {/* <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600">Next: -{daysUntilNextExam} days</p>
          </div>
        </div> */}
        <div className="flex items-center gap-2 w-full">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm text-gray-600 ">{mockExamCount} mock exam available</p>
          </div>
        </div>
      </div>

      {/* Tests Completed */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <div>
          <p className="text-sm text-gray-600">
            {testsCompleted}/{totalTests} tests completed
          </p>
        </div>
      </div>

      {/* View Tests Button */}
      <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer">
        View Tests
      </button>

      {/* Next Exam Date */}
      {/* <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Next exam: <span className="font-medium">{nextExamDate}</span>
        </p>
      </div> */}
    </div>
  );
};

export default SubjectCard;

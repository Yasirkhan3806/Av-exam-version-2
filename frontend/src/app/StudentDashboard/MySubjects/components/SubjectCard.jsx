'use client';

import { useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import useSubjectStore from '../../components/StatesManagement';
import Link from 'next/link';

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
};

const getGradeFromProgress = (progress) => {
  if (progress >= 90) return 'A+';
  if (progress >= 85) return 'A';
  if (progress >= 80) return 'A-';
  if (progress >= 75) return 'B+';
  if (progress >= 70) return 'B';
  if (progress >= 65) return 'B-';
  if (progress >= 60) return 'C+';
  if (progress >= 55) return 'C';
  if (progress >= 50) return 'C-';
  if (progress >= 45) return 'D+';
  if (progress >= 40) return 'D';
  return 'F';
};

const SubjectCard = ({ subject }) => {
  const { fetchExamsForSubject, examsBySubject, loading } = useSubjectStore();

  // get cached exams or empty array
  const exams = examsBySubject?.[subject._id] || [];

  useEffect(() => {
    if (!subject?._id) return;
    if (!examsBySubject?.[subject._id]) {
      // only fetch if not cached
      fetchExamsForSubject(subject._id);
    }
  }, [subject?._id, fetchExamsForSubject, examsBySubject]);

  // memoized computed stats
  const { total, completed, mockCount, progress } = useMemo(() => {
    const total = exams.length;
    const completed = exams.filter(e => e.completed).length;
    const mockCount = exams.filter(e => e.mockExam).length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, mockCount, progress };
  }, [exams]);

  const calculatedGrade = getGradeFromProgress(progress);

  const progressColor =
    progress >= 80 ? 'bg-green-500' :
    progress >= 60 ? 'bg-blue-500' :
    progress >= 40 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${colorMap[subject.color] || 'bg-gray-500'}`}></div>
          <h3 className="text-xl font-semibold text-gray-900">{subject.name}</h3>
        </div>
        <span className="px-3 py-2 bg-gray-100 text-gray-800 rounded-full text-xs font-medium w-[40%]">
          Grade: {loading ? '...' : calculatedGrade}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {loading ? '...' : `${progress}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${progressColor}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Mock Exams */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-gray-500" />
        <p className="text-sm text-gray-600">
          {loading ? 'Loading exams...' : `${mockCount} mock exam${mockCount !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Tests Completed */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <p className="text-sm text-gray-600">
          {loading
            ? 'Fetching test data...'
            : `${completed}/${total} tests completed`}
        </p>
      </div>

      {/* View Tests Button */}
      <Link
        href={`/StudentDashboard/MySubjects/${subject._id}`}
        aria-label={`View tests for ${subject.name}`}
        disabled={loading}
        className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        View Tests
      </Link>
    </div>
  );
};

export default SubjectCard;
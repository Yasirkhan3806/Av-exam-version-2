"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import useSubjectStore from "../../../store/useSubjectStore";

const getGradeFromProgress = (progress) => {
  if (progress >= 90) return "A+";
  if (progress >= 85) return "A";
  if (progress >= 80) return "A-";
  if (progress >= 75) return "B+";
  if (progress >= 70) return "B";
  if (progress >= 65) return "B-";
  if (progress >= 60) return "C+";
  if (progress >= 55) return "C";
  if (progress >= 50) return "C-";
  if (progress >= 45) return "D+";
  if (progress >= 40) return "D";
  return "F";
};

const OverallProgress = () => {
  const subjects = useSubjectStore((state) => state.subjects);
  const overallProgress = useSubjectStore((state) => state.overallProgress);
  const overallPercentage = useSubjectStore((state) => state.overallPercentage);
  const [progressData, setProgressData] = useState({
    activeCourses: subjects.length,
    avgProgress: 65,
    avgGrade: "B+",
  });

  // Mock data update - in a real app, this would come from an API or store
  useEffect(() => {
    const totalProgress = overallProgress.reduce((acc, curr) => acc + curr, 0);
    const avgProgress = totalProgress / overallProgress.length;

    const totalPercentage = overallPercentage.reduce(
      (acc, curr) => acc + curr,
      0
    );
    const avgPercentage = totalPercentage / overallPercentage.length;
    const avgGrade = getGradeFromProgress(avgPercentage);

    setProgressData({
      activeCourses: subjects.length,
      avgProgress: Math.round(avgProgress),
      avgGrade,
    });
  }, [overallProgress, overallPercentage, subjects]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpRight className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Overall Progress
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Courses */}
        <div className="bg-blue-50 rounded-lg p-4 text-center transition-all hover:shadow-md hover:bg-blue-100">
          <div className="text-2xl font-bold text-blue-700">
            {progressData.activeCourses}
          </div>
          <div className="text-xs font-medium text-blue-600 mt-1">
            Active Courses
          </div>
        </div>

        {/* Avg Progress */}
        <div className="bg-green-50 rounded-lg p-4 text-center transition-all hover:shadow-md hover:bg-green-100">
          <div className="text-2xl font-bold text-green-700">
            {progressData.avgProgress}%
          </div>
          <div className="text-xs font-medium text-green-600 mt-1">
            Avg Progress
          </div>
        </div>

        {/* Avg Grade */}
        <div className="bg-yellow-50 rounded-lg p-4 text-center transition-all hover:shadow-md hover:bg-yellow-100">
          <div className="text-2xl font-bold text-yellow-700">
            {progressData.avgGrade}
          </div>
          <div className="text-xs font-medium text-yellow-600 mt-1">
            Avg Grade
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallProgress;

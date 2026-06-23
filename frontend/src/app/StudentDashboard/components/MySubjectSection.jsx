"use client";
import React from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import useSubjectStore from "../../../store/useSubjectStore";
import SubjectCard from "../MySubjects/components/SubjectCard";
import Link from "next/link";

export default function MySubjectsSection() {
  const fetchSubjects = useSubjectStore((state) => state.fetchSubjects);
  const userInfo = useSubjectStore((state) => state.userInfo);
  const subjects = useSubjectStore((state) => state.subjects);
  const loading = useSubjectStore((state) => state.loading);
  const clearAllSubjectCache = useSubjectStore((state) => state.clearAllSubjectCache);

  React.useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects, userInfo]);

  // Handle manual refresh from the main dashboard
  const handleRefresh = async () => {
    clearAllSubjectCache();
    await fetchSubjects();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Subjects</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Refresh subjects and exams list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/StudentDashboard/MySubjects"
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-sm font-sans"
          >
            View All
          </Link>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Track your progress across enrolled subjects
      </p>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject._id} subject={subject} />
        ))}
      </div>
    </div>
  );
}

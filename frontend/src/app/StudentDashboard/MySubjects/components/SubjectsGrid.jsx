"use client";
import React from 'react';
import { RefreshCw } from 'lucide-react';
import SubjectCard from './SubjectCard';
import useSubjectStore from '../../../../store/useSubjectStore';

const SubjectsGrid = () => {
    const fetchSubjects = useSubjectStore((state) => state.fetchSubjects);
    const subjects = useSubjectStore((state) => state.subjects);
    const loading = useSubjectStore((state) => state.loading);
    const error = useSubjectStore((state) => state.error);
    const fetchStudentGrade = useSubjectStore((state) => state.fetchStudentGrade);
    const clearAllSubjectCache = useSubjectStore((state) => state.clearAllSubjectCache);

    React.useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    React.useEffect(() => {
        subjects.forEach((subject) => {
            fetchStudentGrade(subject._id);
        });
    }, [subjects, fetchStudentGrade]);

    // Handle manual refresh: clear exams list cache and fetch subjects again
    const handleRefresh = async () => {
        clearAllSubjectCache();
        await fetchSubjects();
    };

    const subjectsExist = subjects && subjects.length > 0;

    // Show full screen loading/error only if subjects list is empty/not fetched yet
    if (loading && !subjectsExist) {
        return <div className="p-6 text-gray-600 animate-pulse text-center">Loading subjects...</div>;
    }
    if (error && !subjectsExist) {
        return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header section with manual refresh button */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 font-sans">My Enrolled Subjects</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                        title="Refresh subjects and exams list"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-500 group-hover:text-gray-700 ${loading ? "animate-spin text-indigo-500" : ""}`} />
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Grid items or empty state */}
                {subjects.length === 0 ? (
                    <div className="text-center py-12 text-gray-600 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        No subjects enrolled. If you were recently enrolled, click the "Refresh" button above.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <SubjectCard key={subject._id} subject={subject} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectsGrid;
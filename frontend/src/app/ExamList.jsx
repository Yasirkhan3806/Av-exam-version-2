"use client";

import React from 'react';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import ExamInstructionsPopup from './BeforeExamPopUp';
import useExamStore from './ExamPage/[examId]/StateManagement';

export default function ExamList() {
    const [examData, setExamData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const router = useRouter();
    const BASEURL = useExamStore((state) => state.BASEURL);
    console.log("Base URL:", BASEURL);

    useEffect(() => {
        async function fetchExams() {
            try {
                setLoading(true);
                const response = await fetch(`${BASEURL}/questions/getQuestions`, {
                    method: "GET",
                    credentials: 'include'
                });
                if (!response.ok) throw new Error("Failed to fetch exams");
                const data = await response.json();
                console.log("Fetched exam data:", data);
                setExamData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchExams();
    }, [BASEURL]);
    const handleExamClick = (examId, exam) => {

        setSelectedExam(exam);
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
        setSelectedExam(null);
    };

      const handleStartExam = (examId) => {
    // Close popup and navigate to exam page
    setIsPopupOpen(false);
    router.push(`/ExamPage/${examId}`);
  };

    return (
        <div className="min-h-screen px-2">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-blue-800 mb-8 text-center">Available Exams</h1>

                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <span className="text-blue-600 text-lg font-semibold">Loading exams...</span>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center items-center py-10">
                        <span className="text-red-600 text-lg font-semibold">Error: {error}</span>
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {examData.map((exam) => (
                            <div
                                key={exam._id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-blue-100"
                            >
                                <div className="bg-blue-500 px-6 py-4 text-white">
                                    <h2 className="text-2xl font-bold">{exam.name}</h2>
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                            </svg>
                                            <span className="text-gray-700 font-medium">{exam.totalQuestions} Questions</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span className="text-gray-700 font-medium">{exam.totalAttempt} min</span>
                                        </div>
                                    </div>

                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                        <h3 className="text-sm font-semibold text-blue-800 mb-2">Exam Details</h3>
                                        <p className="text-sm text-gray-600">
                                            {exam.description || "No description provided."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleExamClick(exam._id, exam)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                    >
                                        Start Exam
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* 👇 RENDER POPUP CONDITIONALLY */}
            {isPopupOpen && selectedExam && (
                <ExamInstructionsPopup
                    exam={selectedExam}
                    onClose={handleClosePopup}
                    onStartExam={handleStartExam}
                />
            )}
        </div>
    );
}
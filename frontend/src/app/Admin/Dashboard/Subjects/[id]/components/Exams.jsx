'use client';
import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Users, Clock } from 'lucide-react';

const Exams = ({ subjectId }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

    useEffect(() => {
        fetchExams();
    }, [subjectId]);

    const fetchExams = async () => {
        try {
            const response = await fetch(`${BaseUrl}/questions/getQuestions/${subjectId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Fetched exams:', data);
            setExams(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching exams:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (examId) => {
        if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            try {
                const response = await fetch(`${BaseUrl}/questions/deleteQuestion/${examId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    setExams(exams.filter(exam => exam._id !== examId));
                } else {
                    console.error('Failed to delete exam');
                }
            } catch (error) {
                console.error('Error deleting exam:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="text-blue-600" size={32} />
                    Available Exams
                </h2>
                <div className="text-sm text-gray-500">
                    {exams.length} {exams.length === 1 ? 'exam' : 'exams'} found
                </div>
            </div>

            {exams.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No exams available</h3>
                    <p className="text-gray-500">There are no exams created for this subject yet.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {exams.map((exam) => (
                        <div 
                            key={exam._id} 
                            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6 relative group"
                        >
                            <button
                                onClick={() => handleDelete(exam._id)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Delete exam"
                            >
                                <Trash2 size={18} />
                            </button>
                            
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 flex-1 pr-8">
                                    {exam.name}
                                </h3>
                            </div>
                            
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                {exam.description || 'No description provided.'}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="text-green-500" size={16} />
                                    
                                    <span className="font-medium">Total Questions:</span>
                                    <span>{exam.totalQuestions || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="text-blue-500" size={16} />
                                    <span className="font-medium">Total Time To Attempt:</span>
                                    <span>{exam.totalAttempt || 'N/A'} minutes</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Exams;
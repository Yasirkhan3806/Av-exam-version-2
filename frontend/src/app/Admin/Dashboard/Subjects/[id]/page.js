'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserPlus, BookOpen, CalendarPlus, ChevronLeft } from 'lucide-react';
import TypeExamPopup from './components/TypeExamPopup';
import CAFExamForm from './components/CAFExamForm';
import PRCExamForm from './components/PRCExamForm';
import Exams from './components/Exams';
import EnrollStudentPopup from './components/EnrollStudentForm';
import EnrollStudentsList from './components/EnrolledStudents';

const SubjectDetailsPage = () => {
    const { id } = useParams();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isCAFPopupOpen, setIsCAFPopupOpen] = useState(false);
    const [isPRCPopupOpen, setIsPRCPopupOpen] = useState(false);
    const [isEnrollPopupOpen, setIsEnrollPopupOpen] = useState(false);

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${BaseUrl}/subjects/getSubject/${id}`);
                const data = await response.json();
                setSubject(data);
            } catch (error) {
                console.error('Error fetching subject:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSubject();
        }
    }, [id]);

    const onEnroll = () => {
        window.location.reload();
    }

    const handleAddExamPopUp = (subjectType) => {
        if (subjectType === 'CAF') {
            setIsCAFPopupOpen(true);
        } else if (subjectType === 'PRC') {
            setIsPRCPopupOpen(true);
        } else {
            setIsPopupOpen(true);
        }
    }


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!subject) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">Subject Not Found</div>
                    <p className="text-gray-600">The subject you are looking for doesnt exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Subjects
                </button>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                        <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
                        {subject.instructor && (
                            <p className="text-blue-100 mt-2">
                                Instructor: {subject.instructor.name} ({subject.instructor.userName})
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setIsEnrollPopupOpen(true)}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
                                <UserPlus className="w-5 h-5" />
                                Enroll Student
                            </button>
                            <button
                                onClick={() => handleAddExamPopUp(subject.type)}    
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
                                <CalendarPlus className="w-5 h-5" />
                                Add Exams
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subject Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Description Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-semibold text-gray-900">Description</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            {subject.description || 'No description available.'}
                        </p>
                    </div>

                    {/* Additional Info Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject Information</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Courses</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {subject.courses && subject.courses.length > 0 ? (
                                        subject.courses.map((course, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                            >
                                                {course}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500">No courses assigned</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                                    <p className="text-gray-900 mt-1">
                                        {new Date(subject.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Updated</h3>
                                    <p className="text-gray-900 mt-1">
                                        {new Date(subject.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Exams subjectId={id} />
                <br />
                <EnrollStudentsList subjectId={id} />
              
            </div>
            <TypeExamPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                subjectId={id}
            />
            <CAFExamForm
                isOpen={isCAFPopupOpen}
                onClose={() => setIsCAFPopupOpen(false)}
                subjectId={id}
            />
            <PRCExamForm
                isOpen={isPRCPopupOpen}
                onClose={() => setIsPRCPopupOpen(false)}
                subjectId={id}
            />
            <EnrollStudentPopup
                isOpen={isEnrollPopupOpen}
                onClose={() => setIsEnrollPopupOpen(false)}
                subjectId={id}
                onEnroll={onEnroll}
            />

        </div>

    );
};


export default SubjectDetailsPage;
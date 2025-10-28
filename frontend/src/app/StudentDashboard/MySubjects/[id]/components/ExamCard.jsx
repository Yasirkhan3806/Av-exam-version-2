'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Play, Clock, BookOpen, BarChart } from 'lucide-react';

const ExamCard = ({ test, onReviewResults }) => {
    const [isHovered, setIsHovered] = useState(false);
    console.log('Rendering ExamCard for test:', test);

    // Determine card color based on test status
    const getCardClass = () => {
        if (test.completed) {
            return 'bg-green-50 border-green-200 hover:bg-green-100';
        }
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    };

    // Determine icon color based on test status
    const getIconColor = () => {
        return test.completed ? 'text-green-600' : 'text-blue-600';
    };

    // Determine progress circle color
    const getProgressClass = () => {
        if (test.score >= 80) return 'bg-green-500 text-white';
        if (test.score >= 60) return 'bg-blue-500 text-white';
        if (test.score >= 40) return 'bg-yellow-500 text-white';
        return 'bg-red-500 text-white';
    };

    return (
        <div
            className={`border rounded-xl p-6 transition-all duration-300 ${getCardClass()} hover:shadow-lg hover:scale-[1.02]`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-3">
                    <div className='flex gap-2 '>


                        <div className={`py-1 rounded-full ${getIconColor()}`}>
                            {test.completed ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </div>

                        <div>

                            <h2 className="text-lg font-semibold text-gray-900">{test.questionSetName}</h2>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {test.totalTime} min
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {test.totalQuestions} questions
                            </span>
                            <span>{test.totalMarks} marks</span>
                        </div>
                    </div>
                </div>
                {/* {test.completed && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressClass()}`}>
            {test.score}%
          </span>
        )} */}
            </div>

            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                <p>
                    {test.description || 'N/A'}
                </p>
            </div>

            <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${test.completed ? 'text-green-700' : 'text-blue-700'
                    }`}>
                    {test.completed ? 'Completed' : 'Not Started'}
                </span>
                <button
                    onClick={() => onReviewResults(test.id,test)}
                    disabled={test.completed}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${test.completed
                            ? 'bg-white text-green-700 border border-green-300 hover:bg-green-50 cursor-not-allowed'
                            : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                        }`}
                >
                    Start Test
                </button>
            </div>
        </div>
    );
};

export default ExamCard;

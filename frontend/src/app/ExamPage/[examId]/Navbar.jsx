"use client";

import React, {  useState } from 'react';
import useExamStore from './StateManagement';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { currentQuestion, totalQuestions, questionName, totalTime, remainingTime, tick, getFormattedTime, goToQuestion, saving,nextQuestion,prevQuestion,finishExam } = useExamStore();
  const [isOverviewDropdownOpen, setIsOverviewDropdownOpen] = useState(false);
  const router = useRouter();

  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i + 1);

  const formattedTime = getFormattedTime();
  

  
  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
    if(remainingTime === 0 && totalTime !== 0) {
        clearInterval(timer);
        return;
    }
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, totalTime]);
  const toggleDropdown = () => {
    setIsOverviewDropdownOpen(!isOverviewDropdownOpen);
  };

  return (
    <nav className="bg-gray-200 text-black p-2 flex  border-b border-gray-700 h-16">
      {/* Left Section - Course Information */}
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium w-1/2">
          {questionName}
        </div>
        
        {/* Page Navigation */}
        <div className="flex items-center bg-gray-700 text-white rounded-full px-3 py-1">
          <button
            onClick={prevQuestion}
         className="text-white hover:text-white transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="mx-2 text-sm font-medium">{currentQuestion} / {totalQuestions}</span>
          <button
          onClick={nextQuestion}
           className="text-white hover:text-white transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center Section - Overview Dropdown */}
      <div className="flex items-center space-x-8 gap-4 relative">
        <div 
          className="flex items-center space-x-1 bg-gray-300 hover:bg-gray-600 px-4 py-2 rounded-md cursor-pointer transition-colors relative text-blue-600 hover:text-white"
          onClick={toggleDropdown}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-sm font-medium">Overview</span>
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>

        {/* Dropdown Tabs */}
        {isOverviewDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 px-1 bg-gray-300 border border-gray-400 rounded-md shadow-lg z-10">
            <div className="flex space-x-1 p-1">
              {questionNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => goToQuestion(number)}
                  disabled={saving}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    number === currentQuestion
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-500 text-white hover:bg-gray-600 cursor-pointer'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        )}

      

        {/* Student Information */}
        <div className="text-sm font-medium truncate max-w-lg w-[20vw]">
          AFRDEMO1 Name AFRDEMO1
        </div>
      </div>

      {/* Right Section - Time and Clock with Saving Indicator */}
      <div className="flex items-center space-x-2">
        {saving && (
          <div className="animate-spin mr-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-mono text-blue-600">{formattedTime} Remaining</span>
        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
        <button
          onClick={async () => {
            // You can call your finishExam or endExam function here
            // For example: useExamStore.getState().finishExam();
            // Or trigger a modal confirmation, etc.
            alert('Are you sure you want to finish the exam?');
            await finishExam();
            window.location.href = '/';
            
          }}
          disabled={saving}
          className={`ml-4 px-2 py-1 rounded-md text-blue-600 bg-gray-300 font-semibold hover:bg-gray-700 hover:text-white transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Finish Exam
        </button>
    </nav>
  );
};

export default Navbar;
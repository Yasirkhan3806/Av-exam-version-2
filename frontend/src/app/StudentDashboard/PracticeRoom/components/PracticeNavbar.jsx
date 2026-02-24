"use client";

import React, { useState } from "react";
import usePracticeStore from "../../../../store/usePracticeStore";

const PracticeNavbar = () => {
  const {
    currentQuestion,
    totalQuestions,
    questionName,
    totalTime,
    remainingTime,
    tick,
    getFormattedTime,
    goToQuestion,
    saving,
    nextQuestion,
    prevQuestion,
    finishExam,
    downloadAnswersPDF,
    answers,
  } = usePracticeStore();

  const [isOverviewDropdownOpen, setIsOverviewDropdownOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const questionNumbers = Array.from(
    { length: totalQuestions },
    (_, i) => i + 1,
  );
  const formattedTime = getFormattedTime();

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleDropdown = () => {
    setIsOverviewDropdownOpen(!isOverviewDropdownOpen);
  };

  return (
    <nav className="bg-gray-200 text-black p-2 flex items-center justify-between border-b border-gray-700 h-16 px-6">
      {/* Left Section - Course Information */}
      <div className="flex items-center gap-2 min-w-0">
        <div className=" font-semibold whitespace-nowrap">{questionName}</div>
      </div>

      {/* Center Section - Overview Dropdown and Student Info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center bg-gray-700 text-white rounded-full px-3 py-2">
          <button
            onClick={prevQuestion}
            className="text-white hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="mx-2 text-sm font-medium whitespace-nowrap">
            {currentQuestion} / {totalQuestions}
          </span>
          <button
            onClick={nextQuestion}
            className="text-white hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="relative">
          <div
            className="flex items-center space-x-1 bg-gray-300 hover:bg-gray-600 px-4 py-2 rounded-md cursor-pointer transition-colors text-blue-600 hover:text-white whitespace-nowrap"
            onClick={toggleDropdown}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span className="text-sm font-medium">Overview</span>
            <svg
              className="w-3 h-3 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>

          {/* Dropdown Tabs */}
          {isOverviewDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 px-1 bg-gray-300 border border-gray-400 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="flex flex-wrap gap-1 p-1">
                {questionNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => {
                      goToQuestion(number);
                      setIsOverviewDropdownOpen(false);
                    }}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${number === currentQuestion
                      ? "bg-blue-600 text-white"
                      : "bg-gray-500 text-white hover:bg-gray-600 cursor-pointer"
                      }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Time and Finish Exam */}
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium truncate max-w-xs whitespace-nowrap">
          PRACTICE MODE
        </div>
        {/* Time Display */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-mono text-blue-600 whitespace-nowrap">
            {formattedTime} Elapsed
          </span>
        </div>

        {/* Finish Exam Button */}
        <button
          onClick={async () => {
            if (isFinishing) return;
            if (
              confirm(
                "Are you sure you want to finish practice? A PDF of your answers will be downloaded.",
              )
            ) {
              setIsFinishing(true);
              try {
                await downloadAnswersPDF();
                // Allow the browser to process the download blob before unmounting the DOM
                await new Promise(resolve => setTimeout(resolve, 1500));
              } catch (e) {
                console.error(e);
              } finally {
                await finishExam();
              }
            }
          }}
          disabled={isFinishing}
          className={`px-3 py-2 rounded-md font-semibold transition-colors whitespace-nowrap ${isFinishing
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "text-blue-600 bg-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
        >
          {isFinishing ? "Generating PDF..." : "Finish Practice"}
        </button>
      </div>
    </nav>
  );
};

export default PracticeNavbar;

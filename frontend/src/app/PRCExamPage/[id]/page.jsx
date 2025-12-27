"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import usePrcExamStore from "@/store/prcExamStore";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// format time helper
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const PRCExamPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const {
    exam,
    questions,
    answers,
    currentQuestionIndex,
    timeLeft,
    isExamStarted,
    isFinished,
    isLoading,
    error,
    result,
    fetchExam,
    startExam,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    tickTimer,
    finishExam,
    reset,
  } = usePrcExamStore();

  const [showDetailedResult, setShowDetailedResult] = useState(false);

  useEffect(() => {
    if (id) {
      reset();
      fetchExam(id);
    }
  }, [id, fetchExam, reset]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isExamStarted && !isFinished && timeLeft > 0) {
      timer = setInterval(() => {
        tickTimer();
      }, 1000);
    } else if (timeLeft === 0 && isExamStarted && !isFinished) {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, isFinished, timeLeft, tickTimer, finishExam]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Exam...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!exam) return null;

  // 1. Intro Screen
  if (!isExamStarted && !isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4">{exam.name}</h1>
          <p className="text-gray-600 mb-6">{exam.desc || exam.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {questions.length}
              </div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {exam.totalAttempt || exam.totalTime} mins
              </div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {exam.totalMarks}
              </div>
              <div className="text-sm text-gray-500">Total Marks</div>
            </div>
          </div>

          <button
            onClick={startExam}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  // 3. Result Screen
  if (isFinished && result) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 bg-blue-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Exam Results</h2>
            <div className="text-6xl font-black mb-4">
              {Math.round((result.correct / result.total) * 100)}%
            </div>
            <div className="flex justify-center gap-8">
              <div>
                <div className="text-2xl font-bold">{result.correct}</div>
                <div className="text-blue-100">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{result.wrong}</div>
                <div className="text-blue-100">Wrong</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => router.push("/StudentDashboard")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => setShowDetailedResult(!showDetailedResult)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showDetailedResult ? "Hide Details" : "Show Detailed Result"}
              </button>
            </div>

            {showDetailedResult && (
              <div className="space-y-6">
                {result.detailed.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg ${
                      item.isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <h3 className="font-semibold mb-3 flex items-start gap-2">
                      <span className="bg-gray-200 px-2 rounded text-sm mt-1">
                        Q{idx + 1}
                      </span>
                      {item.questionText}
                    </h3>
                    <div className="space-y-2 ml-8">
                      {item.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 p-2 rounded 
                                            ${
                                              opt.label === item.correctAnswer
                                                ? "bg-green-200 font-medium"
                                                : ""
                                            }
                                            ${
                                              opt.label ===
                                                item.selectedOption &&
                                              !item.isCorrect
                                                ? "bg-red-200"
                                                : ""
                                            }
                                        `}
                        >
                          <span className="w-6 h-6 flex items-center justify-center border border-gray-400 rounded-full text-xs">
                            {opt.label}
                          </span>
                          <span>{opt.text}</span>
                          {opt.label === item.correctAnswer && (
                            <CheckCircle className="w-4 h-4 text-green-700 ml-auto" />
                          )}
                          {opt.label === item.selectedOption &&
                            !item.isCorrect && (
                              <XCircle className="w-4 h-4 text-red-700 ml-auto" />
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Exam Interface
  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 truncate max-w-xs">
            {exam.name}
          </h2>
          <div
            className={`text-xl font-mono font-bold flex items-center gap-2 ${
              timeLeft < 60 ? "text-red-600 animate-pulse" : "text-blue-600"
            }`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 mt-4 max-w-5xl mx-auto rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 min-h-[500px] flex flex-col">
          <div className="mb-6 text-gray-500 font-medium uppercase tracking-wide text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>

          <h3 className="text-xl md:text-2xl font-medium text-gray-900 mb-8 leading-relaxed">
            {currentQ.questionText}
          </h3>

          <div className="space-y-3 flex-1">
            {currentQ.options.map((option) => (
              <button
                key={option.label}
                onClick={() =>
                  submitAnswer(currentQ._id || currentQ.id, option.label)
                }
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 group
                            ${
                              answers[currentQ._id || currentQ.id] ===
                              option.label
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                            }
                        `}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold transition-colors
                            ${
                              answers[currentQ._id || currentQ.id] ===
                              option.label
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 text-gray-500 group-hover:border-blue-400"
                            }
                        `}
                >
                  {option.label}
                </div>
                <span className="text-lg">{option.text}</span>
              </button>
            ))}
          </div>

          {/* Footer Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={finishExam}
                className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 font-semibold shadow-md transition-transform hover:scale-105"
              >
                Finish Exam
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRCExamPage;

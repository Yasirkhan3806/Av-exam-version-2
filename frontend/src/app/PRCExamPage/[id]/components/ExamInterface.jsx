import React from "react";
import usePrcExamStore from "@/store/prcExamStore";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

// format time helper
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const ExamInterface = () => {
  const {
    exam,
    questions,
    currentQuestionIndex,
    answers,
    timeLeft,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    finishExam,
  } = usePrcExamStore();

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

export default ExamInterface;

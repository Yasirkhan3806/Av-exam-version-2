"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import usePrcExamStore from "@/store/prcExamStore";
import { CheckCircle, XCircle } from "lucide-react";

const ExamResult = () => {
  const router = useRouter();
  const { result } = usePrcExamStore();
  const [showDetailedResult, setShowDetailedResult] = useState(false);

  if (!result) return null;

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
};

export default ExamResult;

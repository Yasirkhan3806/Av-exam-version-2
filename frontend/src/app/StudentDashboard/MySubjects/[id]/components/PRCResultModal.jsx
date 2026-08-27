"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { BASEURL as API_URL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";

// Assuming API_URL is available

const PRCResultModal = ({ examId, onClose }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailedResult, setShowDetailedResult] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        // We need credentials for verifyToken
        const response = await safeFetch(`${API_URL}/prc-exams/results/${examId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to fetch results");
        }

        const data = await response.json();
        setResult(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (examId) {
      fetchResult();
    }
  }, [examId]);

  if (!examId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Close
            </button>
          </div>
        ) : result ? (
          <>
            {/* Header */}
            <div className="bg-blue-600 p-8 text-white text-center shrink-0">
              <h2 className="text-3xl font-bold mb-2">Exam Results</h2>
              <div className="text-5xl font-black mb-4">
                {Math.round((result.correct / result.total) * 100)}%
              </div>
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <div className="text-3xl font-bold">{result.correct}</div>
                  <div className="text-blue-100 text-sm uppercase tracking-wider">
                    Correct
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{result.wrong}</div>
                  <div className="text-blue-100 text-sm uppercase tracking-wider">
                    Wrong
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{result.total}</div>
                  <div className="text-blue-100 text-sm uppercase tracking-wider">
                    Total
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {showDetailedResult && (
                <div className="space-y-4">
                  {result.detailed.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg bg-white shadow-sm ${
                        item.isCorrect ? "border-green-200" : "border-red-200"
                      }`}
                    >
                      <h3 className="font-semibold mb-3 flex items-start gap-3 text-gray-800">
                        <span
                          className={`px-2 py-0.5 rounded text-sm mt-0.5 font-mono ${
                            item.isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Q{idx + 1}
                        </span>
                        {item.questionText}
                      </h3>
                      <div className="space-y-2 ml-10">
                        {item.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors
                                            ${
                                              opt.label === item.correctAnswer
                                                ? "bg-green-100 text-green-900 font-medium border border-green-200"
                                                : ""
                                            }
                                            ${
                                              opt.label ===
                                                item.selectedOption &&
                                              !item.isCorrect
                                                ? "bg-red-100 text-red-900 border border-red-200"
                                                : "text-gray-600"
                                            }
                                        `}
                          >
                            <span
                              className={`w-6 h-6 flex items-center justify-center border rounded-full text-xs font-semibold
                                             ${
                                               opt.label === item.correctAnswer
                                                 ? "border-green-400 bg-green-200"
                                                 : opt.label ===
                                                     item.selectedOption &&
                                                   !item.isCorrect
                                                 ? "border-red-400 bg-red-200"
                                                 : "border-gray-300 bg-white"
                                             }
                                        `}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {opt.label === item.correctAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto shrink-0" />
                            )}
                            {opt.label === item.selectedOption &&
                              !item.isCorrect && (
                                <XCircle className="w-4 h-4 text-red-600 ml-auto shrink-0" />
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PRCResultModal;

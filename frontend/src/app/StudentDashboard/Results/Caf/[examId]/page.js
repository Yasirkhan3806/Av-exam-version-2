"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { BASEURL as BASE_URL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";


const CafResult = () => {
  const params = useParams();
  const router = useRouter();
  const { examId } = params;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("answer"); // 'answer' or 'solution'

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        // Fetch submission using credentials to pass the token
        const res = await safeFetch(
          `${BASE_URL}/caf-answers/my-submission/${examId}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch submission");
        const data = await res.json();
        setSubmission(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchSubmission();
    } else {
      setError("Missing exam ID");
      setLoading(false);
    }
  }, [examId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!submission)
    return <div className="p-10 text-center">No submission found</div>;

  const questionPdfUrl = submission.questionSet?.pdfPath
    ? `${BASE_URL}/${submission.questionSet.pdfPath.replace(/\\/g, "/")}`
    : "";
  const submittedPdfUrl = submission.submittedPdfUrl
    ? `${BASE_URL}/${submission.submittedPdfUrl.replace(/\\/g, "/")}`
    : "";
  const checkedPdfUrl = submission.checkedPdfUrl
    ? `${BASE_URL}/${submission.checkedPdfUrl.replace(/\\/g, "/")}`
    : "";
  const suggestedSolutionUrl = submission.suggestedSolutionUrl
    ? `${BASE_URL}/${submission.suggestedSolutionUrl.replace(/\\/g, "/")}`
    : "";

  const displayAnswerUrl = checkedPdfUrl || submittedPdfUrl;
  const hasSuggestedSolution = suggestedSolutionUrl && suggestedSolutionUrl.trim() !== "";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Result: {submission.questionSet?.name}
          </h1>
          <div className="text-sm text-gray-500 flex gap-4">
            <span>
              Status:{" "}
              <span
                className={`font-medium ${
                  submission.status === "checked"
                    ? "text-green-600"
                    : "text-gray-600"
                }`}
              >
                {submission.status}
              </span>
            </span>
            {submission.marksObtained && (
              <span>
                Marks:{" "}
                <span className="font-bold text-gray-900">
                  {submission.marksObtained} /{" "}
                  {submission.questionSet?.totalMarks}
                </span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 px-3 py-1 border rounded hover:bg-gray-50"
        >
          Back to Results
        </button>
      </div>

      {/* Content - Two Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question PDF */}
        <div className="w-1/2 border-r bg-white flex flex-col relative">
          <div className="bg-gray-100 px-4 py-2 border-b font-medium text-gray-700 text-sm">
            Question Paper
          </div>
          {questionPdfUrl ? (
            <iframe
              src={questionPdfUrl}
              className="w-full h-full"
              title="Question PDF"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Question PDF Available
            </div>
          )}
        </div>

        {/* Right: Answer/Checked PDF + Suggested Solution */}
        <div className="w-1/2 bg-white flex flex-col relative">
          {/* Tab Header */}
          <div className="bg-gray-100 px-4 py-2 border-b font-medium text-gray-700 flex justify-between items-center text-sm">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("answer")}
                className={`py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "answer"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Your Answer Sheet
              </button>
              {hasSuggestedSolution && (
                <button
                  onClick={() => setActiveTab("solution")}
                  className={`py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeTab === "solution"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Suggested Solution
                </button>
              )}
            </div>
            {checkedPdfUrl && activeTab === "answer" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Checked Version
              </span>
            )}
          </div>

          {/* PDF Viewer */}
          {activeTab === "answer" ? (
            displayAnswerUrl ? (
              <iframe
                src={displayAnswerUrl}
                className="w-full h-full"
                title="Answer PDF"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Answer PDF Available
              </div>
            )
          ) : (
            <iframe
              src={suggestedSolutionUrl}
              className="w-full h-full"
              title="Suggested Solution PDF"
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
};

export default CafResult;

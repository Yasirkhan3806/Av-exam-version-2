"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useInstructorStore from "../../../../store/useInstructorStore";

const BASE_URL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

const ReviewCafAnswer = () => {
  const params = useParams();
  const router = useRouter();
  const { studentId } = params;
  const { currentExamId } = useInstructorStore((state) => state);

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marks, setMarks] = useState("");
  const [checkedPdf, setCheckedPdf] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        // We fetch directly here or via store. Fetching here for simplicity as per plan.
        // Assuming fetchJSON helper or similar. Using fetch for now.
        // We need headers with credentials if using cookies.
        // Or better, let's use a helper from store or just fetch.
        // Since this is a new page, I'll implement fetch here.

        const res = await fetch(
          `${BASE_URL}/caf-answers/submission/${studentId}/${currentExamId}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch submission");
        const data = await res.json();
        setSubmission(data);
        if (data.marksObtained) setMarks(data.marksObtained);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && currentExamId) {
      fetchSubmission();
    } else {
      setError("Missing student or exam ID");
      setLoading(false);
    }
  }, [studentId, currentExamId]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setCheckedPdf(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("examId", currentExamId);
      formData.append("marks", marks);
      if (checkedPdf) {
        formData.append("checkedPdf", checkedPdf);
      }

      const res = await fetch(`${BASE_URL}/caf-answers/mark-submission`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to mark submission");
      }

      alert("Submission marked successfully!");
      router.back();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;
  if (!submission) return <div className="p-10">No submission found</div>;

  const questionPdfUrl = submission.questionSet?.pdfPath
    ? `${BASE_URL}/${submission.questionSet.pdfPath.replace(/\\/g, "/")}`
    : "";
  const answerPdfUrl = submission.submittedPdfUrl
    ? `${BASE_URL}/${submission.submittedPdfUrl.replace(/\\/g, "/")}`
    : "";
  const checkedPdfUrl = submission.checkedPdfUrl
    ? `${BASE_URL}/${submission.checkedPdfUrl.replace(/\\/g, "/")}`
    : "";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Review CAF Submission
          </h1>
          <p className="text-sm text-gray-500">
            {submission.Student?.name} ({submission.Student?.email})
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
      </div>

      {/* Content - Two Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question PDF */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b font-medium text-gray-700">
            Question PDF
          </div>
          {questionPdfUrl ? (
            <iframe
              src={questionPdfUrl}
              className="w-full h-full"
              title="Question PDF"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Question PDF
            </div>
          )}
        </div>

        {/* Right: Answer PDF (or Checked PDF if available) */}
        <div className="w-1/2 bg-white flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b font-medium text-gray-700 flex justify-between">
            <span>Student Answer PDF</span>
            {checkedPdfUrl && (
              <span className="text-green-600">Checked Version Available</span>
            )}
          </div>
          {/* If we have a checked PDF, showing it might be better, or show the student's original. 
                         Plan: Show student's original by default, maybe toggle?
                         Actually, usually we annotate the student PDF. 
                         Here, the user requested "upload a checked pdf". 
                         So we view the student pdf, download it maybe? 
                         I'll just show the student PDF for viewing.
                      */}
          {answerPdfUrl ? (
            <iframe
              src={answerPdfUrl}
              className="w-full h-full"
              title="Answer PDF"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Answer PDF
            </div>
          )}
        </div>
      </div>

      {/* Bottom Marking Bar */}
      <div className="bg-white border-t px-6 py-4 shadow-lg shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Marks
            </label>
            <input
              type="number"
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Checked PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              required={!submission.checkedPdfUrl} // Required only if not already checked? Or always allow re-upload.
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-0.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewCafAnswer;

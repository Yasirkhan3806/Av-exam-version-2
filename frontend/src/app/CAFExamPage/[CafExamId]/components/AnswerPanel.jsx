"use client";

import { useState } from "react";

export default function AnswerPanel({ onSubmit, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    onSubmit(selectedFile);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Answer</h2>
        <p className="text-gray-500 text-center mb-4">
          Please upload your completed exam file in PDF format.
        </p>

        <div className="w-full">
          <label
            htmlFor="answer-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500 font-semibold">
                {selectedFile
                  ? selectedFile.name
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG (MAX. 10MB)</p>
            </div>
            <input
              id="answer-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform active:scale-95 ${
            selectedFile && !isLoading
              ? "bg-blue-600 hover:bg-blue-700 shadow-md"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? "Submitting..." : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}

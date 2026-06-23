"use client";

import { useState } from "react";

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond || bytesPerSecond <= 0) return "0 B/s";
  return `${formatBytes(bytesPerSecond, 1)}/s`;
};

const formatTime = (seconds) => {
  if (seconds === undefined || seconds === null) return "";
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

export default function AnswerPanel({ onSubmit, isLoading, uploadProgress = 0, uploadDetails = null }) {
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
              <p className="text-xs text-gray-400">PDF, JPG, PNG (MAX. 20MB)</p>
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

        {isLoading && (
          <div className="w-full mt-2 mb-2 space-y-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1 font-medium">
              <span>Uploading file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {uploadDetails && (
              <div className="flex flex-col gap-1.5 text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium text-gray-700">
                    {formatBytes(uploadDetails.loaded)} / {formatBytes(uploadDetails.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-medium text-gray-700">{formatSpeed(uploadDetails.speed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Remaining:</span>
                  <span className="font-medium text-gray-700">{formatTime(uploadDetails.remainingTime)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform active:scale-95 mt-2 ${
            selectedFile && !isLoading
              ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:-translate-y-0.5"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!selectedFile || isLoading}
        >
          {isLoading 
            ? (uploadProgress === 100 ? "Processing on Server..." : `Submitting...`) 
            : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}
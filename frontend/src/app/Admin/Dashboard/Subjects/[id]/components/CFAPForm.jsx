"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { BASEURL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";

export default function AddQuestionsPopup({ subjectId, isOpen, onClose }) {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAttempt, setTotalAttempt] = useState("");
  const [numQuestions, setNumQuestions] = useState("");
  const [totalMarks, setTotalMarks] = useState(""); // New field for total marks
  const [pdfFile, setPdfFile] = useState(null);
  const [mockExam, setMockExam] = useState(false);
  const [uploadMethod, setUploadMethod] = useState("auto"); // "auto" or "manual"
  const [manualFiles, setManualFiles] = useState({}); // { q1: file, q2: file ... }
  const [log, setLog] = useState("");

  // Reset form when popup closes
  const handleClose = () => {
    setFileName("");
    setDescription("");
    setTotalAttempt("");
    setNumQuestions("");
    setTotalMarks(""); // Reset total marks
    setPdfFile(null);
    setManualFiles({});
    setUploadMethod("auto");
    setMockExam(false);
    setLog("");
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setLog(`✅ Selected PDF: ${file.name}`);
    } else {
      setLog("⚠️ Please select a valid PDF file.");
    }
  };

  const handleSaveToDB = async () => {
    if (
      !fileName ||
      !totalAttempt ||
      !numQuestions ||
      !totalMarks ||
      !subjectId
    ) {
      setLog("⚠️ Please provide all fields first.");
      return;
    }

    if (uploadMethod === "auto" && !pdfFile) {
      setLog("⚠️ Please upload a PDF for auto-split.");
      return;
    }

    if (uploadMethod === "manual" && Object.keys(manualFiles).length === 0) {
      setLog("⚠️ Please upload at least one question PDF for manual mapping.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", fileName);
      formData.append("description", description);
      formData.append("totalAttempt", totalAttempt);
      formData.append("numQuestions", numQuestions);
      formData.append("totalMarks", totalMarks); // Add total marks to form data
      formData.append("subjectId", subjectId);
      formData.append("mockExam", mockExam.toString());
      formData.append("uploadMethod", uploadMethod);

      if (uploadMethod === "auto") {
        formData.append("pdf", pdfFile);
      } else {
        Object.entries(manualFiles).forEach(([key, file]) => {
          formData.append(key, file);
        });
      }

      setLog("⏳ Uploading and saving to database...");

      const res = await safeFetch(`${BASEURL}/questions/addQuestions`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok) {
        setLog(`✅ Data saved successfully with ID: ${result.id}`);
        // Optionally close the popup after successful save
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setLog(`❌ Failed to save: ${result.error}`);
      }
    } catch (err) {
      setLog(`❌ Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all z-10 overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">CFAP Exam</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Input for dataset name */}
        <div className="space-y-4">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter dataset name"
            className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Input for description */}
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description of questions"
            className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Input for total to attempt */}
          <input
            type="number"
            value={totalAttempt}
            onChange={(e) => setTotalAttempt(e.target.value)}
            placeholder="Total to attempt"
            className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Input for number of questions */}
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            placeholder="Number of questions"
            className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Input for total marks */}
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            placeholder="Total marks"
            className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Mock Exam Checkbox */}
          <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="mockExam"
              checked={mockExam}
              onChange={(e) => setMockExam(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="mockExam"
              className="ml-3 text-sm font-medium text-gray-700"
            >
              This is a Mock Exam
            </label>
          </div>

          {/* Upload Method Selection */}
          <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadMethod("auto")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                uploadMethod === "auto"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Auto-split PDF
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod("manual")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                uploadMethod === "manual"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Manual Mapping
            </button>
          </div>

          {/* File input(s) */}
          <div className="space-y-2">
            {uploadMethod === "auto" ? (
              <>
                <label className="text-sm font-medium text-gray-700">
                  Full Exam PDF (One page per question)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-white file:bg-blue-600 hover:file:bg-blue-700 cursor-pointer text-sm"
                />
              </>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Upload PDF for each Question
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {Array.from({ length: Number(numQuestions) || 0 }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-xs font-bold text-gray-500 min-w-[30px]">
                          Q{i + 1}
                        </span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setManualFiles((prev) => ({
                                ...prev,
                                [`q${i + 1}`]: file,
                              }));
                            }
                          }}
                          className="flex-1 text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-white file:bg-gray-400 hover:file:bg-gray-500 cursor-pointer"
                        />
                      </div>
                    )
                  )}
                  {(Number(numQuestions) || 0) === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Please enter "Number of questions" first
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          {log && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
              <strong>Logs:</strong> {log}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveToDB}
              className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Save
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

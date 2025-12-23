"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";

export default function AddQuestionsPopup({ subjectId, isOpen, onClose }) {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAttempt, setTotalAttempt] = useState("");
  const [numQuestions, setNumQuestions] = useState("");
  const [totalMarks, setTotalMarks] = useState(""); // New field for total marks
  const [pdfFile, setPdfFile] = useState(null);
  const [mockExam, setMockExam] = useState(false);
  const [log, setLog] = useState("");
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  // Reset form when popup closes
  const handleClose = () => {
    setFileName("");
    setDescription("");
    setTotalAttempt("");
    setNumQuestions("");
    setTotalMarks(""); // Reset total marks
    setPdfFile(null);
    setMockExam(false);
    setLog("");
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      console.log("Selected file:", file);
      setPdfFile(file);
      setLog(`✅ Selected PDF: ${file.name}`);
    } else {
      setLog("⚠️ Please select a valid PDF file.");
    }
  };

  const handleSaveToDB = async () => {
    console.log("Saving to DB with:", {
      fileName,
      description,
      totalAttempt,
      numQuestions,
      totalMarks,
      pdfFile,
      mockExam,
      subjectId,
    });
    if (
      !fileName ||
      !totalAttempt ||
      !numQuestions ||
      !totalMarks ||
      !pdfFile ||
      !subjectId
    ) {
      setLog("⚠️ Please provide all fields and upload a PDF first.");
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
      formData.append("pdf", pdfFile);
      formData.append("mockExam", mockExam.toString());

      setLog("⏳ Uploading and saving to database...");

      const res = await fetch(`${BASEURL}/questions/addQuestions`, {
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

          {/* File input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Exam PDF
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="w-full text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-white file:bg-blue-600 hover:file:bg-blue-700 cursor-pointer"
            />
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

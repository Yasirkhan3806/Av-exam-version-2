"use client";

import { useState, useEffect } from "react";
import { Search, FileText, X, Clock, AlertCircle } from "lucide-react";
import { BASEURL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";

export default function EditExamPopup({
  isOpen,
  onClose,
  exam,
  subjectType,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalAttempt: "",
    totalMarks: "",
    mockExam: false,
    totalQuestions: "",
  });
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (exam && isOpen) {
      setFormData({
        name: exam.name || "",
        description: exam.description || "",
        totalAttempt: exam.totalAttempt || exam.totalTime || "",
        totalMarks: exam.totalMarks || "",
        mockExam: exam.mockExam || false,
        totalQuestions: exam.totalQuestions || "",
      });
      setLog("");
    }
  }, [exam, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLog("");

    try {
      let endpoint = "";
      let method = "PUT";
      let body = {};

      if (subjectType === "CAF") {
        endpoint = `${BASEURL}/questions/updateCafQuestion/${exam._id}`;
        body = {
          name: formData.name,
          description: formData.description,
          numQuestions: formData.totalQuestions, // Kept same
          mockExam: formData.mockExam,
          totalMarks: formData.totalMarks,
        };
      } else if (subjectType === "PRC") {
        endpoint = `${BASEURL}/prc-exams/${exam._id}`;
        body = {
          name: formData.name,
          description: formData.description,
          totalTime: formData.totalAttempt,
          totalMarks: formData.totalMarks,
        };
      } else {
        // Standard
        endpoint = `${BASEURL}/questions/updateQuestion/${exam._id}`;
        body = {
          name: formData.name,
          description: formData.description,
          totalAttempt: formData.totalAttempt,
          numQuestions: formData.totalQuestions, // Kept same
          mockExam: formData.mockExam,
          totalMarks: formData.totalMarks,
        };
      }

      const response = await safeFetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update exam");
      }

      const updatedData = await response.json();
      setLog("✅ Exam updated successfully!");

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating exam:", error);
      setLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={28} />
              <h2 className="text-2xl font-bold">Edit Exam</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Update information for "{exam?.name}"
          </p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="edit-exam-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="number"
                    name="totalAttempt"
                    value={formData.totalAttempt}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Questions
                  </label>
                  <p className="text-xs text-gray-500">
                    Number of questions cannot be edited here.
                  </p>
                </div>
                <span className="font-bold text-gray-900">
                  {formData.totalQuestions}
                </span>
              </div>
            </div>

            {(subjectType === "CAF" || subjectType === "") && (
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="mockExam"
                  name="mockExam"
                  checked={formData.mockExam}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor="mockExam"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as Mock Exam
                </label>
              </div>
            )}

            {log && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 ${
                  log.includes("✅")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{log}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            type="submit"
            form="edit-exam-form"
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
            }`}
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

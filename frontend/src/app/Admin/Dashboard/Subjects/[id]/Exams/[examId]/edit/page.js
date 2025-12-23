"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Upload, FileText, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditExamPage() {
  const { id: subjectId, examId } = useParams();
  const searchParams = useSearchParams();
  const subjectType = searchParams.get("type");
  const router = useRouter();
  const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalAttempt: "",
    numQuestions: "",
    totalMarks: "",
    mockExam: false,
    pdfFile: null,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(
          `${BaseUrl}/questions/getQuestionById/${examId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch exam details");
        const data = await response.json();

        // Note: getQuestionById returns a specific format
        // { questionsObj, time, name, docId }
        // We might need more fields if it's a CAF exam or if we want full edit.
        // Actually, let's assume we might need a better getExamById for editing.
        // For now, let's use what we have and maybe adjust.

        setFormData({
          name: data.name || "",
          description: data.description || "",
          totalAttempt: data.time || "",
          numQuestions: data.questionsObj
            ? Object.keys(data.questionsObj).length
            : "",
          totalMarks: data.totalMarks || "",
          mockExam: data.mockExam || false,
          pdfFile: null,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({ ...prev, pdfFile: file }));
    } else if (file) {
      setError("Please select a valid PDF file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("totalAttempt", formData.totalAttempt);
      data.append("numQuestions", formData.numQuestions);
      data.append("totalMarks", formData.totalMarks);
      data.append("mockExam", formData.mockExam);
      data.append("subjectId", subjectId);
      if (formData.pdfFile) {
        data.append("pdf", formData.pdfFile);
      }

      const endpoint =
        subjectType === "CAF"
          ? `${BaseUrl}/questions/updateCafQuestion/${examId}`
          : `${BaseUrl}/questions/updateQuestion/${examId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        body: data,
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update exam");
      }

      setSuccess("Exam updated successfully!");
      setTimeout(() => {
        router.push(`/Admin/Dashboard/Subjects/${subjectId}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/Admin/Dashboard/Subjects/${subjectId}`}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Subject
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <h1 className="text-3xl font-bold">Edit Exam</h1>
            <p className="mt-2 text-blue-100 opacity-90">
              Modify exam details and upload a new PDF if necessary.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Exam Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                  placeholder="e.g. Midterm Assessment"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Total Marks
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  required
                  value={formData.totalMarks}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  name="totalAttempt"
                  required
                  value={formData.totalAttempt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                  placeholder="e.g. 60"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Number of Questions
                </label>
                <input
                  type="number"
                  name="numQuestions"
                  required
                  value={formData.numQuestions}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800 resize-none"
                placeholder="Briefly describe the exam content..."
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="mockExam"
                name="mockExam"
                checked={formData.mockExam}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
              />
              <label
                htmlFor="mockExam"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Mark as Mock Exam
              </label>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Replace Exam PDF{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>

              {!formData.pdfFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                    <p className="text-sm text-gray-600 font-medium">
                      Click to select new PDF
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Keep current PDF by leaving this empty
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">
                        {formData.pdfFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB •
                        Ready to upload
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, pdfFile: null }))
                    }
                    className="p-2 hover:bg-red-100 rounded-full transition-colors group"
                  >
                    <X className="w-5 h-5 text-red-500 group-hover:text-red-700" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                {success}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating Exam...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>

              <Link
                href={`/Admin/Dashboard/Subjects/${subjectId}`}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-lg transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function EditSubjectForm({
  subject,
  isOpen,
  onClose,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    courses: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        description: subject.description || "",
        type: subject.type || "",
        courses: subject.courses ? subject.courses.join(", ") : "",
      });
    }
  }, [subject, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const coursesArray = formData.courses
        ? formData.courses
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c !== "")
        : [];

      const response = await fetch(
        `${BaseUrl}/subjects/updateSubject/${subject._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            courses: coursesArray,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update subject");
      }

      const updatedData = await response.json();
      onUpdate(updatedData.subject);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all z-10 overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Subject</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Financial Accounting"
              className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Type</option>
              <option value="CAF">CAF</option>
              <option value="PRC">PRC</option>
              <option value="CFAP">CFAP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories (Comma separated)
            </label>
            <input
              type="text"
              value={formData.courses}
              onChange={(e) =>
                setFormData({ ...formData, courses: e.target.value })
              }
              placeholder="e.g. Accounting, Finance"
              className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter subject description..."
              className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

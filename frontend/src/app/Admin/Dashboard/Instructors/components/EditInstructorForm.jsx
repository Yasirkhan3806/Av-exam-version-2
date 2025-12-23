"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function EditInstructorForm({
  instructor,
  isOpen,
  onClose,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    courses: "",
    password: "", // Optional password change
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  useEffect(() => {
    if (instructor) {
      setFormData({
        name: instructor.name || "",
        userName: instructor.userName || "",
        courses: instructor.courses ? instructor.courses.join(", ") : "",
        password: "",
      });
    }
  }, [instructor, isOpen]);

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

      const payload = {
        name: formData.name,
        userName: formData.userName,
        courses: coursesArray,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(
        `${BaseUrl}/instructors/updateInstructor/${instructor._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update instructor");
      }

      const updatedData = await response.json();
      onUpdate(updatedData.instructor);
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all z-10 overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Instructor</h2>
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
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.userName}
              onChange={(e) =>
                setFormData({ ...formData, userName: e.target.value })
              }
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Courses (Comma separated)
            </label>
            <input
              type="text"
              value={formData.courses}
              onChange={(e) =>
                setFormData({ ...formData, courses: e.target.value })
              }
              placeholder="e.g. Accounting, Finance"
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

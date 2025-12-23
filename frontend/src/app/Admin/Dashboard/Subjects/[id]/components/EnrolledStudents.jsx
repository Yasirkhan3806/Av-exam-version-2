"use client";

import { useState, useEffect } from "react";
import { User, Search, Users, Trash2 } from "lucide-react";

export default function EnrolledStudentsList({ subjectId }) {
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const BaseUrl = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  useEffect(() => {
    fetchEnrolledStudents();
  }, [subjectId]);

  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BaseUrl}/subjects/getEnrolledStudents/${subjectId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setEnrolledStudents(data);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (studentId) => {
    if (!window.confirm("Are you sure you want to unenroll this student?"))
      return;

    try {
      const response = await fetch(
        `${BaseUrl}/subjects/UnenrollStudent/${subjectId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setEnrolledStudents((prev) =>
          prev.filter((s) => (s.id || s._id) !== studentId)
        );
      } else {
        const errorData = await response.text();
        alert(`Failed to unenroll: ${errorData}`);
      }
    } catch (error) {
      console.error("Error unenrolling student:", error);
      alert("An error occurred while unenrolling the student.");
    }
  };

  // Filter students based on search term
  const filteredStudents = enrolledStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Enrolled Students
          </h2>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Enrolled Students
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          {enrolledStudents.length}{" "}
          {enrolledStudents.length === 1 ? "student" : "students"} enrolled
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search enrolled students..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          {searchTerm ? (
            <>
              <Search className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-600">
                No enrolled students match your search.
              </p>
            </>
          ) : (
            <>
              <Users className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-600">
                No students enrolled in this subject yet.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id || student._id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-600">{student.email}</p>
                {student.enrollmentDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enrolled:{" "}
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ID: {student._id}
              </div>
              <button
                onClick={() => handleUnenroll(student.id || student._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                title="Unenroll Student"
              >
                <Trash2
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

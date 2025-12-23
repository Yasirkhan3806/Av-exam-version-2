"use client";

import React, { useState, useEffect } from "react";
import { Trash2, User, Loader2, Pencil, Search, Mail } from "lucide-react";
import EditStudentForm from "./components/EditStudentForm";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASEURL}/auth/get-students`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`${BASEURL}/auth/delete-student/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete student");
      }

      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage platform students</p>
        </div>
      </header>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students by name, email, or username..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p>Loading students...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 text-lg">No students found.</div>
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s._id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {s.name}
                      </h3>
                      <p className="text-sm text-gray-500">@{s.userName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      disabled={deletingId === s._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Student"
                    >
                      {deletingId === s._id ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <p className="text-sm truncate">{s.email}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xs text-gray-400">
                    Enrolled Subjects
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded">
                    {s.subjectsEnrolled ? s.subjectsEnrolled.length : 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedStudent && (
        <EditStudentForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={selectedStudent}
          onUpdate={(updated) => {
            setStudents((prev) =>
              prev.map((stud) => (stud._id === updated._id ? updated : stud))
            );
          }}
        />
      )}
    </main>
  );
}

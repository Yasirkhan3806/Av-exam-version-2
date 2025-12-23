"use client";

import React, { useState, useEffect } from "react";
import { Trash2, User, Loader2, Pencil, Search } from "lucide-react";
import EditInstructorForm from "./components/EditInstructorForm";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASEURL}/instructors/getInstructors`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch instructors");
      const data = await res.json();
      setInstructors(data);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this instructor?")) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`${BASEURL}/instructors/deleteInstructor/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete instructor");
      }

      setInstructors((prev) => prev.filter((i) => i._id !== id));
    } catch (error) {
      console.error("Error deleting instructor:", error);
      alert("Failed to delete instructor.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (instructor) => {
    setSelectedInstructor(instructor);
    setIsEditModalOpen(true);
  };

  const filteredInstructors = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-600 mt-1">Manage platform instructors</p>
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
          placeholder="Search instructors by name or username..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p>Loading instructors...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 text-lg">No instructors found.</div>
            </div>
          ) : (
            filteredInstructors.map((i) => (
              <div
                key={i._id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {i.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {i.name}
                      </h3>
                      <p className="text-sm text-gray-500">@{i.userName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(i)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Instructor"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(i._id)}
                      disabled={deletingId === i._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Instructor"
                    >
                      {deletingId === i._id ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assigned Courses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {i.courses && i.courses.length > 0 ? (
                      i.courses.map((course, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                        >
                          {course}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        No courses assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedInstructor && (
        <EditInstructorForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          instructor={selectedInstructor}
          onUpdate={(updated) => {
            setInstructors((prev) =>
              prev.map((inst) => (inst._id === updated._id ? updated : inst))
            );
          }}
        />
      )}
    </main>
  );
}

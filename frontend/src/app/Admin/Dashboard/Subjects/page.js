"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Book, Loader2 } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASEURL}/subjects/getAllSubjects`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault(); // Prevent navigation to details page
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this subject? All associated exams will be deleted and students will be unenrolled."
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`${BASEURL}/subjects/deleteSubject/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete subject");
      }

      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600 mt-1">Manage subjects in the dashboard</p>
        </div>
        <Link
          href="/Admin/Dashboard/Subjects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
        >
          <span>+</span> Add Subject
        </Link>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p>Loading subjects...</p>
        </div>
      ) : (
        <section className="space-y-4">
          {subjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 text-lg">No subjects found.</div>
              <p className="text-gray-400 text-sm mt-1">
                Start by adding a new subject.
              </p>
            </div>
          ) : (
            subjects.map((s) => (
              <Link
                href={`Subjects/${s._id}`}
                key={s._id}
                className="block group"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all group-hover:border-blue-200 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {s.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded uppercase">
                          {s.type}
                        </span>
                      </div>
                      {s?.instructor && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-700">
                            <span className="font-medium">Instructor:</span>{" "}
                            {s.instructor.name}{" "}
                            <span className="text-gray-400">
                              (@{s.instructor.userName})
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, s._id)}
                      disabled={deletingId === s._id}
                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                      title="Delete Subject"
                    >
                      {deletingId === s._id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>
      )}
    </main>
  );
}

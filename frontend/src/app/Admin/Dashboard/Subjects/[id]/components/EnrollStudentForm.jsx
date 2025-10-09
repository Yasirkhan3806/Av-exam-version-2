"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, UserPlus, User, CheckCircle, X } from "lucide-react";

export default function EnrollStudentPopup({ 
  isOpen, 
  onClose, 
  subjectId, 
  onEnroll 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");
    const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

  // Mock student data - replace with actual API call
  const [allStudents, setAllStudents] = useState([]);

useEffect(() => {
    // Fetch not enrolled students for the subject
    const fetchStudents = async () => {
        const response = await fetch(`${BASEURL}/subjects/getNotEnrolledStudents/${subjectId}`,{credentials: 'include'});
        if (!response.ok) {
            throw new Error("Failed to fetch students");
        }
        const data = await response.json();
        // Transform the API response to match the expected format
        const formattedStudents = data.map(student => ({
            id: student._id,
            name: student.name,
            email: student.email,
            enrollmentStatus: false
        }));
        console.log(formattedStudents);
        setAllStudents(formattedStudents);
    };

    fetchStudents().catch(error => {
        console.error(error);
    });
}, []);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return allStudents;
    return allStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allStudents]);

  // Reset form when popup closes
  const handleClose = () => {
    setSearchTerm("");
    setSelectedStudents([]);
    setLog("");
    onClose();
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) {
      setLog("⚠️ Please select at least one student to enroll.");
      return;
    }

    try {
      setLoading(true);
      setLog("⏳ Enrolling students...");

    // Make API calls for each selected student
    await Promise.all(selectedStudents.map(async (studentId) => {
        const response = await fetch(`${BASEURL}/subjects/EnrollStudent/${subjectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to enroll student ${studentId}`);
        }

        return response.json();
    }));

    setLoading(false);
      
      // Call the onEnroll prop with selected student IDs
      onEnroll();
      
      setLog(`✅ Successfully enrolled ${selectedStudents.length} student(s)!`);
      
      // Close popup after successful enrollment
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setLog(`❌ Error enrolling students: ${error.message}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserPlus size={28} />
              <h2 className="text-2xl font-bold">Enroll Students</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Search and select students to enroll in this subject
          </p>
        </div>

        {/* Search and Content */}
        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Selected Students Summary */}
          {selectedStudents.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Students List */}
          <div className="max-h-96 overflow-y-auto space-y-3 mb-6">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="mx-auto mb-2 text-gray-400" size={48} />
                <p>No students found matching your search.</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    selectedStudents.includes(student.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => toggleStudentSelection(student.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    {selectedStudents.includes(student.id) ? (
                      <CheckCircle className="text-blue-500" size={24} />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Logs */}
          {log && (
            <div className={`p-3 rounded-xl mb-4 ${
              log.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' :
              log.includes('⚠️') ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
              'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {log}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleEnrollStudents}
              disabled={loading || selectedStudents.length === 0}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                loading || selectedStudents.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enrolling...
                </div>
              ) : (
                `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
              )}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
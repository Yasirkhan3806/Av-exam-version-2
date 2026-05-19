import Link from "next/link";
import React, { useEffect } from "react";
import useInstructorStore from "../../../store/useInstructorStore";

const scoreCalculation = (marksObtained) => {
  let totalMarks = 0;
  for (const mark of Object.keys(marksObtained)) {
    totalMarks += Number(marksObtained[mark].marks);
  }
  return totalMarks;
};

const StudentSubmissionsCard = ({ student }) => {
  const [score, setScore] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { currentSubjectType, currentExamId, deleteSubmission } = useInstructorStore((state) => state);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      setIsDeleting(true);
      const success = await deleteSubmission(student.id, currentExamId);
      if (!success) {
        alert("Failed to delete submission.");
      }
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const score = scoreCalculation(student.score);
    setScore(score);
  }, [student.score]);

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "checked":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <div
      key={student.id}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
            {student.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{student.name}</h3>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            student.status
          )}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {student.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Submitted: {student.submittedAt}
          <br />
          Marked At : {student.checkedAt}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{student.answered}</span>
        </div>
        <div className="text-sm font-medium text-gray-800">Score: {student.cafMarks ? student.cafMarks : score}</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${student.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {currentSubjectType === "CAF" ? (
          <Link
            href={`/Instructor/ReviewCafAnswer/${student.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Review CAF Answers
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/Instructor/ReviewAnswer/${student.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            Review Answers
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-none flex items-center justify-center px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors duration-200"
          title="Delete Submission"
        >
          {isDeleting ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default StudentSubmissionsCard;

import React from "react";
import usePrcExamStore from "@/store/prcExamStore";

const ExamIntro = () => {
  const { exam, questions, startExam } = usePrcExamStore();

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4">{exam.name}</h1>
        <p className="text-gray-600 mb-6">{exam.desc || exam.description}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {questions.length}
            </div>
            <div className="text-sm text-gray-500">Questions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {exam.totalAttempt || exam.totalTime} mins
            </div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {exam.totalMarks}
            </div>
            <div className="text-sm text-gray-500">Total Marks</div>
          </div>
        </div>

        <button
          onClick={startExam}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Exam
        </button>
      </div>
    </div>
  );
};

export default ExamIntro;

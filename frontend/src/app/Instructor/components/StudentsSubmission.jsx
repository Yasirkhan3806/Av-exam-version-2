import React from 'react';

const StudentSubmissions = () => {
  const examInfo = {
    title: "Calculus I - Midterm Examination",
    subject: "Mathematics",
    date: "March 15, 2024",
    duration: "2 hours",
    questions: "25 questions"
  };

  const students = [
    {
      id: 1,
      name: "Emily Johnson",
      studentId: "MATH2024001",
      email: "emily.johnson@university.edu",
      status: "submitted",
      submittedAt: "March 15, 2024 at 2:45 PM",
      answered: "25/25 answered",
      timeTaken: "1h 45m",
      score: "92%",
      progress: 92
    },
    {
      id: 2,
      name: "Michael Chen",
      studentId: "MATH2024002",
      email: "michael.chen@university.edu",
      status: "submitted",
      submittedAt: "March 15, 2024 at 2:30 PM",
      answered: "23/25 answered",
      timeTaken: "2h 0m",
      score: "78%",
      progress: 78
    },
    {
      id: 3,
      name: "Sarah Williams",
      studentId: "MATH2024003",
      email: "sarah.williams@university.edu",
      status: "submitted",
      submittedAt: "March 15, 2024 at 2:55 PM",
      answered: "24/25 answered",
      timeTaken: "1h 30m",
      score: "85%",
      progress: 85
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'not started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Exams
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Student Submissions</h1>
              <p className="text-sm text-gray-500">{examInfo.title}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">3 submitted</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">1 in progress</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">1 not started</span>
          </div>
        </div>
      </header>

      {/* Exam Info */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>{examInfo.subject}</span>
          <span>•</span>
          <span>{examInfo.date}</span>
          <span>•</span>
          <span>{examInfo.duration}</span>
          <span>•</span>
          <span>{examInfo.questions}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Student List</h2>
          <p className="text-sm text-gray-500 mt-1">Select a student submission to review their answers</p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div 
              key={student.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {student.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submitted: {student.submittedAt}
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{student.answered}</span>
                  <span>Time: {student.timeTaken}</span>
                </div>
                <div className="text-sm font-medium text-gray-800">
                  Score: {student.score}
                </div>
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

              {/* Review Answers Button */}
              <button className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                Review Answers
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentSubmissions;
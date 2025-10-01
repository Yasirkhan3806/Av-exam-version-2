import React from 'react';

const InstructorDashboard = () => {
  const exams = [
    {
      id: 1,
      title: "Calculus I - Midterm Examination",
      subject: "Mathematics",
      status: "completed",
      date: "March 15, 2024",
      duration: "2 hours",
      submissions: "28/30 submitted (93%)",
      questions: "25 questions",
      progress: 93
    },
    {
      id: 2,
      title: "Data Structures and Algorithms",
      subject: "Computer Science",
      status: "active",
      date: "March 20, 2024",
      duration: "1.5 hours",
      submissions: "15/25 submitted (60%)",
      questions: "20 questions",
      progress: 60
    },
    {
      id: 3,
      title: "Introduction to Psychology",
      subject: "Psychology",
      status: "draft",
      date: "March 25, 2024",
      duration: "90 minutes",
      submissions: "0/22 submitted (0%)",
      questions: "30 questions",
      progress: 0
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7M5 21h14" />
          </svg>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Instructor Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your examinations and review student submissions</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Examinations</h2>
            <p className="text-sm text-gray-500 mt-1">Select an exam to view student submissions</p>
          </div>
          <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-medium text-gray-700">
            {exams.length} exams
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div 
              key={exam.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{exam.title}</h3>
                  <p className="text-sm text-gray-500">{exam.subject}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                  {exam.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14" />
                  </svg>
                  {exam.date} • {exam.duration}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.196A6.002 6.002 0 0012 18s.002.002.002.002z" />
                  </svg>
                  {exam.submissions}
                </div>
                <div className="text-sm text-gray-600">
                  {exam.questions}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${exam.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* View Submissions Button */}
              <button className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                View Submissions
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

export default InstructorDashboard;
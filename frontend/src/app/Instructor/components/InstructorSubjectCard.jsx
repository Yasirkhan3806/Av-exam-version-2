import React from 'react';


const InstructorSubjectCard = ({ subjects,getStatusColor }) => {
    return(
        <>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div 
              key={subject._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{subject.name}</h3>
                  <p className="text-sm text-gray-500">{subject.description}</p>
                </div>
              </div>

            {/* Enrolled students */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${getStatusColor?.(subject.status) ?? 'bg-gray-200'} text-white`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <p className="text-sm text-gray-500">Enrolled Students: </p>
                        <p className="font-semibold text-gray-800">
                           {subject?.studentCount}
                        </p>
                    </div>
                </div>
            </div>
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${subject.progress}%` }}
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
        </>
    );
}

export default InstructorSubjectCard;
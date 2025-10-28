import React from 'react';
import InstructorDashboard from './components/InstructorDashboard';
import Logout from './components/Logout';

export default function InstructorPage() {
  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3 justify-between">

          <div className='flex items-center gap-1'>

            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7M5 21h14" />
            </svg>
            <span>
              <h1 className="text-lg font-semibold text-gray-800">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your examinations and review student submissions</p>
            </span>

          </div>
          <div>
            <Logout />
          </div>
        </div>
      </header>

      <InstructorDashboard />

    </div>
  );
}
// app/components/Loading.js
'use client'; // 👈 Only if you use animations or hooks

import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        
        {/* Optional: Pulsing dot in center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
      </div>

      <p className="mt-6 text-gray-600 text-lg font-medium">Loading...</p>
    </div>
  );
}
"use client";
import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';

// Grading Panel Component
const GradingPanel = ({ currentMarks, onMarksChange, onSave, onSkip }) => {
  const [localMarks, setLocalMarks] = useState(currentMarks);

  useEffect(() => {
    setLocalMarks(currentMarks);
  }, [currentMarks]);

  const handleMarksChange = (e) => {
    const value = e.target.value;
    if (value === '' || (Number(value) >= 0 )) {
      setLocalMarks(value);
      onMarksChange(value === '' ? 0 : Number(value));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Grading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Marks Awarded
            </label>
            <div className="relative">
              <input
                type="number"
                value={localMarks}
                onChange={handleMarksChange}
                min="0"
                className="w-full px-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="0"
              />
              {/* <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-lg font-medium">
                / {maxMarks}
              </div> */}
            </div>
            {/* <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Award className="w-4 h-4" />
              Maximum marks for this question: {maxMarks}
            </div> */}
          </div>
          
          <div className="flex items-end gap-4">
            <button
              onClick={onSkip}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
            >
              Skip Question
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-6 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPanel;
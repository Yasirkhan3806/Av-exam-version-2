"use client";
import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';

/**
 * GradingPanel Component
 * 
 * Provides the grading interface for instructors to:
 * - Enter marks for a question
 * - Upload a checked PDF (annotated student answer)
 * - Upload an optional suggested solution PDF
 * 
 * @param {number} currentMarks - The current marks for the question from the store
 * @param {function} onMarksChange - Callback when marks are changed
 * @param {function} onSave - Callback when Save & Continue is clicked
 * @param {function} onPdfUpload - Callback when a checked PDF is uploaded
 * @param {File|null} currentPdf - The currently uploaded checked PDF file
 * @param {function} onSuggestedSolutionUpload - Callback when a suggested solution PDF is uploaded
 * @param {File|null} currentSuggestedSolution - The currently uploaded suggested solution file
 */
const GradingPanel = ({ currentMarks, onMarksChange, onSave, onPdfUpload, currentPdf, onSuggestedSolutionUpload, currentSuggestedSolution }) => {
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
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Grading</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Marks Input */}
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
            </div>
          </div>
          
          {/* Checked PDF + Suggested Solution + Save Button */}
          <div className="md:col-span-2 flex items-end gap-4">
            {/* Checked PDF Upload */}
            <div className='flex flex-col gap-2 flex-1'>
              <label className="block text-sm font-medium text-gray-700">Upload Checked PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => onPdfUpload(e.target.files[0])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
              />
              {currentPdf && (
                <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-700">
                    ✅ {currentPdf.name} ({(currentPdf.size / 1024).toFixed(1)} KB)
                  </p>
                  <button className="text-red-500 text-sm">Remove</button>
                </div>
              )}
            </div>

            {/* Suggested Solution Upload (Optional) */}
            <div className='flex flex-col gap-2 flex-1'>
              <label className="block text-sm font-medium text-gray-700">
                Suggested Solution <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => onSuggestedSolutionUpload(e.target.files[0])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
              />
              {currentSuggestedSolution && (
                <div className="flex items-center justify-between border border-green-300 rounded-lg px-3 py-2 bg-green-50">
                  <p className="text-sm text-green-700">
                    📄 {currentSuggestedSolution.name} ({(currentSuggestedSolution.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={onSave}
              className="px-6 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-lg whitespace-nowrap"
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
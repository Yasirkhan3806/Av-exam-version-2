'use client';

import React, { useState } from 'react';
import PRCExamForm from './PRCExamForm';
import AddQuestionsPopup from './CFAPForm'
import CAFExamForm from './CAFExamForm';

const TypeExamPopup = ({ isOpen, onClose, subjectId }) => {
  const [selectedType, setSelectedType] = useState(null);

  if (!isOpen) return null;

  const handleBack = () => setSelectedType(null);

  const examTypes = [
    { id: 'PRC', label: 'PRC Exam', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'CFAP', label: 'CFAP Exam', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { id: 'CAF', label: 'CAF Exam', color: 'bg-indigo-600 hover:bg-indigo-700' },
  ];

  const renderForm = () => {
    switch (selectedType) {
      case 'PRC':
        return <PRCExamForm subjectId={subjectId} onBack={handleBack} onClose={onClose} />;
      case 'CFAP':
        return <AddQuestionsPopup subjectId={subjectId} onBack={handleBack} onClose={onClose} />;
      case 'CAF':
        return <CAFExamForm subjectId={subjectId} onBack={handleBack} onClose={onClose} />;
      default:
        return (
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full transform transition-all">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select Exam Category</h2>
            <div className="flex flex-col gap-4">
              {examTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full py-3 px-4 ${type.color} text-white font-semibold rounded-lg transition-all duration-200 shadow-md active:scale-95`}
                >
                  {type.label}
                </button>
              ))}
              <hr className="my-2 border-gray-100" />
              <button
                onClick={onClose}
                className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={selectedType ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md">
        {renderForm()}
      </div>
    </div>
  );
};

export default TypeExamPopup;

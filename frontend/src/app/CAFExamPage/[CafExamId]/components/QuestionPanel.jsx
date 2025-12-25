"use client";

export default function QuestionPanel({ pdfUrl }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="w-full h-[85vh] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title="Exam Question PDF"
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No PDF available for this exam.
          </div>
        )}
      </div>
    </div>
  );
}

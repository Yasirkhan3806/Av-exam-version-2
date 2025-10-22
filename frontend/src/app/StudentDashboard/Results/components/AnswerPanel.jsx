import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const AnswerPanel = ({ question, studentAnswer, marksObtained, totalMarks }) => {
  const getMarksColor = () => {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = () => {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (percentage >= 40) return <HelpCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{question}</h3>
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className={`text-sm font-semibold ${getMarksColor()}`}>
              {marksObtained}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Your Answer:</h4>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="text-gray-800 leading-relaxed" 
               dangerouslySetInnerHTML={{ 
                 __html: studentAnswer || '<span class="text-gray-400 italic">No answer provided</span>' 
               }} 
          />
        </div>
      </div>
    </div>
  );
};
export default AnswerPanel;
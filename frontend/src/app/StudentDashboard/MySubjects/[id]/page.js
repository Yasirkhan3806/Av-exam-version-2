import React from 'react';
import ExamGrid from './components/ExamGrid';

const SubjectPage = async ({ params }) => {
  const { id } = await params;
  console.log('Rendering SubjectPage for subject ID:', id); 
  return <ExamGrid subjectId={id} />;
};

export default SubjectPage;

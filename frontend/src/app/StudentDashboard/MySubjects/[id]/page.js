import React from 'react';
import ExamGrid from './components/ExamGrid';

const SubjectPage = async ({ params }) => {
  const { id } = await params;
  return <ExamGrid subjectId={id} />;
};

export default SubjectPage;

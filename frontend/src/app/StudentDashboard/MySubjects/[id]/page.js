import React from "react";
import ExamGrid from "./components/ExamGrid";

const SubjectPage = async ({ params, searchParams }) => {
  const { id } = await params;
  const { type } = await searchParams;
  return <ExamGrid subjectId={id} subjectType={type} />;
};

export default SubjectPage;

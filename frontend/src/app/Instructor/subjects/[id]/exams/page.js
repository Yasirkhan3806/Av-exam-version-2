"use client";
import React, { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import InstructorExamGrid from "../../../components/InstructorExamsGrid";
import useInstructorStore from "../../../../../store/useInstructorStore";

const SubjectTests = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const subjectId = params.id;
  const subjectType = searchParams.get("subjectType");
  const setCurrentSubjectType = useInstructorStore((state)=>state.setCurrentSubjectType)

  useEffect(()=>{
    setCurrentSubjectType(subjectType)
  },[subjectId,subjectType])

  return (
    <>
      <InstructorExamGrid subjectId={subjectId} subjectType={subjectType} />
      {/* Add your tests listing or management components here */}
    </>
  );
};

export default SubjectTests;

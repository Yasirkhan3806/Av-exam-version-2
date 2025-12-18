
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentSubmissions from '../../components/StudentsSubmission';
import useInstructorStore from '../../../../store/useInstructorStore';

const ExamPage = () => {
    const params = useParams();
    const id = params.id;

    const { setCurrentExam, currentExam ,resetCurrentExam } = useInstructorStore();

    useEffect(() => {
        setCurrentExam(id);
        return () => {
            resetCurrentExam();
        };
    }, [id, setCurrentExam, resetCurrentExam]);

 


    return (
        <>
            <StudentSubmissions questionId={id} examInfo={currentExam} />
        </>
    );
};

export default ExamPage;

'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentSubmissions from '../../components/StudentsSubmission';

const ExamPage = () => {
    const params = useParams();
    const id = params.id;


    return (
        <>
            <StudentSubmissions questionId={id} />
        </>
    );
};

export default ExamPage;
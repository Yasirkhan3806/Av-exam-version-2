'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import useSubjectStore from '../../components/StatesManagement';
import DetailedResult from '../components/DetailedResult';


const ExamResultPage = () => {
    const { examId } = useParams()
    const [results, setResults] = useState(null);
    const {fetchStudentAnswers} = useSubjectStore((state) => state);


    useEffect(() => {
        // Fetch exam results here
        const getResults = async () => {
            const answers = await fetchStudentAnswers(examId);
            setResults(answers);
        };
        getResults();
    }, [examId, fetchStudentAnswers]);
    console.log('ExamResultPage fetched results:', results);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Exam Results with {examId}</h1>
            {results ? (
                <div>
                    <DetailedResult result={results} />
                </div>
            ) : (
                <p>Loading results...</p>
            )}
        </div>
    )
}

export default ExamResultPage
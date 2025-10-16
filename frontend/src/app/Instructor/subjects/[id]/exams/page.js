'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import InstructorExamGrid from '../../../components/InstructorExamsGrid'



const SubjectTests = () => {
    const params = useParams()
    const subjectId = params.id

    return (

        <>
            <InstructorExamGrid subjectId={subjectId} />
            {/* Add your tests listing or management components here */}
        </>

    )
}

export default SubjectTests
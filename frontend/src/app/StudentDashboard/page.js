import React from 'react';
import MySubjectsSection from './components/MySubjectSection';
import RecentResultsSection from './components/RecentResultSection';

const StudentDashboard = () => {
    return (
        <div>
            <MySubjectsSection />
            <br />
            <br />
            <br />
            <RecentResultsSection />
        </div>
    );
};

export default StudentDashboard;
import React from 'react';
import MySubjectsSection from './components/MySubjectSection';
// import RecentResultsSection from './components/RecentResultSection';
import OverallProgress from './components/OverallProgress';

const StudentDashboard = () => {
    return (
        <div>
            <OverallProgress />
            <MySubjectsSection />
            {/* <br />
            <br />
            <br />
            <RecentResultsSection /> */}
        </div>
    );
};

export default StudentDashboard;
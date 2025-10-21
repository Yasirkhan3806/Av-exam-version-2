import React from 'react';
import ResultGrid from './components/ResultGrid';


const Results = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">My Results</h1>
            <div className="results-container">
                <ResultGrid />
            </div>
        </div>
    );
};

export default Results;
'use client';

import React from 'react';
import { reportError } from '../utils/errorReporter';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        reportError(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h2>Something went wrong!</h2>
                    <p>We've recorded the error and our team is looking into it.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;

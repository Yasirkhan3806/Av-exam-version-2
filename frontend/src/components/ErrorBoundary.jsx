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
                <div style={{ 
                    padding: '3rem', 
                    textAlign: 'center', 
                    fontFamily: 'Montserrat, sans-serif',
                    backgroundColor: '#f8fafc',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '2.5rem', 
                        borderRadius: '1rem', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        maxWidth: '500px'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
                        <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Connection Interrupted</h2>
                        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '2rem' }}>
                            We encountered a technical hiccup, likely due to a temporary network fluctuation. 
                            <strong> Your progress is automatically saved every few seconds.</strong>
                        </p>
                        <button 
                            onClick={() => window.location.reload()} 
                            style={{ 
                                backgroundColor: '#2563eb',
                                color: 'white',
                                padding: '0.75rem 2rem', 
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                        >
                            Resume Exam
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;

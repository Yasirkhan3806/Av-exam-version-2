'use client';

import { useEffect } from 'react';
import { reportError } from '../utils/errorReporter';

export default function GlobalErrorListener() {
    useEffect(() => {
        const handleWindowError = (event) => {
            reportError(event.error || new Error(event.message || 'Unknown Global Error'));
        };

        const handleUnhandledRejection = (event) => {
            reportError(event.reason || new Error('Unhandled Promise Rejection'));
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    return null; 
}

'use client';

import { useEffect } from 'react';
import { reportError } from '../utils/errorReporter';

export default function GlobalErrorListener() {
    useEffect(() => {
        const handleWindowError = (event) => {
            const error = event.error || new Error(event.message || 'Unknown Global Error');
            
            // 🔄 Auto-recovery for ChunkLoadErrors (Network hiccups)
            if (error.name === 'ChunkLoadError' || (error.message && error.message.includes('Loading chunk'))) {
                const lastReload = sessionStorage.getItem('last-chunk-reload');
                const now = Date.now();
                
                // Only auto-reload if we haven't done so in the last 10 seconds (prevents loops)
                if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('last-chunk-reload', now.toString());
                    console.warn('Network hiccup detected (ChunkLoadError). Retrying...');
                    window.location.reload();
                    return;
                }
            }

            reportError(error);
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

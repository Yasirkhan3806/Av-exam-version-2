'use client';

import { useEffect } from 'react';
import { reportError } from '../utils/errorReporter';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>A critical application error occurred.</h2>
            <button 
                onClick={() => reset()} 
                style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
            >
                Try again
            </button>
        </div>
      </body>
    </html>
  );
}

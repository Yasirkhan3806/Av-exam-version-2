'use client';

import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Watchdog({ thresholdMs = 3000, context = {} }) {
  const lastTick = useRef(Date.now());
  const timer = useRef(null);

  useEffect(() => {
    // 1. Set up the ping timer
    timer.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      
      // If delta is huge, it means the main thread was blocked (or tab slept)
      if (delta > thresholdMs) {
        // Did the tab sleep, or did we freeze? Check visibility.
        if (document.visibilityState === 'visible') {
          Sentry.captureMessage('Main thread blocked (Long Task Detected)', {
            level: 'warning',
            tags: { 
              duration_ms: delta,
              boundary: 'watchdog',
              ...context
            }
          });
        }
      }
      lastTick.current = now;
    }, 1000);

    // 2. Set up unload listener to flush events before death
    const flushOnUnload = () => {
      // Small timeout to give synchronous unloads priority
      Sentry.close(2000).catch(() => {});
    };

    window.addEventListener('beforeunload', flushOnUnload);

    return () => {
      clearInterval(timer.current);
      window.removeEventListener('beforeunload', flushOnUnload);
    };
  }, [thresholdMs, context]);

  return null;
}

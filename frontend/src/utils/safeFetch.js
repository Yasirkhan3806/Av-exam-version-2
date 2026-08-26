export async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    
    // Check if we're in the browser (Sentry might not be initialized on edge)
    if (typeof window !== "undefined") {
      import('@sentry/nextjs').then(Sentry => {
        Sentry.captureException(error, {
          tags: { 
            api_request: true,
            url: url
          },
          extra: {
            method: options.method || 'GET',
            timeoutMs,
            isAbort: error.name === 'AbortError'
          }
        });
      }).catch(() => {});
    }

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw error;
  }
}

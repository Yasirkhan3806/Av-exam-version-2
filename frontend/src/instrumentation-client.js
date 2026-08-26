import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true }),
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error", "warn"] }),
    Sentry.extraErrorDataIntegration(),
    Sentry.httpClientIntegration(),
  ],

  beforeSend(event, hint) {
    if (typeof window !== "undefined" && window.__examContext) {
      event.tags = { ...event.tags, ...window.__examContext };
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

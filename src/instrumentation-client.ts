import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: records what the user did before an error.
  // replayIntegration masks ALL text and inputs by default, so salary values
  // typed/displayed are not captured. Remove this integration if you don't
  // want replays at all.
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions where an error occurs

  enableLogs: true,

  debug: false,
});

// Instruments client-side navigations (App Router) for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

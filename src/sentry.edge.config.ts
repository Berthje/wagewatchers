import * as Sentry from "@sentry/nextjs";

// Runs in the Edge runtime (middleware, edge route handlers).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  enableLogs: true,

  debug: false,
});

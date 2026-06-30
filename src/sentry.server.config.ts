import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower the trace sample rate in production to control volume/cost.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Send console.* and structured logs to Sentry (Logs product).
  enableLogs: true,

  // Set to true while wiring things up to see Sentry's own debug output.
  debug: false,
});

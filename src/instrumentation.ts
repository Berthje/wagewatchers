import * as Sentry from "@sentry/nextjs";

// Next.js runs this once per server runtime (Node.js + Edge). It loads the
// matching Sentry init so server-side errors are captured.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in App Router server components, route handlers,
// server actions and middleware (Next.js `onRequestError` hook).
export const onRequestError = Sentry.captureRequestError;

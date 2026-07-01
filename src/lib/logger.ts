import * as Sentry from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

/**
 * Log a caught error to the console AND report it to Sentry.
 *
 * Unhandled errors are captured automatically by the Sentry SDK
 * (instrumentation.ts / global-error.tsx / client init). Use this for errors
 * you CATCH and handle yourself (e.g. inside a try/catch) — those never reach
 * Sentry unless you report them explicitly.
 *
 * @example
 *   try { ... } catch (err) {
 *     logError("Failed to fetch map data", err, { country });
 *   }
 */
export function logError(message: string, error: unknown, context?: LogContext) {
  // Keep the familiar console output for local dev / server logs.
  console.error(message, { error, ...context });

  Sentry.captureException(error, {
    extra: { logMessage: message, ...context },
  });
}

/**
 * Report a noteworthy non-exception condition (something unexpected that isn't
 * an Error object) to Sentry as a message.
 */
export function logWarning(message: string, context?: LogContext) {
  console.warn(message, context);

  Sentry.captureMessage(message, { level: "warning", extra: context });
}

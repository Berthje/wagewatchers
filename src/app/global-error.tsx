"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// Catches React render errors that bubble to the root of the App Router and
// reports them to Sentry. This is the top-level error boundary; per-segment
// error.tsx files still handle scoped errors.
export default function GlobalError({ error }: { readonly error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Proxy the OpenPanel script from your self-hosted Dashboard
        source: "/op1.js",
        destination: "https://analytics.laytonberth.com/op1.js",
      },
      {
        // Proxy events to your self-hosted OpenPanel API
        source: "/api/op/:path*",
        destination: "https://analytics-api.laytonberth.com/:path*",
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Org/project slugs and auth token are read from env so no secrets live in
  // the repo. Source maps upload only when these are set (e.g. in CI).
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print upload logs in CI.
  silent: !process.env.CI,

  // Upload a wider set of source maps for readable stack traces.
  widenClientFileUpload: true,

  // Tree-shake Sentry's own logger statements out of the client bundle.
  disableLogger: true,
});

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
      // Note: /api/op/* is now handled by src/app/api/op/[...path]/route.ts
      // to properly forward client IP headers for geolocation
    ];
  },
};

export default withNextIntl(nextConfig);

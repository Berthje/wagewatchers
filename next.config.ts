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
      {
        // Proxy events to your self-hosted OpenPanel API
        source: "/api/op/:path*",
        destination: "https://analytics-api.laytonberth.com/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);

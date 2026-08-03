import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "webmail.zeitmint.com" }],
        destination: "https://email.mijndomein.nl",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

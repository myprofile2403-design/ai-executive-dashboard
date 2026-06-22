import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for SSR — needed for /api/auth HMAC verification
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

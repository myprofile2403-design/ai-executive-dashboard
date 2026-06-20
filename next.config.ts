import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// For GitHub Pages deployment: change to "export" and run `npm run build`
// The `out/` folder will contain the static site
const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/ai-executive-dashboard" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

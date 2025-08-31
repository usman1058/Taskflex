import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ✅ enable standalone output */
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable Next.js hot reloading (handled by nodemon, if needed)
  reactStrictMode: false,

  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack hot module replacement
      config.watchOptions = {
        ignored: ["**/*"], // Ignore all file changes
      };
    }
    return config;
  },

  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

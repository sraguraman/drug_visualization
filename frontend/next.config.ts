import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Disables ESLint errors from breaking the build
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable to prevent hydration warnings from browser extensions
  async rewrites() {
    return [
      {
        source: '/telegram/:path*',
        destination: `${BACKEND_URL}/telegram/:path*`,
      },
    ];
  },
};

export default nextConfig;


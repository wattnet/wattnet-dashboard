import type { NextConfig } from 'next';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // A type error breaks the build: `tsc` is clean, and it stays so.
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

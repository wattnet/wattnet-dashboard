import type { NextConfig } from 'next';

const nextConfig = {
  // The server and only the modules that it needs, for a small image that starts with `node server.js`.
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // A type error breaks the build: `tsc` is clean, and it stays so.
  typescript: {
    ignoreBuildErrors: false,
  },
} satisfies NextConfig;

export default nextConfig;

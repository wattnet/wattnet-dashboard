import type { NextConfig } from 'next';

const nextConfig = {
  // The server and only the modules that it needs, for a small image that starts with `node server.js`. The
  // Dockerfile turns it on with NEXT_OUTPUT=standalone: `next start` does not work with this output, so a
  // build made for `yarn start` does not use it.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // A type error breaks the build: `tsc` is clean, and it stays so.
  typescript: {
    ignoreBuildErrors: false,
  },
} satisfies NextConfig;

export default nextConfig;

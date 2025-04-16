import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const baseConfig = {
  env: {
    HASHED_PASSWORD: process.env.HASHED_PASSWORD,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

// Wrap Next.js config with PWA plugin
const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

export default withPWA(baseConfig);

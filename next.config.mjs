import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  ...nextConfig,
});

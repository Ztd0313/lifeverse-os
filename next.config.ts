import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.clerk.accounts.dev' },
      { protocol: 'http', hostname: '120.55.38.135' },
      { protocol: 'https', hostname: '120.55.38.135' },
    ],
  },
};

export default nextConfig;

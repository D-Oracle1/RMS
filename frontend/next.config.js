const isProd = process.env.NODE_ENV === 'production';

const withPWA = isProd
  ? require("@ducanh2912/next-pwa").default({
      dest: "public",
      register: true,
      skipWaiting: true,
    })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);

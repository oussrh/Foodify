// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features introduced in Next.js 15
  experimental: {
    serverActions: {},
    typedRoutes: true,
  },
  // Produce a standalone build for easier deployment
  output: "standalone",
  images: {
    domains: ['res.cloudinary.com', 'api.qrserver.com'],
  },
};

export default nextConfig;

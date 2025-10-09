/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Explicitly set the output file tracing root to avoid warnings
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

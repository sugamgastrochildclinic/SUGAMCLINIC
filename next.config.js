const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to THIS project. A stray lockfile in the home dir
  // (C:\Users\tamil\package-lock.json) made Next infer the wrong root.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

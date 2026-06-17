const path = require('path');

// Content-Security-Policy with a tested allowlist for the third parties this
// site actually uses: Google Translate (scripts/styles/frames from google +
// gstatic), ImageKit (images), and inline styles emitted by framer-motion and
// Next. 'unsafe-inline'/'unsafe-eval' for scripts is required by the Google
// Translate widget (it injects inline + eval'd code); everything else is locked
// down. `frame-ancestors 'self'` mirrors X-Frame-Options for modern browsers.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com https://www.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
  "img-src 'self' data: blob: https://ik.imagekit.io https://www.google.com https://www.gstatic.com https://translate.googleapis.com https://translate-pa.googleapis.com https://*.gstatic.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://ik.imagekit.io https://upload.imagekit.io https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.google.com",
  "frame-src 'self' https://www.google.com https://translate.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

// Security headers applied to every response.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to THIS project. A stray lockfile in the home dir
  // (C:\Users\tamil\package-lock.json) made Next infer the wrong root.
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  compress: true,
  // Tree-shake large icon/animation/chart libs so only used exports ship.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Quality values actually used across components (hero/gallery 75, blog 76, migrated 70/72/90).
    qualities: [70, 72, 75, 76, 90],
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
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
    ];
  },
};

module.exports = nextConfig;

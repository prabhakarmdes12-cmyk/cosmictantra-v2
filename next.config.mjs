/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide Next.js banner
  // mupdf is a native ESM package used server-side for PDF page-count QA
  // (and the Kundli PDF inspect toolkit). Keep it external to the server
  // bundle so `import('mupdf')` resolves at runtime instead of being wrapped.
  experimental: {
    serverComponentsExternalPackages: ['mupdf'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Clickjacking defense
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // MIME sniffing defense
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)', // Restricted to self origin for WebRTC
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

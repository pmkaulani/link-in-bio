/** @type {import('next').NextConfig} */

// This app renders user-supplied image URLs from arbitrary domains (avatars,
// thumbnails, grid posts) and embeds YouTube/Vimeo iframes, so the CSP can't
// be locked down to a fixed image allowlist the way a typical app's could.
// img-src is intentionally broad; frame-src is scoped to just the video/embed
// providers actually used in VideoBlock.
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next.js inline scripts & styled-jsx;
  // 'unsafe-eval' is needed by Next.js dev/HMR — consider removing for static export.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

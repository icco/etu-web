import type { NextConfig } from 'next'

const REPORT_URI = 'https://reportd.natwelch.com/report/etu-web'
const REPORTING_URI = 'https://reportd.natwelch.com/reporting/etu-web'

const reportingHeaders = [
  {
    key: 'NEL',
    value: JSON.stringify({
      report_to: 'default',
      max_age: 2592000,
      include_subdomains: true,
    }),
  },
  {
    key: 'Report-To',
    value: JSON.stringify({
      group: 'default',
      max_age: 10886400,
      endpoints: [{ url: REPORT_URI }],
      include_subdomains: true,
    }),
  },
  {
    key: 'Reporting-Endpoints',
    value: `default="${REPORTING_URI}"`,
  },
]

const isDev = process.env.NODE_ENV !== 'production'

// React dev mode and Next.js Turbopack HMR both need eval() at runtime.
// Production never uses eval, so the looser script-src is dev-only.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'"

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://reportd.natwelch.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      `report-uri ${REPORT_URI}`,
      'report-to default',
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  // Pin Turbopack's workspace root so a stray lockfile higher up the tree
  // (e.g. an accidental ~/yarn.lock) can't trick it into picking the wrong
  // directory. https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Increased to support image uploads (base64 adds ~33% overhead)
      // 10MB body allows ~7MB images after encoding
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...reportingHeaders, ...securityHeaders],
      },
    ]
  },
}

export default nextConfig

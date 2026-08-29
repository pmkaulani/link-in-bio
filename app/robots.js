export default function robots() {
  const base = process.env.NEXT_PUBLIC_APP_HOST ? `https://${process.env.NEXT_PUBLIC_APP_HOST}` : 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/onboarding', '/auth', '/admin', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

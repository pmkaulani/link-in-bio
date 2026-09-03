import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LinkInBio — One Link. Everything You Share.',
    template: '%s | LinkInBio',
  },
  description: 'Create a beautiful, customizable link-in-bio page in seconds. Share your socials, store, videos, and music with one fast link.',
  keywords: [
    'link in bio',
    'linkinbio',
    'biolink',
    'linktree alternative',
    'creator page',
    'social links',
    'digital business card',
    'instagram link',
    'tiktok link',
  ],
  authors: [{ name: 'LinkInBio' }],
  creator: 'LinkInBio',
  publisher: 'LinkInBio',
  applicationName: 'LinkInBio',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'LinkInBio',
    title: 'LinkInBio — One Link. Everything You Share.',
    description: 'Create a beautiful, customizable link-in-bio page in seconds. Share your socials, store, videos, and music with one fast link.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkInBio — One Link. Everything You Share.',
    description: 'Create a beautiful, customizable link-in-bio page in seconds. Share your socials, store, videos, and music with one fast link.',
    creator: '@linkinbio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LinkInBio',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Create a beautiful, customizable link-in-bio page in seconds.',
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased">{children}</body>
    </html>
  );
}

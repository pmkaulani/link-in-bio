import './globals.css';

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
  maximumScale: 1,
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&family=Quicksand:wght@500;600;700&family=Syne:wght@600;700;800&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&family=Quicksand:wght@500;600;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}

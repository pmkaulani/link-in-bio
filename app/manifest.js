export default function manifest() {
  return {
    name: 'LinkInBio — All your links in one place',
    short_name: 'LinkInBio',
    description: 'Build a beautiful, high-converting Link in Bio page in minutes. Share all your content with a single link.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0E7A46',
    icons: [
      {
        src: '/icon.svg',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  };
}

// lib/platformGuide.js
// Intelligent platform mappings, URL parsing, prefix handling, and contextual guidance

export const COUNTRY_CODES = [
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
];

export const PLATFORMS = {
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    icon: 'instagram',
    mode: 'username',
    prefix: 'instagram.com/',
    placeholder: 'username',
    example: 'cristiano',
    tip: "Enter only your username. You don't need to paste instagram.com/...",
    defaultTitle: (username) => (username ? `@${username} on Instagram` : 'Instagram'),
    defaultSubtitle: 'Follow on Instagram',
    buildUrl: (username) => `https://instagram.com/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/(?:instagram\.com|instagr\.am)\/([A-Za-z0-9_.]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    icon: 'tiktok',
    mode: 'username',
    prefix: 'tiktok.com/@',
    placeholder: 'username',
    example: 'mrbeast',
    tip: "Enter only your handle without the @ symbol.",
    defaultTitle: (username) => (username ? `@${username} on TikTok` : 'TikTok'),
    defaultSubtitle: 'Watch TikTok videos',
    buildUrl: (username) => `https://tiktok.com/@${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/tiktok\.com\/@?([A-Za-z0-9_.]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  twitter: {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: 'twitter',
    mode: 'username',
    prefix: 'x.com/',
    placeholder: 'username',
    example: 'elonmusk',
    tip: "Enter only your X / Twitter handle without the @ symbol.",
    defaultTitle: (username) => (username ? `@${username} on X` : 'X (Twitter)'),
    defaultSubtitle: 'Follow on X',
    buildUrl: (username) => `https://x.com/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    mode: 'youtube', // special dual mode: channel vs video
    prefix: 'youtube.com/@',
    placeholder: 'channel_handle',
    example: 'mkbhd',
    tip: "Share a channel handle or paste a direct video / Short link.",
    defaultTitle: (val, mode) => (mode === 'video' ? 'Watch on YouTube' : (val ? `@${val} on YouTube` : 'YouTube Channel')),
    defaultSubtitle: 'Watch YouTube content',
    buildUrl: (val, mode = 'channel') => {
      if (mode === 'video') {
        const v = (val || '').trim();
        return v.startsWith('http') ? v : `https://${v}`;
      }
      return `https://youtube.com/@${cleanUsername(val)}`;
    },
    parseUrl: (url) => {
      if (url.includes('/watch?v=') || url.includes('youtu.be/') || url.includes('/shorts/')) {
        return { value: url.trim(), mode: 'video' };
      }
      const match = url.match(/youtube\.com\/@([A-Za-z0-9_.-]+)/i) || url.match(/youtube\.com\/(?:c\/|user\/)?([A-Za-z0-9_.-]+)/i);
      return match ? { value: match[1], mode: 'channel' } : null;
    },
  },
  spotify: {
    key: 'spotify',
    label: 'Spotify',
    icon: 'spotify',
    mode: 'url',
    placeholder: 'https://open.spotify.com/...',
    example: 'https://open.spotify.com/playlist/...',
    tip: 'Paste a link to your track, playlist, album, or artist profile.',
    guideSteps: [
      'Open the Spotify app or web player.',
      'Go to the song, playlist, or artist profile you want to share.',
      'Tap the three dots (•••) → Share → Copy Link.',
      'Paste the copied link right here.',
    ],
    defaultTitle: () => 'Listen on Spotify',
    defaultSubtitle: 'Stream track or playlist',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: (url) => (url.includes('spotify.com') ? url.trim() : null),
  },
  whatsapp: {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'whatsapp',
    mode: 'phone',
    placeholder: '712 345 678',
    example: '712 345 678',
    tip: "We'll format your WhatsApp chat link automatically.",
    defaultTitle: () => 'Chat on WhatsApp',
    defaultSubtitle: 'Direct message',
    buildUrl: (phone, countryCode = '+1') => {
      if (!phone) return '';
      if (phone.includes('wa.me') || phone.includes('whatsapp.com')) {
        return ensureHttps(phone);
      }
      const trimmed = phone.trim();
      let digitsOnly;
      if (trimmed.startsWith('+')) {
        digitsOnly = trimmed.replace(/\D/g, '');
      } else {
        const cleanPhone = trimmed.replace(/^0+/, '');
        digitsOnly = `${countryCode}${cleanPhone}`.replace(/\D/g, '');
      }
      return `https://wa.me/${digitsOnly}`;
    },
    parseUrl: (url) => {
      const match = url.match(/wa\.me\/(\d+)/i) || url.match(/whatsapp\.com\/send\?phone=(\d+)/i);
      return match ? match[1] : null;
    },
  },
  github: {
    key: 'github',
    label: 'GitHub',
    icon: 'github',
    mode: 'username',
    prefix: 'github.com/',
    placeholder: 'username',
    example: 'torvalds',
    tip: 'Enter only your GitHub username.',
    defaultTitle: (username) => (username ? `@${username} on GitHub` : 'GitHub Projects'),
    defaultSubtitle: 'Open source & code',
    buildUrl: (username) => `https://github.com/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/github\.com\/([A-Za-z0-9_-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  linkedin: {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    mode: 'username',
    prefix: 'linkedin.com/in/',
    placeholder: 'username',
    example: 'satyanadella',
    tip: 'Enter your LinkedIn public profile slug.',
    defaultTitle: () => 'Connect on LinkedIn',
    defaultSubtitle: 'Professional network',
    buildUrl: (username) => `https://linkedin.com/in/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/linkedin\.com\/in\/([A-Za-z0-9_-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  threads: {
    key: 'threads',
    label: 'Threads',
    icon: 'threads',
    mode: 'username',
    prefix: 'threads.net/@',
    placeholder: 'username',
    example: 'zuck',
    tip: 'Enter your Threads handle.',
    defaultTitle: (username) => (username ? `@${username} on Threads` : 'Threads'),
    defaultSubtitle: 'Follow on Threads',
    buildUrl: (username) => `https://threads.net/@${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/threads\.net\/@?([A-Za-z0-9_.]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  twitch: {
    key: 'twitch',
    label: 'Twitch',
    icon: 'twitch',
    mode: 'username',
    prefix: 'twitch.tv/',
    placeholder: 'username',
    example: 'shroud',
    tip: 'Enter your Twitch channel name.',
    defaultTitle: (username) => (username ? `${username} on Twitch` : 'Watch Live on Twitch'),
    defaultSubtitle: 'Live streaming',
    buildUrl: (username) => `https://twitch.tv/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/twitch\.tv\/([A-Za-z0-9_]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  snapchat: {
    key: 'snapchat',
    label: 'Snapchat',
    icon: 'snapchat',
    mode: 'username',
    prefix: 'snapchat.com/add/',
    placeholder: 'username',
    example: 'djkhaled',
    tip: 'Enter your Snapchat username.',
    defaultTitle: (username) => (username ? `Add @${username} on Snapchat` : 'Snapchat'),
    defaultSubtitle: 'Add on Snapchat',
    buildUrl: (username) => `https://snapchat.com/add/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/snapchat\.com\/add\/([A-Za-z0-9_.-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  pinterest: {
    key: 'pinterest',
    label: 'Pinterest',
    icon: 'pinterest',
    mode: 'username',
    prefix: 'pinterest.com/',
    placeholder: 'username',
    example: 'joycho',
    tip: 'Enter your Pinterest username.',
    defaultTitle: (username) => (username ? `${username} on Pinterest` : 'Pinterest Boards'),
    defaultSubtitle: 'Inspiration & pins',
    buildUrl: (username) => `https://pinterest.com/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/pinterest\.com\/([A-Za-z0-9_.]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  reddit: {
    key: 'reddit',
    label: 'Reddit',
    icon: 'reddit',
    mode: 'username',
    prefix: 'reddit.com/u/',
    placeholder: 'username',
    example: 'spez',
    tip: 'Enter your Reddit username.',
    defaultTitle: (username) => (username ? `u/${username} on Reddit` : 'Reddit'),
    defaultSubtitle: 'Join the discussion',
    buildUrl: (username) => `https://reddit.com/u/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/reddit\.com\/u(?:ser)?\/([A-Za-z0-9_-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  discord: {
    key: 'discord',
    label: 'Discord',
    icon: 'discord',
    mode: 'url',
    placeholder: 'https://discord.gg/...',
    example: 'https://discord.gg/yourserver',
    tip: 'Paste your Discord server invite link.',
    defaultTitle: () => 'Join Discord Server',
    defaultSubtitle: 'Community & chat',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: (url) => (url.includes('discord.gg') || url.includes('discord.com/invite') ? url.trim() : null),
  },
  telegram: {
    key: 'telegram',
    label: 'Telegram',
    icon: 'telegram',
    mode: 'username',
    prefix: 't.me/',
    placeholder: 'username',
    example: 'creatorchannel',
    tip: 'Enter your Telegram username or channel link.',
    defaultTitle: (username) => (username ? `Join @${username} on Telegram` : 'Telegram Channel'),
    defaultSubtitle: 'Broadcasts & alerts',
    buildUrl: (username) => `https://t.me/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/t\.me\/([A-Za-z0-9_]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  applemusic: {
    key: 'applemusic',
    label: 'Apple Music',
    icon: 'applemusic',
    mode: 'url',
    placeholder: 'https://music.apple.com/...',
    example: 'https://music.apple.com/album/...',
    tip: 'Paste link to song, album, or artist on Apple Music.',
    defaultTitle: () => 'Listen on Apple Music',
    defaultSubtitle: 'Stream on Apple Music',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: (url) => (url.includes('music.apple.com') ? url.trim() : null),
  },
  soundcloud: {
    key: 'soundcloud',
    label: 'SoundCloud',
    icon: 'soundcloud',
    mode: 'url',
    placeholder: 'https://soundcloud.com/...',
    example: 'https://soundcloud.com/artist/track',
    tip: 'Paste link to your SoundCloud track or profile.',
    defaultTitle: () => 'Listen on SoundCloud',
    defaultSubtitle: 'Stream tracks',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: (url) => (url.includes('soundcloud.com') ? url.trim() : null),
  },
  patreon: {
    key: 'patreon',
    label: 'Patreon',
    icon: 'patreon',
    mode: 'username',
    prefix: 'patreon.com/',
    placeholder: 'creator',
    example: 'creator',
    tip: 'Enter your Patreon creator name.',
    defaultTitle: () => 'Support on Patreon',
    defaultSubtitle: 'Exclusive memberships',
    buildUrl: (username) => `https://patreon.com/${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/patreon\.com\/([A-Za-z0-9_-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  substack: {
    key: 'substack',
    label: 'Substack',
    icon: 'substack',
    mode: 'url',
    placeholder: 'https://newsletter.substack.com',
    example: 'https://newsletter.substack.com',
    tip: 'Paste your Substack newsletter link.',
    defaultTitle: () => 'Read Newsletter on Substack',
    defaultSubtitle: 'Weekly essays & insights',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: (url) => (url.includes('substack.com') ? url.trim() : null),
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    icon: 'medium',
    mode: 'username',
    prefix: 'medium.com/@',
    placeholder: 'username',
    example: 'ev',
    tip: 'Enter your Medium handle.',
    defaultTitle: () => 'Read Articles on Medium',
    defaultSubtitle: 'Blog & stories',
    buildUrl: (username) => `https://medium.com/@${cleanUsername(username)}`,
    parseUrl: (url) => {
      const match = url.match(/medium\.com\/@?([A-Za-z0-9_.-]+)/i);
      return match ? match[1].replace(/\/$/, '') : null;
    },
  },
  email: {
    key: 'email',
    label: 'Email',
    icon: 'email',
    mode: 'email',
    placeholder: 'hello@example.com',
    example: 'hello@example.com',
    tip: 'Visitors will be able to email you directly.',
    defaultTitle: () => 'Send an Email',
    defaultSubtitle: 'Business inquiries & contact',
    buildUrl: (email) => `mailto:${email.trim().replace(/^mailto:/i, '')}`,
    parseUrl: (url) => {
      const match = url.match(/^mailto:([^\s?]+)/i);
      return match ? match[1] : null;
    },
  },
  phone: {
    key: 'phone',
    label: 'Phone Call',
    icon: 'phone',
    mode: 'phone',
    placeholder: '+1 555 123 4567',
    example: '+1 555 123 4567',
    tip: 'Visitors on mobile will be able to tap to call directly.',
    defaultTitle: () => 'Call Directly',
    defaultSubtitle: 'Direct line',
    buildUrl: (phone, countryCode = '+1') => {
      const clean = phone.startsWith('+') ? phone : `${countryCode} ${phone}`;
      return `tel:${clean.replace(/[^\d+]/g, '')}`;
    },
    parseUrl: (url) => {
      const match = url.match(/^tel:([^\s]+)/i);
      return match ? match[1] : null;
    },
  },
  store: {
    key: 'store',
    label: 'Store / Shop',
    icon: 'store',
    mode: 'url',
    placeholder: 'https://store.example.com',
    example: 'https://store.example.com',
    tip: 'Link to your Shopify, Etsy, Gumroad, or merchandise store.',
    defaultTitle: () => 'Shop Merch & Products',
    defaultSubtitle: 'Official store',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: () => null,
  },
  globe: {
    key: 'globe',
    label: 'Website / Portfolio',
    icon: 'globe',
    mode: 'url',
    placeholder: 'https://example.com',
    example: 'https://example.com',
    tip: 'Include https:// for secure browsing.',
    defaultTitle: () => 'Visit Website',
    defaultSubtitle: 'Official portfolio',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: () => null,
  },
  link: {
    key: 'link',
    label: 'Custom Link',
    icon: 'link',
    mode: 'url',
    placeholder: 'https://...',
    example: 'https://...',
    tip: 'Enter any valid destination URL.',
    defaultTitle: () => 'Explore Link',
    defaultSubtitle: 'Click to visit',
    buildUrl: (url) => ensureHttps(url),
    parseUrl: () => null,
  },
};

export const POPULAR_PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'spotify',
  'whatsapp',
  'twitter',
  'github',
  'linkedin',
  'globe',
  'email',
];

export const OTHER_PLATFORMS = [
  'threads',
  'snapchat',
  'twitch',
  'discord',
  'telegram',
  'pinterest',
  'reddit',
  'applemusic',
  'soundcloud',
  'patreon',
  'substack',
  'medium',
  'store',
  'phone',
  'link',
];

export function cleanUsername(val) {
  if (!val) return '';
  return val
    .trim()
    .replace(/^[@/]+/, '')
    .replace(/[/?#].*$/, '');
}

export function ensureHttps(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Smart URL Auto-Detection
 */
export function detectPlatformFromUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  if (/^mailto:/i.test(raw)) {
    const email = raw.replace(/^mailto:/i, '').split('?')[0];
    return {
      platformKey: 'email',
      value: email,
      cleanUrl: `mailto:${email}`,
      title: PLATFORMS.email.defaultTitle(email),
      subtitle: PLATFORMS.email.defaultSubtitle,
      icon: 'email',
    };
  }

  if (/^tel:/i.test(raw)) {
    const phone = raw.replace(/^tel:/i, '');
    return {
      platformKey: 'phone',
      value: phone,
      cleanUrl: `tel:${phone}`,
      title: PLATFORMS.phone.defaultTitle(phone),
      subtitle: PLATFORMS.phone.defaultSubtitle,
      icon: 'phone',
    };
  }

  for (const [key, plat] of Object.entries(PLATFORMS)) {
    if (plat.parseUrl) {
      const parsed = plat.parseUrl(raw);
      if (parsed) {
        if (key === 'youtube' && typeof parsed === 'object') {
          return {
            platformKey: 'youtube',
            mode: parsed.mode,
            value: parsed.value,
            cleanUrl: plat.buildUrl(parsed.value, parsed.mode),
            title: plat.defaultTitle(parsed.value, parsed.mode),
            subtitle: plat.defaultSubtitle,
            icon: 'youtube',
          };
        }

        const username = typeof parsed === 'string' ? parsed : raw;
        const cleanUrl = plat.buildUrl ? plat.buildUrl(username) : ensureHttps(raw);
        return {
          platformKey: key,
          mode: plat.mode,
          value: username,
          cleanUrl,
          title: plat.defaultTitle(username),
          subtitle: plat.defaultSubtitle,
          icon: plat.icon || key,
        };
      }
    }
  }

  if (/^(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/i.test(raw)) {
    return {
      platformKey: 'globe',
      mode: 'url',
      value: ensureHttps(raw),
      cleanUrl: ensureHttps(raw),
      title: 'Visit Website',
      subtitle: 'Official link',
      icon: 'globe',
    };
  }

  return null;
}

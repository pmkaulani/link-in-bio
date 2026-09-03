// Pure functions extracted from PublicProfile.jsx so they can be unit
// tested without needing to render a React component. These are the
// functions that matter most for security/correctness on the public page.

const ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

export function safeHref(url) {
  if (!url) return '#';
  try {
    // Relative/protocol-less URLs (e.g. "example.com") are treated as https.
    const parsed = new URL(url, 'https://placeholder.invalid');
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}

export function formatSocialHref(platform, value) {
  if (!value || typeof value !== 'string') return '#';
  const trimmed = value.trim();
  if (!trimmed) return '#';

  const normPlatform = (platform || '').toLowerCase().trim();

  if (normPlatform === 'whatsapp') {
    // If already full WhatsApp URL with protocol
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(trimmed)) {
      return trimmed;
    }
    // If WhatsApp domain without protocol
    if (/^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    // Direct phone number: strip non-digits (e.g. +1 (555) 123-4567 -> 15551234567)
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits) {
      return `https://wa.me/${digits}`;
    }
    return '#';
  }

  if (normPlatform === 'phone' || normPlatform === 'tel') {
    if (trimmed.startsWith('tel:')) return trimmed;
    return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
  }

  if (normPlatform === 'email' || normPlatform === 'mailto') {
    if (trimmed.startsWith('mailto:')) return trimmed;
    return `mailto:${trimmed}`;
  }

  // If missing scheme but contains dot (e.g. "instagram.com/amelie"), prefix with https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return safeHref(`https://${trimmed}`);
  }

  return safeHref(trimmed);
}

export function safeColor(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function isWithinSchedule(data) {
  const now = Date.now();
  if (data?.start_date && now < new Date(data.start_date).getTime()) return false;
  if (data?.end_date) {
    const isFullDateTime = data.end_date.includes('T');
    const endTime = isFullDateTime
      ? new Date(data.end_date).getTime()
      : new Date(data.end_date).getTime() + 86400000 - 1;
    if (now > endTime) return false;
  }
  return true;
}

export function isLightColor(colorStr) {
  if (!colorStr) return true;
  const hex = colorStr.replace('#', '').trim();
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140;
  }
  return true;
}

export function isLightBackground(profile) {
  if (!profile) return true;
  const type = profile.background_type || 'solid';
  const val = (profile.background_value || '').toLowerCase();
  if (type === 'solid') {
    return isLightColor(val || '#F8FAFC');
  }
  if (type === 'gradient') {
    if (val.includes('#d8f3dc') || val.includes('#ffe5d9') || val.includes('#f3e8ff') || val.includes('#ede0d4') || val.includes('#fef08a') || val.includes('#f8fafc') || val.includes('#ffffff') || val.includes('#eff6ff') || val.includes('#faf5ff') || val.includes('#ecfdf5')) {
      return true;
    }
    return false;
  }
  return false;
}

export function resolvePageTextColor(profile) {
  const isLight = isLightBackground(profile);
  const userColor = profile?.text_color;
  if (!userColor) return isLight ? '#111827' : '#FFFFFF';

  // If user has white/light text on a light background, auto-differentiate to dark #111827
  if (isLight && (userColor.toLowerCase() === '#ffffff' || userColor.toLowerCase() === '#fff' || userColor.toLowerCase() === '#f8fafc')) {
    return '#111827';
  }
  // If user has black/dark text on a dark background, auto-differentiate to white #FFFFFF
  if (!isLight && (userColor.toLowerCase() === '#111827' || userColor.toLowerCase() === '#000000' || userColor.toLowerCase() === '#09090b' || userColor.toLowerCase() === '#111111')) {
    return '#FFFFFF';
  }
  return safeColor(userColor, isLight ? '#111827' : '#FFFFFF');
}

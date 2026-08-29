/**
 * Server-side & shared input validation and sanitization utilities.
 * Enforces OWASP guidelines for URL safety, SSRF prevention, string lengths,
 * color formats, and third-party embed allowlists.
 */

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:'];

const APPROVED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'spotify.com',
  'open.spotify.com',
  'soundcloud.com',
];

const PRIVATE_IP_PATTERNS = [
  /^127\./,                           // 127.0.0.0/8 (Loopback)
  /^10\./,                            // 10.0.0.0/8 (Private Network)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,   // 172.16.0.0/12 (Private Network)
  /^192\.168\./,                      // 192.168.0.0/16 (Private Network)
  /^169\.254\./,                      // 169.254.0.0/16 (Link-local / AWS metadata 169.254.169.254)
  /^0\./,                             // 0.0.0.0/8
  /^fc00:/i,                          // IPv6 Unique Local
  /^fe80:/i,                          // IPv6 Link-Local
  /^::1$/,                            // IPv6 Loopback
  /^localhost$/i,                     // Localhost string
];

/**
 * Validates whether a URL is well-formed, uses an allowed scheme, and doesn't exceed length limits.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.length > 2048) return '';

  const lower = trimmed.toLowerCase();
  for (const dangerous of DANGEROUS_SCHEMES) {
    if (lower.startsWith(dangerous)) return '';
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') ? trimmed : `https://${trimmed}`);
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * SSRF Protection: Checks whether a URL is safe for server-side fetching.
 * Disallows internal network IPs, AWS/GCP metadata endpoints, and non-HTTP(S) protocols.
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check against private IP regexes
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Disallow local domain suffixes
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that an embed URL is from an approved media provider (e.g. YouTube, Vimeo, Spotify).
 */
export function isApprovedEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    return APPROVED_EMBED_DOMAINS.some((allowed) => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

/**
 * Validates username syntax and length.
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const clean = username.toLowerCase().trim().replace(/^@/, '');
  if (clean.length < 3 || clean.length > 30) return false;
  return /^[a-z0-9_.-]+$/.test(clean);
}

/**
 * Validates color inputs (hex codes).
 */
export function sanitizeColor(color, fallback = '#000000') {
  if (typeof color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(color.trim())) {
    return color.trim();
  }
  return fallback;
}

/**
 * Validates block payloads based on block type.
 * Returns { valid: boolean, errors: string[], sanitized: object }
 */
export function validateBlockPayload(type, data = {}) {
  const errors = [];
  const sanitized = { ...data };

  switch (type) {
    case 'link': {
      if (typeof sanitized.title === 'string') {
        sanitized.title = sanitized.title.slice(0, 100).trim();
      }
      if (typeof sanitized.subtitle === 'string') {
        sanitized.subtitle = sanitized.subtitle.slice(0, 150).trim();
      }
      if (sanitized.url) {
        const safe = sanitizeUrl(sanitized.url);
        if (!safe && sanitized.url.trim().length > 0) {
          errors.push('Invalid link URL or unsupported protocol.');
        }
        sanitized.url = safe;
      }
      break;
    }

    case 'heading': {
      if (typeof sanitized.text === 'string') {
        sanitized.text = sanitized.text.slice(0, 120).trim();
      }
      if (!['sm', 'md', 'lg', 'xl'].includes(sanitized.size)) {
        sanitized.size = 'lg';
      }
      break;
    }

    case 'text': {
      if (typeof sanitized.text === 'string') {
        sanitized.text = sanitized.text.slice(0, 2000);
      }
      break;
    }

    case 'image': {
      if (sanitized.url) {
        const safe = sanitizeUrl(sanitized.url);
        sanitized.url = safe;
      }
      if (typeof sanitized.alt === 'string') {
        sanitized.alt = sanitized.alt.slice(0, 200).trim();
      }
      if (typeof sanitized.caption === 'string') {
        sanitized.caption = sanitized.caption.slice(0, 200).trim();
      }
      break;
    }

    case 'video': {
      if (sanitized.url) {
        if (!isApprovedEmbedUrl(sanitized.url)) {
          errors.push('Video URL must be from YouTube, Vimeo, or Spotify.');
        }
      }
      break;
    }

    case 'callout': {
      if (typeof sanitized.text === 'string') {
        sanitized.text = sanitized.text.slice(0, 300).trim();
      }
      break;
    }

    case 'spacer': {
      let height = parseInt(sanitized.height, 10);
      if (isNaN(height) || height < 8) height = 8;
      if (height > 128) height = 128;
      sanitized.height = height;
      break;
    }

    default:
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

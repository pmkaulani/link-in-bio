import { supabase, isLocalMode } from './supabase.js';

// Generate/reuse a persistent client token per browser for unique visitor detection
export function getClientToken() {
  try {
    let t = localStorage.getItem('client_token');
    if (!t) {
      t = 'usr_' + crypto.randomUUID();
      localStorage.setItem('client_token', t);
    }
    return t;
  } catch {
    return null;
  }
}

// Detect traffic source / referrer channel
export function detectReferrer() {
  if (typeof document === 'undefined') return 'direct';
  const ref = document.referrer.toLowerCase();
  if (!ref) return 'direct';
  if (ref.includes('instagram.com')) return 'instagram';
  if (ref.includes('tiktok.com')) return 'tiktok';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';
  if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'twitter';
  if (ref.includes('t.me') || ref.includes('telegram')) return 'telegram';
  if (ref.includes('google.')) return 'google';
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'youtube';
  if (ref.includes('facebook.com') || ref.includes('fb.me')) return 'facebook';
  if (ref.includes('linkedin.com')) return 'linkedin';
  return 'web';
}

// Detect client device category
export function detectDeviceType() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

async function dispatchAnalytics(payload) {
  // In local development sandbox mode, update local client directly
  if (isLocalMode) {
    try {
      await supabase.from('analytics_events').insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    return;
  }

  // In production / connected mode, send to dedicated server endpoint
  try {
    const jsonStr = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics failure should never break user page navigation
  }
}

export function logPageView(profileId) {
  if (!profileId) return;

  try {
    const key = `viewed:${profileId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // sessionStorage fallback
  }

  dispatchAnalytics({
    profile_id: profileId,
    event_type: 'view',
    client_token: getClientToken(),
    referrer: detectReferrer(),
    device_type: detectDeviceType(),
  });
}

export function logLinkClick(profileId, blockId) {
  if (!profileId || !blockId) return;

  dispatchAnalytics({
    profile_id: profileId,
    block_id: blockId,
    event_type: 'click',
    client_token: getClientToken(),
    referrer: detectReferrer(),
    device_type: detectDeviceType(),
  });
}

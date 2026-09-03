// lib/socialAccounts.js
// Entity-based social accounts manager supporting multiple accounts per platform,
// custom labels (Personal, Business, etc.), primary designation, and backward compatibility.

import { PLATFORMS, cleanUsername } from './platformGuide.js';

export function createAccountId() {
  return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normalizes profile data into a standard SocialAccount[] collection.
 * Supports:
 * 1. profile.social_accounts (Array)
 * 2. profile.socials._accounts (Array)
 * 3. Legacy profile.socials (Object with string URLs)
 */
export function normalizeSocialAccounts(profile = {}) {
  // 1. Direct social_accounts array
  if (Array.isArray(profile?.social_accounts)) {
    return cleanAccountList(profile.social_accounts);
  }

  // 2. Embedded in socials._accounts
  if (profile?.socials && Array.isArray(profile.socials._accounts)) {
    return cleanAccountList(profile.socials._accounts);
  }

  // 3. Fallback: migrate legacy socials key-value map
  const accounts = [];
  if (profile.socials && typeof profile.socials === 'object') {
    for (const [platform, rawVal] of Object.entries(profile.socials)) {
      if (platform.startsWith('_') || typeof rawVal !== 'string' || !rawVal.trim()) continue;

      const pCfg = PLATFORMS[platform] || {
        key: platform,
        label: platform,
        mode: 'url',
        buildUrl: (u) => u,
        parseUrl: (u) => u,
      };

      let username = '';
      if (pCfg.parseUrl) {
        const parsed = pCfg.parseUrl(rawVal);
        username = typeof parsed === 'string' ? parsed : (parsed?.value || rawVal);
      } else {
        username = rawVal.replace(/^https?:\/\/[^/]+\/?/i, '').replace(/^@/, '');
      }

      accounts.push({
        id: `legacy_${platform}`,
        platform,
        username: cleanUsername(username) || username,
        label: '',
        display_name: '',
        url: rawVal.trim(),
        is_primary: true,
      });
    }
  }

  return accounts;
}

function cleanAccountList(list) {
  return list
    .filter((acc) => acc && typeof acc === 'object' && acc.platform && (acc.username || acc.url))
    .map((acc, index) => {
      let username = (acc.username || '').trim().replace(/^@+/, '');
      if (!username && acc.url) {
        const pCfg = PLATFORMS[acc.platform];
        if (pCfg?.parseUrl) {
          const parsed = pCfg.parseUrl(acc.url);
          username = typeof parsed === 'string' ? parsed : (parsed?.value || '');
        }
      }
      return {
        id: acc.id || createAccountId(),
        platform: acc.platform,
        username: cleanUsername(username) || username,
        label: acc.label || '',
        display_name: acc.display_name || '',
        url: acc.url || '',
        is_primary: Boolean(acc.is_primary ?? (index === 0)),
        is_visible: acc.is_visible !== false,
        order: typeof acc.order === 'number' ? acc.order : index,
      };
    });
}

/**
 * Synchronizes an array of SocialAccounts with profile.socials to ensure
 * external consumers and legacy readers continue to see the primary account URL.
 */
export function syncSocialsWithAccounts(accounts = [], existingSocials = {}) {
  const synced = { ...existingSocials };

  // Preserve internal metadata keys (like _password_set, _active_sessions, _visible, etc.)
  const internalKeys = Object.keys(synced).filter((k) => k.startsWith('_'));
  const cleanSocials = {};
  for (const k of internalKeys) {
    cleanSocials[k] = synced[k];
  }

  // Save the full accounts array in _accounts for persistence
  cleanSocials._accounts = accounts;

  // For each platform, assign the primary visible account's URL to socials[platform]
  const platformGroups = groupAccountsByPlatform(accounts);
  for (const [platform, list] of Object.entries(platformGroups)) {
    const visibleList = list.filter((a) => a.is_visible !== false);
    const target = visibleList.find((a) => a.is_primary) || visibleList[0] || list.find((a) => a.is_primary) || list[0];
    if (target && target.url) {
      cleanSocials[platform] = target.url;
    }
  }

  return cleanSocials;
}

/**
 * Group accounts by platform key: { instagram: [acc1, acc2], youtube: [acc3] }
 */
export function groupAccountsByPlatform(accounts = [], options = {}) {
  const onlyVisible = options?.onlyVisible ?? false;
  const groups = {};
  for (const acc of accounts) {
    if (!acc.platform) continue;
    if (onlyVisible && acc.is_visible === false) continue;
    if (!groups[acc.platform]) {
      groups[acc.platform] = [];
    }
    groups[acc.platform].push(acc);
  }
  return groups;
}

/**
 * Formats a display handle for an account
 */
export function formatAccountDisplay(account) {
  if (!account) return '';
  const rawU = (account.username || '').trim().replace(/^@+/, '');
  const d = (account.display_name || '').trim();
  if (d && rawU) {
    return `${d} (@${rawU})`;
  }
  if (rawU) {
    return `@${rawU}`;
  }
  if (d) {
    return d;
  }
  if (account.url) {
    return account.url.replace(/^https?:\/\/(?:www\.)?/i, '').replace(/\/$/, '');
  }
  return '';
}

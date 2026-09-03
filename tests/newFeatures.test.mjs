import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSocialHref, safeHref } from '../lib/publicProfileUtils.js';
import { ICONS } from '../lib/icons.js';

test('WhatsApp and Social URL Formatting (formatSocialHref)', async (t) => {
  await t.test('formats raw WhatsApp phone numbers to wa.me links', () => {
    assert.equal(formatSocialHref('whatsapp', '+1 (555) 123-4567'), 'https://wa.me/15551234567');
    assert.equal(formatSocialHref('whatsapp', '08012345678'), 'https://wa.me/08012345678');
    assert.equal(formatSocialHref('whatsapp', '+44 7911 123456'), 'https://wa.me/447911123456');
  });

  await t.test('preserves existing full wa.me and whatsapp.com links', () => {
    assert.equal(formatSocialHref('whatsapp', 'https://wa.me/15551234567'), 'https://wa.me/15551234567');
    assert.equal(formatSocialHref('whatsapp', 'wa.me/15551234567'), 'https://wa.me/15551234567');
    assert.equal(formatSocialHref('whatsapp', 'https://chat.whatsapp.com/invite123'), 'https://chat.whatsapp.com/invite123');
  });

  await t.test('handles phone and email platforms', () => {
    assert.equal(formatSocialHref('phone', '+1 555 123 4567'), 'tel:+15551234567');
    assert.equal(formatSocialHref('tel', 'tel:+15551234567'), 'tel:+15551234567');
    assert.equal(formatSocialHref('email', 'creator@example.com'), 'mailto:creator@example.com');
    assert.equal(formatSocialHref('email', 'mailto:creator@example.com'), 'mailto:creator@example.com');
  });

  await t.test('handles protocol-less urls for generic socials', () => {
    assert.equal(formatSocialHref('snapchat', 'snapchat.com/add/amelie'), 'https://snapchat.com/add/amelie');
    assert.equal(formatSocialHref('instagram', 'instagram.com/amelie'), 'https://instagram.com/amelie');
  });
});

test('Icon Library Comprehensive App Support', async (t) => {
  const expectedPlatforms = [
    'snapchat',
    'pinterest',
    'reddit',
    'patreon',
    'applemusic',
    'soundcloud',
    'substack',
    'medium',
    'paypal',
    'cashapp',
    'venmo',
    'kick',
    'phone',
  ];

  for (const plat of expectedPlatforms) {
    await t.test(`contains configuration for ${plat}`, () => {
      assert.ok(ICONS[plat], `ICONS should contain config for ${plat}`);
      assert.ok(ICONS[plat].label, `${plat} should have a label`);
      assert.ok(ICONS[plat].color, `${plat} should have a brand color`);
    });
  }
});

test('Username Change Cooldown Logic (2 changes per 2 weeks)', async (t) => {
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  function evaluateChangeLimit(timestamps) {
    const recent = timestamps
      .map((ts) => Number(ts))
      .filter((ts) => !isNaN(ts) && now - ts < FOURTEEN_DAYS_MS)
      .sort((a, b) => a - b);

    if (recent.length >= 2) {
      return { allowed: false, remaining: 2 - recent.length };
    }
    return { allowed: true, remaining: 2 - recent.length };
  }

  await t.test('allows 1st and 2nd change within 14 days', () => {
    assert.equal(evaluateChangeLimit([]).allowed, true);
    assert.equal(evaluateChangeLimit([now - 100000]).allowed, true);
    assert.equal(evaluateChangeLimit([now - 100000]).remaining, 1);
  });

  await t.test('blocks 3rd change when 2 changes were made within 14 days', () => {
    const twoRecentChanges = [now - 2 * 24 * 60 * 60 * 1000, now - 5 * 24 * 60 * 60 * 1000];
    const result = evaluateChangeLimit(twoRecentChanges);
    assert.equal(result.allowed, false);
  });

  await t.test('allows changes after 14-day window expires', () => {
    const oldChanges = [now - 15 * 24 * 60 * 60 * 1000, now - 16 * 24 * 60 * 60 * 1000];
    const result = evaluateChangeLimit(oldChanges);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 2);
  });
});

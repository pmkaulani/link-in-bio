import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATFORMS,
  detectPlatformFromUrl,
  cleanUsername,
  ensureHttps,
} from '../lib/platformGuide.js';

test('Intelligent Platform Guide: URL Auto-Detection', async (t) => {
  await t.test('detects Instagram full URLs and extracts username', () => {
    const res = detectPlatformFromUrl('https://www.instagram.com/cristiano/');
    assert.ok(res);
    assert.equal(res.platformKey, 'instagram');
    assert.equal(res.value, 'cristiano');
    assert.equal(res.cleanUrl, 'https://instagram.com/cristiano');
  });

  await t.test('detects X (Twitter) URLs for both x.com and twitter.com', () => {
    const res1 = detectPlatformFromUrl('https://x.com/elonmusk');
    assert.ok(res1);
    assert.equal(res1.platformKey, 'twitter');
    assert.equal(res1.value, 'elonmusk');

    const res2 = detectPlatformFromUrl('https://twitter.com/elonmusk');
    assert.ok(res2);
    assert.equal(res2.platformKey, 'twitter');
    assert.equal(res2.value, 'elonmusk');
  });

  await t.test('detects TikTok profile links', () => {
    const res = detectPlatformFromUrl('https://www.tiktok.com/@mrbeast');
    assert.ok(res);
    assert.equal(res.platformKey, 'tiktok');
    assert.equal(res.value, 'mrbeast');
    assert.equal(res.cleanUrl, 'https://tiktok.com/@mrbeast');
  });

  await t.test('detects YouTube channels vs videos', () => {
    const chan = detectPlatformFromUrl('https://youtube.com/@mkbhd');
    assert.ok(chan);
    assert.equal(chan.platformKey, 'youtube');
    assert.equal(chan.mode, 'channel');
    assert.equal(chan.value, 'mkbhd');

    const vid = detectPlatformFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.ok(vid);
    assert.equal(vid.platformKey, 'youtube');
    assert.equal(vid.mode, 'video');

    const shortVid = detectPlatformFromUrl('https://youtu.be/dQw4w9WgXcQ');
    assert.ok(shortVid);
    assert.equal(shortVid.mode, 'video');
  });

  await t.test('detects Spotify links', () => {
    const res = detectPlatformFromUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
    assert.ok(res);
    assert.equal(res.platformKey, 'spotify');
  });

  await t.test('detects WhatsApp wa.me links', () => {
    const res = detectPlatformFromUrl('https://wa.me/254712345678');
    assert.ok(res);
    assert.equal(res.platformKey, 'whatsapp');
    assert.equal(res.value, '254712345678');
  });

  await t.test('detects GitHub and LinkedIn profiles', () => {
    const gh = detectPlatformFromUrl('https://github.com/torvalds');
    assert.ok(gh);
    assert.equal(gh.platformKey, 'github');
    assert.equal(gh.value, 'torvalds');

    const li = detectPlatformFromUrl('https://www.linkedin.com/in/satyanadella/');
    assert.ok(li);
    assert.equal(li.platformKey, 'linkedin');
    assert.equal(li.value, 'satyanadella');
  });

  await t.test('detects email and phone action protocols', () => {
    const mail = detectPlatformFromUrl('mailto:creator@example.com');
    assert.ok(mail);
    assert.equal(mail.platformKey, 'email');
    assert.equal(mail.value, 'creator@example.com');

    const tel = detectPlatformFromUrl('tel:+15551234567');
    assert.ok(tel);
    assert.equal(tel.platformKey, 'phone');
  });

  await t.test('detects Facebook, PayPal, Cash App, and Venmo', () => {
    const fb = detectPlatformFromUrl('https://facebook.com/zuck');
    assert.ok(fb);
    assert.equal(fb.platformKey, 'facebook');
    assert.equal(fb.value, 'zuck');

    const pp = detectPlatformFromUrl('https://paypal.me/creator');
    assert.ok(pp);
    assert.equal(pp.platformKey, 'paypal');
    assert.equal(pp.value, 'creator');

    const ca = detectPlatformFromUrl('https://cash.app/$cashtag');
    assert.ok(ca);
    assert.equal(ca.platformKey, 'cashapp');
    assert.equal(ca.value, 'cashtag');

    const vm = detectPlatformFromUrl('https://venmo.com/u/creatorhandle');
    assert.ok(vm);
    assert.equal(vm.platformKey, 'venmo');
    assert.equal(vm.value, 'creatorhandle');
  });

  await t.test('falls back gracefully to website for generic domains', () => {
    const site = detectPlatformFromUrl('portfolio.design/my-work');
    assert.ok(site);
    assert.equal(site.platformKey, 'globe');
    assert.equal(site.cleanUrl, 'https://portfolio.design/my-work');
  });
});

test('Intelligent Platform Guide: Clean Username & URL Builders', async (t) => {
  await t.test('cleanUsername removes leading @ and slashes', () => {
    assert.equal(cleanUsername('@cristiano'), 'cristiano');
    assert.equal(cleanUsername('@@@elonmusk'), 'elonmusk');
    assert.equal(cleanUsername('/torvalds/'), 'torvalds');
    assert.equal(cleanUsername('mrbeast?ref=share'), 'mrbeast');
  });

  await t.test('builds Instagram, TikTok, and X URLs cleanly', () => {
    assert.equal(PLATFORMS.instagram.buildUrl('cristiano'), 'https://instagram.com/cristiano');
    assert.equal(PLATFORMS.tiktok.buildUrl('@mrbeast'), 'https://tiktok.com/@mrbeast');
    assert.equal(PLATFORMS.twitter.buildUrl('@elonmusk'), 'https://x.com/elonmusk');
    assert.equal(PLATFORMS.github.buildUrl('torvalds'), 'https://github.com/torvalds');
  });

  await t.test('builds WhatsApp links with country codes', () => {
    assert.equal(PLATFORMS.whatsapp.buildUrl('712 345 678', '+254'), 'https://wa.me/254712345678');
    assert.equal(PLATFORMS.whatsapp.buildUrl('0712 345 678', '+254'), 'https://wa.me/254712345678');
    assert.equal(PLATFORMS.whatsapp.buildUrl('+1 (555) 123-4567', '+1'), 'https://wa.me/15551234567');
  });

  await t.test('ensureHttps prepends https if missing', () => {
    assert.equal(ensureHttps('example.com'), 'https://example.com');
    assert.equal(ensureHttps('https://example.com'), 'https://example.com');
    assert.equal(ensureHttps('http://example.com'), 'http://example.com');
  });
});

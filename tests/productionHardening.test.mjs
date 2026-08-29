import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeUrl,
  isSafeUrl,
  isApprovedEmbedUrl,
  validateUsername,
  sanitizeColor,
  validateBlockPayload,
} from '../lib/validation.js';

// ── URL Sanitization ─────────────────────────────────────────────────────────
describe('Production: URL Sanitization', () => {
  test('allows https URLs', () => {
    assert.ok(sanitizeUrl('https://example.com').length > 0);
  });

  test('allows http URLs', () => {
    assert.ok(sanitizeUrl('http://example.com').length > 0);
  });

  test('allows mailto URLs', () => {
    assert.ok(sanitizeUrl('mailto:test@example.com').length > 0);
  });

  test('allows tel URLs', () => {
    assert.ok(sanitizeUrl('tel:+1234567890').length > 0);
  });

  test('rejects javascript: scheme', () => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  });

  test('rejects JavaScript: (mixed case)', () => {
    assert.equal(sanitizeUrl('JavaScript:alert(1)'), '');
  });

  test('rejects data: scheme', () => {
    assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '');
  });

  test('rejects vbscript: scheme', () => {
    assert.equal(sanitizeUrl('vbscript:MsgBox("xss")'), '');
  });

  test('rejects file: scheme', () => {
    assert.equal(sanitizeUrl('file:///etc/passwd'), '');
  });

  test('rejects blob: scheme', () => {
    assert.equal(sanitizeUrl('blob:https://evil.com/uuid'), '');
  });

  test('rejects URLs over 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2100);
    assert.equal(sanitizeUrl(longUrl), '');
  });

  test('rejects empty / null / undefined', () => {
    assert.equal(sanitizeUrl(''), '');
    assert.equal(sanitizeUrl(null), '');
    assert.equal(sanitizeUrl(undefined), '');
  });
});

// ── SSRF Protection ──────────────────────────────────────────────────────────
describe('Production: SSRF Prevention', () => {
  test('blocks localhost', () => {
    assert.equal(isSafeUrl('http://localhost/admin'), false);
  });

  test('blocks 127.0.0.1', () => {
    assert.equal(isSafeUrl('http://127.0.0.1:8080/secret'), false);
  });

  test('blocks 10.x.x.x private range', () => {
    assert.equal(isSafeUrl('http://10.0.0.1/internal'), false);
  });

  test('blocks 172.16.x.x private range', () => {
    assert.equal(isSafeUrl('http://172.16.0.1/secret'), false);
  });

  test('blocks 192.168.x.x private range', () => {
    assert.equal(isSafeUrl('http://192.168.1.1/router'), false);
  });

  test('blocks AWS metadata endpoint (169.254.169.254)', () => {
    assert.equal(isSafeUrl('http://169.254.169.254/latest/meta-data/'), false);
  });

  test('blocks .local domains', () => {
    assert.equal(isSafeUrl('http://intranet.local/admin'), false);
  });

  test('blocks .internal domains', () => {
    assert.equal(isSafeUrl('http://db.internal:5432/'), false);
  });

  test('allows public external URLs', () => {
    assert.equal(isSafeUrl('https://example.com'), true);
    assert.equal(isSafeUrl('https://youtube.com/watch?v=abc'), true);
  });

  test('blocks non-http(s) schemes', () => {
    assert.equal(isSafeUrl('ftp://files.internal/data'), false);
    assert.equal(isSafeUrl('file:///etc/passwd'), false);
  });
});

// ── Embed Allowlist ──────────────────────────────────────────────────────────
describe('Production: Embed Provider Allowlist', () => {
  test('allows YouTube embed', () => {
    assert.equal(isApprovedEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), true);
  });

  test('allows YouTube no-cookie', () => {
    assert.equal(isApprovedEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), true);
  });

  test('allows Vimeo player', () => {
    assert.equal(isApprovedEmbedUrl('https://player.vimeo.com/video/12345'), true);
  });

  test('allows Spotify embed', () => {
    assert.equal(isApprovedEmbedUrl('https://open.spotify.com/embed/track/abc'), true);
  });

  test('rejects arbitrary domain embed', () => {
    assert.equal(isApprovedEmbedUrl('https://evil-phishing-site.com/fake-video'), false);
  });

  test('rejects localhost embed', () => {
    assert.equal(isApprovedEmbedUrl('http://localhost:3000/embed'), false);
  });
});

// ── Username Validation ──────────────────────────────────────────────────────
describe('Production: Username Validation', () => {
  test('accepts valid usernames', () => {
    assert.equal(validateUsername('alice'), true);
    assert.equal(validateUsername('user_123'), true);
    assert.equal(validateUsername('test.user'), true);
  });

  test('rejects short usernames (< 3 chars)', () => {
    assert.equal(validateUsername('ab'), false);
  });

  test('rejects long usernames (> 30 chars)', () => {
    assert.equal(validateUsername('a'.repeat(31)), false);
  });

  test('rejects empty / null / undefined', () => {
    assert.equal(validateUsername(''), false);
    assert.equal(validateUsername(null), false);
    assert.equal(validateUsername(undefined), false);
  });

  test('rejects usernames with special characters', () => {
    assert.equal(validateUsername('user<script>'), false);
    assert.equal(validateUsername('hello world'), false);
  });
});

// ── Color Sanitization ───────────────────────────────────────────────────────
describe('Production: Color Sanitization', () => {
  test('accepts valid hex colors', () => {
    assert.equal(sanitizeColor('#FF0000'), '#FF0000');
    assert.equal(sanitizeColor('#abc'), '#abc');
  });

  test('returns fallback for invalid inputs', () => {
    assert.equal(sanitizeColor('red'), '#000000');
    assert.equal(sanitizeColor('url(evil.com)'), '#000000');
    assert.equal(sanitizeColor('expression(alert(1))'), '#000000');
  });
});

// ── Block Payload Validation ─────────────────────────────────────────────────
describe('Production: Block Payload Validation', () => {
  test('validates link blocks with safe URLs', () => {
    const result = validateBlockPayload('link', {
      title: 'My Link',
      url: 'https://example.com',
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('rejects link blocks with dangerous URLs', () => {
    const result = validateBlockPayload('link', {
      title: 'Evil Link',
      url: 'javascript:alert(document.cookie)',
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  test('truncates overly long link titles', () => {
    const result = validateBlockPayload('link', {
      title: 'A'.repeat(200),
      url: 'https://example.com',
    });
    assert.equal(result.sanitized.title.length, 100);
  });

  test('validates heading block text limits', () => {
    const result = validateBlockPayload('heading', {
      text: 'H'.repeat(200),
      size: 'lg',
    });
    assert.equal(result.sanitized.text.length, 120);
  });

  test('validates video block against embed allowlist', () => {
    const good = validateBlockPayload('video', { url: 'https://www.youtube.com/embed/abc' });
    assert.equal(good.valid, true);

    const bad = validateBlockPayload('video', { url: 'https://evil.com/video' });
    assert.equal(bad.valid, false);
  });

  test('clamps spacer height within safe range', () => {
    const tooSmall = validateBlockPayload('spacer', { height: 2 });
    assert.equal(tooSmall.sanitized.height, 8);

    const tooLarge = validateBlockPayload('spacer', { height: 500 });
    assert.equal(tooLarge.sanitized.height, 128);
  });
});

// ── Publication Status Gating ────────────────────────────────────────────────
describe('Production: Publication Status Model', () => {
  test('schema.sql defines publication_status check constraint values', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    assert.ok(schema.includes("'draft'"), 'draft status must exist in schema');
    assert.ok(schema.includes("'published'"), 'published status must exist in schema');
    assert.ok(schema.includes("'unlisted'"), 'unlisted status must exist in schema');
    assert.ok(schema.includes("'suspended'"), 'suspended status must exist in schema');
    assert.ok(schema.includes('publication_status'), 'publication_status column must exist');
  });
});

// ── RLS Policy Verification ──────────────────────────────────────────────────
describe('Production: RLS Policy Hardening', () => {
  test('blocks select policy requires is_visible and published profile', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    // The old permissive "using (true)" must be removed for blocks
    assert.ok(!schema.includes('create policy "Public blocks are viewable by everyone"'),
      'Old permissive blocks select policy must not be created');
    assert.ok(schema.includes('is_visible = true'),
      'Blocks policy must check is_visible');
    assert.ok(schema.includes('is_disabled = false'),
      'Blocks policy must check is_disabled');
    assert.ok(schema.includes('p.publication_status'),
      'Blocks policy must check profile publication_status');
  });

  test('profiles select policy requires publication_status check', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    assert.ok(!schema.includes('create policy "Public profiles are viewable by everyone"'),
      'Old permissive profiles select policy must not be created');
    assert.ok(schema.includes('Profiles are selectable by owner or published'),
      'Profiles policy must use restricted select rule');
  });

  test('analytics_events has no open insert policy', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    assert.ok(!schema.includes('"Anyone can log an analytics event"'),
      'Open analytics insert policy must be removed');
  });

  test('custom_domains public select policy is removed', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    assert.ok(!schema.includes('"Verified domains are resolvable by the routing layer"'),
      'Public custom_domains select policy must be removed');
    assert.ok(schema.includes('resolve_custom_domain'),
      'Secure RPC function must exist for domain resolution');
  });

  test('analytics block ownership trigger exists', async () => {
    const fs = await import('node:fs');
    const schema = fs.readFileSync('supabase/schema.sql', 'utf8');

    assert.ok(schema.includes('check_analytics_block_ownership'),
      'Block ownership enforcement trigger must exist');
    assert.ok(schema.includes('block_id does not belong to profile_id'),
      'Trigger must raise block ownership error');
  });
});

// ── Security Headers ─────────────────────────────────────────────────────────
describe('Production: Security Headers Configuration', () => {
  test('next.config.js sets required security headers', async () => {
    const fs = await import('node:fs');
    const config = fs.readFileSync('next.config.js', 'utf8');

    assert.ok(config.includes('Content-Security-Policy'), 'CSP header must be configured');
    assert.ok(config.includes('Strict-Transport-Security'), 'HSTS header must be configured');
    assert.ok(config.includes('X-Content-Type-Options'), 'X-Content-Type-Options header must be configured');
    assert.ok(config.includes('X-Frame-Options'), 'X-Frame-Options header must be configured');
    assert.ok(config.includes('Referrer-Policy'), 'Referrer-Policy header must be configured');
    assert.ok(config.includes('Permissions-Policy'), 'Permissions-Policy header must be configured');
  });

  test('CSP blocks dangerous defaults', async () => {
    const fs = await import('node:fs');
    const config = fs.readFileSync('next.config.js', 'utf8');

    assert.ok(config.includes("frame-ancestors 'none'"), 'frame-ancestors must be none (clickjacking protection)');
    assert.ok(config.includes("object-src 'none'"), 'object-src must be none');
    assert.ok(config.includes("base-uri 'self'"), 'base-uri must be self');
  });

  test('frame-src only allows approved embed providers', async () => {
    const fs = await import('node:fs');
    const config = fs.readFileSync('next.config.js', 'utf8');

    assert.ok(config.includes('youtube.com'), 'frame-src must include YouTube');
    assert.ok(config.includes('vimeo.com'), 'frame-src must include Vimeo');
    assert.ok(config.includes('spotify.com'), 'frame-src must include Spotify');
  });
});

// ── Middleware Domain Resolution ─────────────────────────────────────────────
describe('Production: Middleware Custom Domain Security', () => {
  test('middleware uses RPC instead of direct table query', async () => {
    const fs = await import('node:fs');
    const middleware = fs.readFileSync('middleware.js', 'utf8');

    assert.ok(!middleware.includes('rest/v1/custom_domains'),
      'Middleware must NOT query custom_domains table directly');
    assert.ok(middleware.includes('resolve_custom_domain'),
      'Middleware must call secure RPC function');
  });

  test('middleware normalizes hostname', async () => {
    const fs = await import('node:fs');
    const middleware = fs.readFileSync('middleware.js', 'utf8');

    assert.ok(middleware.includes('.toLowerCase()'), 'Must normalize host to lowercase');
  });
});

// ── Analytics Ingestion Security ─────────────────────────────────────────────
describe('Production: Analytics Client-Side Dispatch', () => {
  test('analytics.js dispatches via /api/analytics endpoint (not direct table insert)', async () => {
    const fs = await import('node:fs');
    const analytics = fs.readFileSync('lib/analytics.js', 'utf8');

    assert.ok(analytics.includes('/api/analytics'),
      'Analytics events must be dispatched via server endpoint');
  });
});

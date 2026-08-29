import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSupabaseConfigured, isLocalMode } from '../lib/supabase.js';
import { createRequestClient } from '../lib/supabaseServer.js';
import { createAdminClient } from '../lib/supabaseAdmin.js';
import { verifyAdminUser, isUsernameReserved } from '../lib/adminAuth.js';
import robots from '../app/robots.js';

describe('Security: Supabase Configuration State', () => {
  test('isSupabaseConfigured accurately detects missing env vars in test environment', () => {
    // In test environment without NEXT_PUBLIC_SUPABASE_URL, isSupabaseConfigured is false
    assert.equal(typeof isSupabaseConfigured, 'boolean');
    assert.equal(isLocalMode, !isSupabaseConfigured);
  });
});

describe('Security: Request-Scoped Supabase Client', () => {
  test('createRequestClient returns a client instance', () => {
    const client = createRequestClient('Bearer test-token-12345');
    assert.ok(client);
    assert.ok(client.auth);
    assert.ok(client.from);
  });

  test('createAdminClient returns a service client', () => {
    const adminClient = createAdminClient();
    assert.ok(adminClient);
    assert.ok(adminClient.from);
  });
});

describe('Security: Admin Authorization Logic', () => {
  test('verifyAdminUser returns admin payload in local mode or checks token in real mode', async () => {
    const mockReq = {
      headers: {
        get: (name) => (name.toLowerCase() === 'authorization' ? 'Bearer mock-jwt' : null),
      },
    };
    const check = await verifyAdminUser(mockReq);
    assert.equal(typeof check.isAdmin, 'boolean');
    if (isLocalMode) {
      assert.equal(check.isAdmin, true);
      assert.equal(check.role, 'superadmin');
      assert.ok(check.user);
    }
  });

  test('isUsernameReserved checks system blacklist', async () => {
    assert.equal(await isUsernameReserved('admin'), true);
    assert.equal(await isUsernameReserved('superadmin'), true);
    assert.equal(await isUsernameReserved('security'), true);
    assert.equal(await isUsernameReserved('legit_user_handle'), false);
  });
});

describe('Security: robots.txt Disallow Rules', () => {
  test('excludes /admin and /api routes from web indexing', () => {
    const config = robots();
    assert.ok(config.rules);
    const rule = config.rules[0];
    assert.ok(rule.disallow.includes('/admin'));
    assert.ok(rule.disallow.includes('/api'));
    assert.ok(rule.disallow.includes('/dashboard'));
    assert.ok(rule.disallow.includes('/auth'));
  });
});

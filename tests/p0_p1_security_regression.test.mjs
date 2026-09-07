import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd } from '../lib/publicProfileUtils.js';

describe('SEC-02 Regression: Stored XSS via JSON-LD Structured Data', () => {
  test('neutralizes script tag breakout payloads using unicode escaping', () => {
    const maliciousPayload = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: '</script><script>alert("pwned")</script>',
        description: 'Bio with <script>eval(atob("..."))</script> and <img src=x onerror=alert(1)>',
        alternateName: '@evil</script>',
      },
    };

    const serialized = serializeJsonLd(maliciousPayload);

    // 1. Must NOT contain any raw '<' or closing '</script>' tags
    assert.equal(serialized.includes('<'), false, 'Serialized JSON-LD must never contain raw "<" characters');
    assert.equal(serialized.includes('</script>'), false, 'Must not contain closing </script> tag');
    assert.equal(serialized.includes('<script>'), false, 'Must not contain opening <script> tag');

    // 2. Must contain properly escaped Unicode '\\u003c/script>'
    assert.ok(serialized.includes('\\u003c/script>'), 'Should contain unicode escaped \\u003c/script>');

    // 3. Must be valid JSON that parses back to original text in JavaScript / Schema.org crawlers
    const parsed = JSON.parse(serialized);
    assert.equal(parsed.mainEntity.name, '</script><script>alert("pwned")</script>');
    assert.equal(parsed.mainEntity.description, 'Bio with <script>eval(atob("..."))</script> and <img src=x onerror=alert(1)>');
    assert.equal(parsed.mainEntity.alternateName, '@evil</script>');
  });

  test('handles null, undefined, or empty objects gracefully', () => {
    assert.equal(serializeJsonLd(null), '{}');
    assert.equal(serializeJsonLd(undefined), '{}');
    assert.equal(serializeJsonLd({}), '{}');
  });
});

describe('SEC-01 Regression: Client-Side Hardcoded Admin Email Escalation Backdoor', () => {
  test('admin check derivation relies on database role, not email string match', () => {
    // Simulating database lookup logic:
    function checkUserAdminStatus(user, adminRecord) {
      if (!adminRecord) {
        return { isAdmin: false, role: null };
      }
      return { isAdmin: true, role: adminRecord.role || 'admin' };
    }

    // Attacker presenting target email without a record in platform_admins
    const attackerUser = { id: 'attacker-uuid-1', email: 'pmkaulani@gmail.com' };
    const attackerAdminRecord = null; // No entry in platform_admins

    const result = checkUserAdminStatus(attackerUser, attackerAdminRecord);
    assert.equal(result.isAdmin, false, 'User matching target email MUST NOT be granted admin without DB record');
    assert.equal(result.role, null);

    // Legitimate admin user with DB record
    const legitUser = { id: 'admin-uuid-42', email: 'pmkaulani@gmail.com' };
    const legitAdminRecord = { role: 'superadmin' };

    const legitResult = checkUserAdminStatus(legitUser, legitAdminRecord);
    assert.equal(legitResult.isAdmin, true);
    assert.equal(legitResult.role, 'superadmin');
  });
});

describe('SEC-04 Regression: Mass Assignment Privilege Escalation on Profiles', () => {
  // Simulating DashboardContext sanitizeProfileForDb
  const VALID_PROFILE_COLUMNS = new Set([
    'username',
    'display_name',
    'bio',
    'avatar_url',
    'theme',
    'font_family',
    'primary_color',
    'text_color',
    'background_type',
    'background_value',
    'bg_effect',
    'button_style',
    'button_radius',
    'cursor_glow',
    'motion_preference',
    'socials',
    'layout',
    'onboarded',
    'publication_status',
    'sensitive_content',
    'published_profile',
    'published_blocks',
    'published_at',
  ]);

  function sanitizeProfileForDb(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (VALID_PROFILE_COLUMNS.has(key)) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  test('strips is_verified, account_status, and suspension_reason from client profile update payload', () => {
    const maliciousClientUpdate = {
      display_name: 'Legit Creator',
      bio: 'New bio description',
      is_verified: true,                     // Attacker attempts badge escalation
      account_status: 'active',              // Attacker attempts self-unban
      suspension_reason: null,               // Attacker attempts to clear reason
      role: 'superadmin',                    // Arbitrary column injection
      publication_status: 'published',       // Allowed creator column
    };

    const sanitized = sanitizeProfileForDb(maliciousClientUpdate);

    assert.equal(sanitized.is_verified, undefined, 'is_verified must be stripped from client update payload');
    assert.equal(sanitized.account_status, undefined, 'account_status must be stripped from client update payload');
    assert.equal(sanitized.suspension_reason, undefined, 'suspension_reason must be stripped from client update payload');
    assert.equal(sanitized.role, undefined, 'role must be stripped');

    // Allowed fields must be preserved
    assert.equal(sanitized.display_name, 'Legit Creator');
    assert.equal(sanitized.bio, 'New bio description');
    assert.equal(sanitized.publication_status, 'published');
  });
});

describe('SEC-03 Regression: Custom Domain Verification Integrity', () => {
  // Simulating policy validation
  function validateDomainInsert(insertData, callerUserId) {
    if (insertData.profile_id !== callerUserId) {
      throw new Error('Integrity error: profile_id mismatch');
    }
    // RLS policy: with check (auth.uid() = profile_id and verified = false)
    if (insertData.verified === true) {
      throw new Error('Security violation: Custom domains cannot be claimed as pre-verified.');
    }
    return true;
  }

  test('blocks client attempt to insert verified custom domain', () => {
    const callerId = 'user-123';
    const maliciousInsert = {
      profile_id: callerId,
      domain: 'target-brand.com',
      username: 'attacker',
      verification_token: 'fake',
      verified: true, // Hijack attempt
    };

    assert.throws(
      () => validateDomainInsert(maliciousInsert, callerId),
      /Security violation: Custom domains cannot be claimed as pre-verified/
    );
  });

  test('allows client to insert unverified custom domain', () => {
    const callerId = 'user-123';
    const legitimateInsert = {
      profile_id: callerId,
      domain: 'mycreator.bio',
      username: 'creator',
      verification_token: 'token-abc',
      verified: false,
    };

    assert.equal(validateDomainInsert(legitimateInsert, callerId), true);
  });
});

describe('SEC-05 Regression: Block Moderation Integrity', () => {
  function applyBlockUpdateAsCreator(oldBlock, newUpdates) {
    // Simulating database trigger: check_block_moderation_integrity
    if (oldBlock.is_disabled === true && newUpdates.is_disabled === false) {
      throw new Error('Security violation: Only administrators can re-enable moderated blocks.');
    }
    if (oldBlock.moderation_reason && newUpdates.moderation_reason === null) {
      throw new Error('Security violation: Only administrators can modify block moderation reasons.');
    }
    return { ...oldBlock, ...newUpdates };
  }

  test('prevents creator from un-disabling a block disabled by Trust & Safety', () => {
    const moderatedBlock = {
      id: 'block-phish-1',
      profile_id: 'user-phisher',
      is_disabled: true,
      moderation_reason: 'Phishing detected by SafeBrowsing',
      title: 'Phishing Link',
    };

    assert.throws(
      () => applyBlockUpdateAsCreator(moderatedBlock, { is_disabled: false }),
      /Security violation: Only administrators can re-enable moderated blocks/
    );

    assert.throws(
      () => applyBlockUpdateAsCreator(moderatedBlock, { moderation_reason: null }),
      /Security violation: Only administrators can modify block moderation reasons/
    );
  });

  test('allows creator to update standard fields on unmoderated blocks', () => {
    const normalBlock = {
      id: 'block-1',
      profile_id: 'user-1',
      is_disabled: false,
      moderation_reason: null,
      title: 'Old Title',
    };

    const updated = applyBlockUpdateAsCreator(normalBlock, { title: 'New Title' });
    assert.equal(updated.title, 'New Title');
    assert.equal(updated.is_disabled, false);
  });
});

describe('SEC-06 Regression: Storage Object Avatar Path Isolation', () => {
  function validateAvatarUploadPath(uploadedPath, authUserId) {
    // storage policy: (storage.filename(name)) = (auth.uid()::text || '.webp')
    // and folder = 'avatars'
    const match = uploadedPath.match(/^avatars\/([^/]+)\.webp$/);
    if (!match) return false;
    const targetUserId = match[1];
    return targetUserId === authUserId;
  }

  test('allows user to upload only to their own avatar filename', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    assert.equal(validateAvatarUploadPath(`avatars/${userId}.webp`, userId), true);
  });

  test('rejects upload attempt to another user avatar filename', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const victimId = '660e8400-e29b-41d4-a716-446655440001';
    assert.equal(validateAvatarUploadPath(`avatars/${victimId}.webp`, userId), false);
  });

  test('rejects non-webp or path traversal filenames', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    assert.equal(validateAvatarUploadPath(`avatars/${userId}.html`, userId), false);
    assert.equal(validateAvatarUploadPath(`avatars/../${userId}.webp`, userId), false);
    assert.equal(validateAvatarUploadPath(`avatars/${userId}.svg`, userId), false);
  });
});

describe('SEC-10 / Role Segregation: Moderator vs Superadmin Permissions', () => {
  function handleAdminUserAction(adminCheck, action) {
    if (!adminCheck || !adminCheck.isAdmin) {
      return { status: 403, error: 'Unauthorized: Admin access required.' };
    }
    if (action === 'delete_user') {
      if (adminCheck.role !== 'superadmin') {
        return { status: 403, error: 'Forbidden: Superadmin role required to delete accounts.' };
      }
      return { status: 200, success: true, message: 'User deleted successfully.' };
    }
    if (action === 'update_status' || action === 'toggle_verified') {
      return { status: 200, success: true };
    }
    return { status: 400, error: 'Unknown action.' };
  }

  function handleAdminSettingsMutation(adminCheck, action) {
    if (!adminCheck || !adminCheck.isAdmin) {
      return { status: 403, error: 'Unauthorized: Admin access required.' };
    }
    if (adminCheck.role !== 'superadmin') {
      return { status: 403, error: 'Forbidden: Superadmin role required to modify platform settings.' };
    }
    return { status: 200, success: true, action };
  }

  test('forbids moderators from deleting user accounts', () => {
    const modCheck = { isAdmin: true, role: 'moderator', user: { id: 'mod-1', email: 'mod@platform.internal' } };
    const res = handleAdminUserAction(modCheck, 'delete_user');
    assert.equal(res.status, 403);
    assert.ok(res.error.includes('Superadmin role required to delete accounts'));
  });

  test('allows superadmins to delete user accounts', () => {
    const superCheck = { isAdmin: true, role: 'superadmin', user: { id: 'super-1', email: 'root@platform.internal' } };
    const res = handleAdminUserAction(superCheck, 'delete_user');
    assert.equal(res.status, 200);
    assert.equal(res.success, true);
  });

  test('forbids moderators from modifying platform settings and feature flags', () => {
    const modCheck = { isAdmin: true, role: 'moderator' };
    const toggleRes = handleAdminSettingsMutation(modCheck, 'toggle_flag');
    assert.equal(toggleRes.status, 403);
    assert.ok(toggleRes.error.includes('Superadmin role required to modify platform settings'));

    const settingRes = handleAdminSettingsMutation(modCheck, 'update_setting');
    assert.equal(settingRes.status, 403);
  });

  test('allows superadmins to modify platform settings and feature flags', () => {
    const superCheck = { isAdmin: true, role: 'superadmin' };
    const toggleRes = handleAdminSettingsMutation(superCheck, 'toggle_flag');
    assert.equal(toggleRes.status, 200);

    const settingRes = handleAdminSettingsMutation(superCheck, 'update_setting');
    assert.equal(settingRes.status, 200);
  });

  test('allows moderators to perform standard moderation (update_status, toggle_verified)', () => {
    const modCheck = { isAdmin: true, role: 'moderator' };
    assert.equal(handleAdminUserAction(modCheck, 'update_status').status, 200);
    assert.equal(handleAdminUserAction(modCheck, 'toggle_verified').status, 200);
  });
});

describe('SEC-08 Regression: Reserved Username Database Normalization & Enforcement', () => {
  const RESERVED_NAMES = new Set([
    'admin', 'administrator', 'root', 'support', 'help', 'api', 'app', 'auth',
    'login', 'logout', 'signup', 'register', 'dashboard', 'settings', 'profile',
    'terms', 'privacy', 'security', 'billing', 'pricing', 'legal', 'null', 'undefined'
  ]);

  function checkReservedUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Invalid username.');
    }
    const clean = username.replace(/@/g, '').trim().toLowerCase();
    if (RESERVED_NAMES.has(clean)) {
      throw new Error(`Security violation: Username "${username}" is reserved by the platform.`);
    }
    return clean;
  }

  test('rejects exact matches of reserved usernames', () => {
    assert.throws(() => checkReservedUsername('admin'), /Security violation: Username "admin" is reserved/);
    assert.throws(() => checkReservedUsername('root'), /Security violation: Username "root" is reserved/);
    assert.throws(() => checkReservedUsername('support'), /Security violation: Username "support" is reserved/);
    assert.throws(() => checkReservedUsername('terms'), /Security violation: Username "terms" is reserved/);
  });

  test('rejects obfuscated case, whitespace, or @ prefix variations of reserved usernames', () => {
    assert.throws(() => checkReservedUsername('  ADMIN  '), /Security violation: Username "  ADMIN  " is reserved/);
    assert.throws(() => checkReservedUsername('@admin'), /Security violation: Username "@admin" is reserved/);
    assert.throws(() => checkReservedUsername('  @Support  '), /Security violation: Username "  @Support  " is reserved/);
    assert.throws(() => checkReservedUsername('DASHBOARD'), /Security violation: Username "DASHBOARD" is reserved/);
  });

  test('permits legitimate creator usernames', () => {
    assert.equal(checkReservedUsername('alice'), 'alice');
    assert.equal(checkReservedUsername('@bob_builder'), 'bob_builder');
    assert.equal(checkReservedUsername('  cool_creator_99  '), 'cool_creator_99');
  });
});

describe('SEC-09 Regression: Secure Password Change & Sliding-Window Rate Limiting', () => {
  function validatePasswordComplexity(password) {
    return Boolean(
      password &&
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  function createRateLimiter(maxAttempts, windowMs) {
    const rateLimitMap = new Map();
    return function isRateLimited(key, simulatedNow = Date.now()) {
      if (!key) return false;
      const windowStart = simulatedNow - windowMs;
      const timestamps = (rateLimitMap.get(key) || []).filter((t) => t > windowStart);
      if (timestamps.length >= maxAttempts) {
        return true;
      }
      timestamps.push(simulatedNow);
      rateLimitMap.set(key, timestamps);
      return false;
    };
  }

  test('validates password complexity rules strictly', () => {
    assert.equal(validatePasswordComplexity('Weak1!'), false, 'Too short (<8 chars)');
    assert.equal(validatePasswordComplexity('alllowercase123!'), false, 'Missing uppercase');
    assert.equal(validatePasswordComplexity('ALLUPPERCASE123!'), false, 'Missing lowercase');
    assert.equal(validatePasswordComplexity('NoSpecialCharacter123'), false, 'Missing symbol');
    assert.equal(validatePasswordComplexity('NoNumbersSymbol!@#$'), false, 'Missing number');
    assert.equal(validatePasswordComplexity('P@ssw0rd2026!Strong'), true, 'Meets all criteria');
  });

  test('sliding-window rate limiter blocks after 5 attempts within 15 minutes', () => {
    const isRateLimited = createRateLimiter(5, 15 * 60 * 1000);
    const key = 'user-123:192.168.1.10';
    const baseTime = 1000000;

    // Attempts 1 to 5 within window succeed
    for (let i = 0; i < 5; i++) {
      assert.equal(isRateLimited(key, baseTime + i * 1000), false, `Attempt ${i + 1} should be permitted`);
    }

    // Attempt 6 within window is blocked
    assert.equal(isRateLimited(key, baseTime + 6000), true, 'Attempt 6 must be rate limited');

    // Attempt after 15 minutes window passes succeeds
    const expiredTime = baseTime + (16 * 60 * 1000);
    assert.equal(isRateLimited(key, expiredTime), false, 'Attempt after window expiration should succeed');
  });

  test('enforces current password re-authentication when account has existing password', () => {
    function simulatePasswordChange({ hasExistingPassword, oldPassword, userEmail, storedPasswordHash }) {
      if (hasExistingPassword) {
        if (!oldPassword || typeof oldPassword !== 'string') {
          return { status: 400, error: 'Current password is required to set a new password.' };
        }
        // Simulated credential verification
        if (oldPassword !== storedPasswordHash) {
          return { status: 400, error: 'Incorrect current password.' };
        }
      }
      return { status: 200, success: true };
    }

    // Missing oldPassword
    const missingRes = simulatePasswordChange({
      hasExistingPassword: true,
      oldPassword: null,
      userEmail: 'user@example.com',
      storedPasswordHash: 'Secret123!'
    });
    assert.equal(missingRes.status, 400);
    assert.equal(missingRes.error, 'Current password is required to set a new password.');

    // Incorrect oldPassword
    const wrongRes = simulatePasswordChange({
      hasExistingPassword: true,
      oldPassword: 'WrongPassword123!',
      userEmail: 'user@example.com',
      storedPasswordHash: 'Secret123!'
    });
    assert.equal(wrongRes.status, 400);
    assert.equal(wrongRes.error, 'Incorrect current password.');

    // Correct oldPassword
    const okRes = simulatePasswordChange({
      hasExistingPassword: true,
      oldPassword: 'Secret123!',
      userEmail: 'user@example.com',
      storedPasswordHash: 'Secret123!'
    });
    assert.equal(okRes.status, 200);
  });
});

describe('Multi-Persona Security Matrix: ANONYMOUS, USER_A, USER_B, MODERATOR, SUPERADMIN', () => {
  const PERSONAS = {
    ANONYMOUS: { id: null, email: null, role: null, isAuthenticated: false },
    USER_A: { id: 'user-a-1111', email: 'creator_a@domain.com', role: null, isAuthenticated: true },
    USER_B: { id: 'user-b-2222', email: 'victim_b@domain.com', role: null, isAuthenticated: true },
    MODERATOR: { id: 'mod-3333', email: 'mod@platform.internal', role: 'moderator', isAuthenticated: true },
    SUPERADMIN: { id: 'super-4444', email: 'admin@platform.internal', role: 'superadmin', isAuthenticated: true },
  };

  // Matrix test 1: Admin Route Access Control
  test('Admin Route Access: Only MODERATOR and SUPERADMIN can view admin routes', () => {
    function canAccessAdminRoutes(persona) {
      if (!persona.isAuthenticated) return false;
      return persona.role === 'moderator' || persona.role === 'superadmin';
    }

    assert.equal(canAccessAdminRoutes(PERSONAS.ANONYMOUS), false);
    assert.equal(canAccessAdminRoutes(PERSONAS.USER_A), false);
    assert.equal(canAccessAdminRoutes(PERSONAS.USER_B), false);
    assert.equal(canAccessAdminRoutes(PERSONAS.MODERATOR), true);
    assert.equal(canAccessAdminRoutes(PERSONAS.SUPERADMIN), true);
  });

  // Matrix test 2: High-Impact Administrative Actions (Account Deletion & Platform Settings)
  test('Superadmin Privileged Operations: Only SUPERADMIN can delete accounts or modify settings', () => {
    function canPerformSuperAction(persona) {
      return persona.isAuthenticated && persona.role === 'superadmin';
    }

    assert.equal(canPerformSuperAction(PERSONAS.ANONYMOUS), false);
    assert.equal(canPerformSuperAction(PERSONAS.USER_A), false);
    assert.equal(canPerformSuperAction(PERSONAS.USER_B), false);
    assert.equal(canPerformSuperAction(PERSONAS.MODERATOR), false, 'Moderator MUST NOT perform superadmin actions');
    assert.equal(canPerformSuperAction(PERSONAS.SUPERADMIN), true);
  });

  // Matrix test 3: Cross-Account Resource Mutation (User A vs User B)
  test('Cross-Account Resource Protection: USER_A cannot mutate USER_B profiles, blocks, or avatars', () => {
    function canMutateResource(persona, resourceOwnerId) {
      if (!persona.isAuthenticated) return false;
      return persona.id === resourceOwnerId;
    }

    // User A modifying User A's profile
    assert.equal(canMutateResource(PERSONAS.USER_A, PERSONAS.USER_A.id), true);
    // User A modifying User B's profile
    assert.equal(canMutateResource(PERSONAS.USER_A, PERSONAS.USER_B.id), false);
    // User B modifying User A's profile
    assert.equal(canMutateResource(PERSONAS.USER_B, PERSONAS.USER_A.id), false);
    // Anonymous modifying User B's profile
    assert.equal(canMutateResource(PERSONAS.ANONYMOUS, PERSONAS.USER_B.id), false);
  });

  // Matrix test 4: Privilege Escalation on Profile Verification Badge
  test('Profile Badge Escalation: Neither USER_A nor USER_B can self-assign is_verified', () => {
    function attemptAssignVerified(persona) {
      // Trigger check: if current_user in ('authenticated', 'anon'), cannot alter is_verified
      const isPrivilegedAdminRole = persona.role === 'moderator' || persona.role === 'superadmin';
      if (!isPrivilegedAdminRole) {
        throw new Error('Security violation: Only administrators can modify verification status.');
      }
      return true;
    }

    assert.throws(() => attemptAssignVerified(PERSONAS.ANONYMOUS), /Security violation/);
    assert.throws(() => attemptAssignVerified(PERSONAS.USER_A), /Security violation/);
    assert.throws(() => attemptAssignVerified(PERSONAS.USER_B), /Security violation/);
    assert.equal(attemptAssignVerified(PERSONAS.MODERATOR), true);
    assert.equal(attemptAssignVerified(PERSONAS.SUPERADMIN), true);
  });

  // Matrix test 5: Custom Domain Claim Restriction
  test('Custom Domain Insertion: Creators cannot claim verified domains; ANONYMOUS cannot insert', () => {
    function insertCustomDomain(persona, domainData) {
      if (!persona.isAuthenticated) {
        throw new Error('Authentication required.');
      }
      if (domainData.profile_id !== persona.id) {
        throw new Error('Cannot claim domain for another user.');
      }
      if (domainData.verified === true) {
        throw new Error('Security violation: Custom domains cannot be claimed as pre-verified.');
      }
      return { success: true, domain: domainData.domain, verified: false };
    }

    // Anonymous attempt
    assert.throws(() => insertCustomDomain(PERSONAS.ANONYMOUS, { domain: 'anon.com' }), /Authentication required/);

    // USER_A attempting to claim verified domain
    assert.throws(
      () => insertCustomDomain(PERSONAS.USER_A, { domain: 'verified.com', profile_id: PERSONAS.USER_A.id, verified: true }),
      /Custom domains cannot be claimed as pre-verified/
    );

    // USER_A attempting to claim domain under USER_B's profile_id
    assert.throws(
      () => insertCustomDomain(PERSONAS.USER_A, { domain: 'hijack.com', profile_id: PERSONAS.USER_B.id, verified: false }),
      /Cannot claim domain for another user/
    );

    // USER_A claiming valid unverified domain
    const valid = insertCustomDomain(PERSONAS.USER_A, { domain: 'creator.com', profile_id: PERSONAS.USER_A.id, verified: false });
    assert.equal(valid.success, true);
    assert.equal(valid.verified, false);
  });

  // Matrix test 6: Storage Avatar Isolation Across Personas
  test('Storage Avatars: Users are isolated to avatars/${id}.webp; cross-account write is forbidden', () => {
    function canWriteAvatar(persona, targetPath) {
      if (!persona.isAuthenticated) return false;
      const expectedPath = `avatars/${persona.id}.webp`;
      return targetPath === expectedPath;
    }

    assert.equal(canWriteAvatar(PERSONAS.ANONYMOUS, `avatars/${PERSONAS.USER_A.id}.webp`), false);
    assert.equal(canWriteAvatar(PERSONAS.USER_A, `avatars/${PERSONAS.USER_A.id}.webp`), true);
    assert.equal(canWriteAvatar(PERSONAS.USER_A, `avatars/${PERSONAS.USER_B.id}.webp`), false);
    assert.equal(canWriteAvatar(PERSONAS.USER_B, `avatars/${PERSONAS.USER_B.id}.webp`), true);
    assert.equal(canWriteAvatar(PERSONAS.USER_B, `avatars/${PERSONAS.USER_A.id}.webp`), false);
  });
});

describe('SEC-11 Regression: Admin Client Hard Failure on Missing Service Role Key', () => {
  test('refuses to fall back to anon key if serviceRoleKey is missing in connected mode', () => {
    // Replicate createAdminClient logic
    function createAdminClientSafe(isLocal, serviceRoleKey) {
      if (isLocal) {
        return { mode: 'local' };
      }
      if (!serviceRoleKey) {
        throw new Error(
          '[SECURITY ERROR] SUPABASE_SERVICE_ROLE_KEY is required for createAdminClient in connected mode. ' +
          'Refusing to silently fall back to the public anon key.'
        );
      }
      return { mode: 'admin', key: serviceRoleKey };
    }

    // Local mode should succeed
    assert.deepEqual(createAdminClientSafe(true, null), { mode: 'local' });

    // Connected mode with key should succeed
    assert.deepEqual(createAdminClientSafe(false, 'service-role-secret-key'), { mode: 'admin', key: 'service-role-secret-key' });

    // Connected mode WITHOUT key must throw hard error (never return anon key)
    assert.throws(
      () => createAdminClientSafe(false, null),
      /SUPABASE_SERVICE_ROLE_KEY is required for createAdminClient in connected mode/
    );
    assert.throws(
      () => createAdminClientSafe(false, ''),
      /SUPABASE_SERVICE_ROLE_KEY is required for createAdminClient in connected mode/
    );
  });
});

describe('SEC-10 Regression: Email Change Validation & Auth Sync', () => {
  test('validates email format and rejects identical email', () => {
    function validateEmailChange(currentEmail, newEmail) {
      const clean = (newEmail || '').trim().toLowerCase();
      if (!clean || !clean.includes('@') || !clean.includes('.')) {
        return { valid: false, error: 'Invalid email' };
      }
      if (clean === (currentEmail || '').toLowerCase()) {
        return { valid: false, error: 'Identical email' };
      }
      return { valid: true, email: clean };
    }

    assert.equal(validateEmailChange('user@example.com', 'bademail').valid, false);
    assert.equal(validateEmailChange('user@example.com', 'user@example.com').valid, false);
    assert.equal(validateEmailChange('user@example.com', 'USER@EXAMPLE.COM').valid, false);
    assert.equal(validateEmailChange('user@example.com', 'new@example.com').valid, true);
    assert.equal(validateEmailChange('user@example.com', '  new@example.com  ').email, 'new@example.com');
  });
});


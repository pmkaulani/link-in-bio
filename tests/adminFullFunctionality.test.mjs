import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalSupabaseClient } from '../lib/localDatabase.js';

test('Superadmin Full Functional Test Suite', async (t) => {
  const supabase = createLocalSupabaseClient();

  await t.test('1. User management actions (Status update & Verification)', async () => {
    // Suspend user
    const { data: suspended, error: err1 } = await supabase
      .from('profiles')
      .update({ account_status: 'suspended', suspension_reason: 'Automated policy violation' })
      .eq('id', 'scam-account-id')
      .select()
      .single();

    assert.equal(err1, null);
    assert.equal(suspended.account_status, 'suspended');
    assert.equal(suspended.suspension_reason, 'Automated policy violation');

    // Toggle verification on
    const { data: verified, error: err2 } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', 'local-test-id')
      .select()
      .single();

    assert.equal(err2, null);
    assert.equal(verified.is_verified, true);
  });

  await t.test('2. Link moderation actions (Disable / Enable link block)', async () => {
    // Disable block
    const { data: disabled, error: err1 } = await supabase
      .from('blocks')
      .update({ is_disabled: true, moderation_reason: 'Phishing domain detected' })
      .eq('id', 'block-scam-1')
      .select()
      .single();

    assert.equal(err1, null);
    assert.equal(disabled.is_disabled, true);
    assert.equal(disabled.moderation_reason, 'Phishing domain detected');

    // Re-enable block
    const { data: reenabled, error: err2 } = await supabase
      .from('blocks')
      .update({ is_disabled: false, moderation_reason: null })
      .eq('id', 'block-scam-1')
      .select()
      .single();

    assert.equal(err2, null);
    assert.equal(reenabled.is_disabled, false);
    assert.equal(reenabled.moderation_reason, null);
  });

  await t.test('3. Trust & Safety Reports (Resolve & Dismiss report)', async () => {
    // Resolve report
    const { data: resolved, error: err1 } = await supabase
      .from('reports')
      .update({ status: 'resolved', resolution_note: 'Offending URL removed' })
      .eq('id', 'rep-1')
      .select()
      .single();

    assert.equal(err1, null);
    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.resolution_note, 'Offending URL removed');
  });

  await t.test('4. Platform Settings & Feature Flags (Toggle flags & Reserve handles)', async () => {
    // Toggle flag
    const { data: flag, error: err1 } = await supabase
      .from('feature_flags')
      .update({ enabled: false })
      .eq('name', 'user_registration')
      .select()
      .single();

    assert.equal(err1, null);
    assert.equal(flag.enabled, false);

    // Add reserved username
    const { data: reserved, error: err2 } = await supabase
      .from('reserved_usernames')
      .insert({ username: 'compliance_test', reason: 'Legal protection' })
      .select()
      .single();

    assert.equal(err2, null);
    assert.equal(reserved.username, 'compliance_test');

    // Delete reserved username
    const { error: err3 } = await supabase
      .from('reserved_usernames')
      .delete()
      .eq('username', 'compliance_test');

    assert.equal(err3, null);
  });

  await t.test('5. Admin Audit Logging', async () => {
    const { data: auditLog, error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: 'local-test-id',
        admin_email: 'admin@linkinbio.local',
        action: 'system_health_check',
        target_type: 'system',
        target_id: 'platform',
        metadata: { status: 'healthy' },
      })
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(auditLog.action, 'system_health_check');
  });
});

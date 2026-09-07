import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSocialAccounts,
  syncSocialsWithAccounts,
  groupAccountsByPlatform,
  formatAccountDisplay,
  createAccountId,
  getBalancedSocialRows,
} from '../lib/socialAccounts.js';

test('Social Accounts Collection: Normalization & Migration', async (t) => {
  await t.test('migrates legacy flat socials object into structured account entities', () => {
    const legacyProfile = {
      socials: {
        instagram: 'https://instagram.com/ameliepoulain',
        youtube: 'https://youtube.com/@ameliefilms',
        _password_set: true,
        _active_sessions: ['sess_1'],
      },
    };

    const accounts = normalizeSocialAccounts(legacyProfile);
    assert.equal(accounts.length, 2);

    const ig = accounts.find((a) => a.platform === 'instagram');
    assert.ok(ig);
    assert.equal(ig.username, 'ameliepoulain');
    assert.equal(ig.url, 'https://instagram.com/ameliepoulain');
    assert.equal(ig.is_primary, true);

    const yt = accounts.find((a) => a.platform === 'youtube');
    assert.ok(yt);
    assert.equal(yt.username, 'ameliefilms');
    assert.equal(yt.url, 'https://youtube.com/@ameliefilms');
    assert.equal(yt.is_primary, true);
  });

  await t.test('reads from profile.social_accounts if present', () => {
    const profile = {
      social_accounts: [
        {
          id: 'acc_1',
          platform: 'instagram',
          username: 'ameliepoulain',
          label: 'Personal',
          display_name: 'Amélie',
          url: 'https://instagram.com/ameliepoulain',
          is_primary: true,
        },
        {
          id: 'acc_2',
          platform: 'instagram',
          username: 'ameliephotos',
          label: 'Photography',
          display_name: 'Amélie Photography',
          url: 'https://instagram.com/ameliephotos',
          is_primary: false,
        },
      ],
    };

    const accounts = normalizeSocialAccounts(profile);
    assert.equal(accounts.length, 2);
    assert.equal(accounts[0].label, 'Personal');
    assert.equal(accounts[1].label, 'Photography');
  });
});

test('Social Accounts: Multiple Accounts on Same Platform & Grouping', async (t) => {
  await t.test('groupAccountsByPlatform aggregates multiple accounts per platform', () => {
    const accounts = [
      { id: '1', platform: 'instagram', username: 'ameliepoulain', label: 'Personal', is_primary: true },
      { id: '2', platform: 'instagram', username: 'ameliephotos', label: 'Photography', is_primary: false },
      { id: '3', platform: 'instagram', username: 'amelie.biz', label: 'Business', is_primary: false },
      { id: '4', platform: 'tiktok', username: 'amelie_tok', label: 'Main', is_primary: true },
    ];

    const grouped = groupAccountsByPlatform(accounts);
    assert.equal(Object.keys(grouped).length, 2);
    assert.equal(grouped.instagram.length, 3);
    assert.equal(grouped.tiktok.length, 1);
  });
});

test('Social Accounts: Primary Account Syncing & Metadata Preservation', async (t) => {
  await t.test('syncSocialsWithAccounts maps primary URL to socials[platform] while preserving internal keys', () => {
    const existingSocials = {
      _password_set: true,
      _handle_changed_at: '2026-09-01T00:00:00Z',
      _active_sessions: ['sess_abc'],
      instagram: 'https://instagram.com/old',
    };

    const accounts = [
      {
        id: 'acc_personal',
        platform: 'instagram',
        username: 'ameliepoulain',
        label: 'Personal',
        url: 'https://instagram.com/ameliepoulain',
        is_primary: false,
      },
      {
        id: 'acc_photography',
        platform: 'instagram',
        username: 'ameliephotos',
        label: 'Photography',
        url: 'https://instagram.com/ameliephotos',
        is_primary: true, // Photography is primary
      },
    ];

    const synced = syncSocialsWithAccounts(accounts, existingSocials);

    // Primary account URL should be assigned to socials.instagram
    assert.equal(synced.instagram, 'https://instagram.com/ameliephotos');

    // Internal metadata must be completely preserved
    assert.equal(synced._password_set, true);
    assert.equal(synced._handle_changed_at, '2026-09-01T00:00:00Z');
    assert.deepEqual(synced._active_sessions, ['sess_abc']);

    // Full accounts collection must be saved in _accounts
    assert.equal(synced._accounts.length, 2);
  });
});

test('Social Accounts: formatAccountDisplay', async (t) => {
  await t.test('formats display name and handle properly', () => {
    assert.equal(
      formatAccountDisplay({ display_name: 'Amélie Films', username: 'ameliefilms' }),
      'Amélie Films (@ameliefilms)'
    );
    assert.equal(
      formatAccountDisplay({ username: 'ameliepoulain' }),
      '@ameliepoulain'
    );
    assert.equal(
      formatAccountDisplay({ display_name: 'Amélie Studio' }),
      'Amélie Studio'
    );
  });
});

test('Social Accounts: getBalancedSocialRows Row Balancing', async (t) => {
  await t.test('returns empty array for empty or falsy input', () => {
    assert.deepEqual(getBalancedSocialRows([]), []);
    assert.deepEqual(getBalancedSocialRows(null), []);
  });

  await t.test('keeps up to 5 items in a single row', () => {
    const items3 = ['a', 'b', 'c'];
    assert.deepEqual(getBalancedSocialRows(items3), [['a', 'b', 'c']]);

    const items5 = ['a', 'b', 'c', 'd', 'e'];
    assert.deepEqual(getBalancedSocialRows(items5), [['a', 'b', 'c', 'd', 'e']]);
  });

  await t.test('balances 6 items into 2 rows of 3', () => {
    const items = ['1', '2', '3', '4', '5', '6'];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], ['1', '2', '3']);
    assert.deepEqual(rows[1], ['4', '5', '6']);
  });

  await t.test('balances 7 items into rows of 4 and 3 (preventing orphan 1-item row)', () => {
    const items = ['github', 'tiktok', 'spotify', 'x', 'youtube', 'instagram', 'whatsapp'];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], ['github', 'tiktok', 'spotify', 'x']);
    assert.deepEqual(rows[1], ['youtube', 'instagram', 'whatsapp']);
  });

  await t.test('balances 8 items into 2 rows of 4', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [1, 2, 3, 4]);
    assert.deepEqual(rows[1], [5, 6, 7, 8]);
  });

  await t.test('balances 9 items into rows of 5 and 4', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [1, 2, 3, 4, 5]);
    assert.deepEqual(rows[1], [6, 7, 8, 9]);
  });

  await t.test('balances 10 items into 2 rows of 5', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [1, 2, 3, 4, 5]);
    assert.deepEqual(rows[1], [6, 7, 8, 9, 10]);
  });

  await t.test('balances 11 items into 3 rows (4, 4, 3)', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const rows = getBalancedSocialRows(items);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], [1, 2, 3, 4]);
    assert.deepEqual(rows[1], [5, 6, 7, 8]);
    assert.deepEqual(rows[2], [9, 10, 11]);
  });
});


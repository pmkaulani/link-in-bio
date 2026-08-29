import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { safeHref, safeColor, isWithinSchedule } from '../lib/publicProfileUtils.js';

describe('Admin & Safety: Safe URL verification', () => {
  test('allows safe external destination URLs', () => {
    assert.equal(safeHref('https://youtube.com/channel'), 'https://youtube.com/channel');
    assert.equal(safeHref('https://instagram.com/creator'), 'https://instagram.com/creator');
    assert.equal(safeHref('https://wa.me/254700000000'), 'https://wa.me/254700000000');
  });

  test('neutralizes dangerous javascript schemes', () => {
    assert.equal(safeHref('javascript:alert(document.cookie)'), '#');
    assert.equal(safeHref('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), '#');
  });
});

describe('Reserved Usernames Verification', () => {
  const RESERVED_LIST = [
    'admin', 'administrator', 'superadmin', 'support', 'help',
    'security', 'official', 'linkinbio', 'linkinbio_support', 'api', 'auth',
  ];

  function isReserved(name) {
    if (!name) return false;
    const clean = name.toLowerCase().trim().replace(/^@/, '');
    return RESERVED_LIST.includes(clean);
  }

  test('identifies reserved system administrative usernames', () => {
    assert.equal(isReserved('admin'), true);
    assert.equal(isReserved('ADMIN'), true);
    assert.equal(isReserved('@security'), true);
    assert.equal(isReserved('support'), true);
    assert.equal(isReserved('linkinbio'), true);
  });

  test('allows normal creator handles', () => {
    assert.equal(isReserved('peter'), false);
    assert.equal(isReserved('sarah_designs'), false);
    assert.equal(isReserved('kenya_tech_lead'), false);
  });
});

describe('Trust & Safety Report Priority Classifier', () => {
  function classifyPriority(reason) {
    const r = (reason || '').toLowerCase();
    if (r.includes('phishing') || r.includes('scam') || r.includes('dangerous') || r.includes('fraud')) {
      return 'urgent';
    }
    if (r.includes('harassment') || r.includes('impersonation') || r.includes('hate')) {
      return 'high';
    }
    return 'normal';
  }

  test('classifies phishing and scams as urgent', () => {
    assert.equal(classifyPriority('Spam, Phishing, or Scam'), 'urgent');
    assert.equal(classifyPriority('Harmful or Dangerous'), 'urgent');
  });

  test('classifies impersonation and harassment as high priority', () => {
    assert.equal(classifyPriority('Impersonation or Fake'), 'high');
    assert.equal(classifyPriority('Harassment or Hate'), 'high');
  });

  test('classifies standard policy issues as normal priority', () => {
    assert.equal(classifyPriority('Copyright or Trademark'), 'normal');
    assert.equal(classifyPriority('Other Safety Issue'), 'normal');
  });
});

describe('Block Visibility & Disabled State Moderation', () => {
  function isBlockDisplayable(block) {
    if (!block) return false;
    if (block.is_visible === false) return false;
    if (block.is_disabled === true) return false; // Moderated by Trust & Safety
    return isWithinSchedule(block.data);
  }

  test('hides disabled/moderated blocks even if is_visible is true', () => {
    const block = { is_visible: true, is_disabled: true, data: { title: 'Bad Link' } };
    assert.equal(isBlockDisplayable(block), false);
  });

  test('displays active unmoderated blocks', () => {
    const block = { is_visible: true, is_disabled: false, data: { title: 'Good Link' } };
    assert.equal(isBlockDisplayable(block), true);
  });
});

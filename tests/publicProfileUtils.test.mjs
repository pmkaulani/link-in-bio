import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { safeHref, safeColor, isWithinSchedule, resolvePageTextColor } from '../lib/publicProfileUtils.js';

describe('safeHref (XSS prevention on link/social URLs)', () => {
  test('allows http and https URLs', () => {
    assert.equal(safeHref('https://instagram.com/me'), 'https://instagram.com/me');
    assert.equal(safeHref('http://example.com'), 'http://example.com');
  });

  test('allows mailto and tel', () => {
    assert.equal(safeHref('mailto:me@example.com'), 'mailto:me@example.com');
    assert.equal(safeHref('tel:+15551234567'), 'tel:+15551234567');
  });

  test('treats a protocol-less domain as https and allows it', () => {
    assert.equal(safeHref('example.com'), 'example.com');
  });

  test('blocks javascript: URLs — the stored-XSS case this exists for', () => {
    assert.equal(safeHref('javascript:alert(1)'), '#');
    assert.equal(safeHref('JaVaScRiPt:alert(1)'), '#'); // case-insensitive scheme
  });

  test('blocks data: URLs', () => {
    assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), '#');
  });

  test('blocks vbscript: and file: URLs', () => {
    assert.equal(safeHref('vbscript:msgbox(1)'), '#');
    assert.equal(safeHref('file:///etc/passwd'), '#');
  });

  test('returns # for empty/missing input', () => {
    assert.equal(safeHref(''), '#');
    assert.equal(safeHref(null), '#');
    assert.equal(safeHref(undefined), '#');
  });

  test('does not throw on garbage input', () => {
    assert.doesNotThrow(() => safeHref('not a url at all ://'));
  });
});

describe('safeColor', () => {
  test('accepts valid 6-digit hex colors', () => {
    assert.equal(safeColor('#7c3aed', '#000000'), '#7c3aed');
    assert.equal(safeColor('#FFFFFF', '#000000'), '#FFFFFF');
  });

  test('falls back for invalid or non-hex values', () => {
    assert.equal(safeColor('red', '#000000'), '#000000');
    assert.equal(safeColor('#fff', '#000000'), '#000000'); // 3-digit shorthand not accepted
    assert.equal(safeColor('javascript:alert(1)', '#000000'), '#000000');
    assert.equal(safeColor(null, '#000000'), '#000000');
    assert.equal(safeColor(undefined, '#000000'), '#000000');
  });
});

describe('isWithinSchedule', () => {
  test('visible when no schedule is set', () => {
    assert.equal(isWithinSchedule({}), true);
    assert.equal(isWithinSchedule(undefined), true);
  });

  test('hidden before start_date', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    assert.equal(isWithinSchedule({ start_date: future }), false);
  });

  test('visible after start_date has passed', () => {
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    assert.equal(isWithinSchedule({ start_date: past }), true);
  });

  test('visible on end_date itself (inclusive through end of day)', () => {
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(isWithinSchedule({ end_date: today }), true);
  });

  test('hidden the day after end_date', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    assert.equal(isWithinSchedule({ end_date: yesterday }), false);
  });

  test('visible within a start/end window', () => {
    const start = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    assert.equal(isWithinSchedule({ start_date: start, end_date: end }), true);
  });

  test('supports exact datetime-local strings (start in future)', () => {
    const futureDate = new Date(Date.now() + 3600000);
    const future = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    assert.equal(isWithinSchedule({ start_date: future }), false);
  });

  test('supports exact datetime-local strings (end in past)', () => {
    const pastDate = new Date(Date.now() - 3600000);
    const past = new Date(pastDate.getTime() - pastDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    assert.equal(isWithinSchedule({ end_date: past }), false);
  });

  test('supports exact datetime-local strings (currently active window)', () => {
    const startDate = new Date(Date.now() - 3600000);
    const endDate = new Date(Date.now() + 3600000);
    const start = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const end = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    assert.equal(isWithinSchedule({ start_date: start, end_date: end }), true);
  });
});

describe('resolvePageTextColor', () => {
  test('returns dark text on light solid background even if text_color is set to white', () => {
    assert.equal(resolvePageTextColor({ background_type: 'solid', background_value: '#F8FAFC', text_color: '#FFFFFF' }), '#111827');
    assert.equal(resolvePageTextColor({ background_type: 'solid', background_value: '#FFFFFF', text_color: '#FFFFFF' }), '#111827');
  });

  test('returns light text on dark background even if text_color is set to dark', () => {
    assert.equal(resolvePageTextColor({ background_type: 'solid', background_value: '#09090B', text_color: '#111827' }), '#FFFFFF');
    assert.equal(resolvePageTextColor({ background_type: 'gradient', background_value: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #7C3AED 100%)', text_color: '#111827' }), '#FFFFFF');
  });

  test('preserves user custom colored text if already contrast-safe', () => {
    assert.equal(resolvePageTextColor({ background_type: 'solid', background_value: '#FFFFFF', text_color: '#4338CA' }), '#4338CA');
  });
});

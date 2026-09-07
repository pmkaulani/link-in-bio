import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getQuestStatus, questProgress, QUEST_DEFS } from '../lib/quests.js';

const emptyProfile = { primary_color: '#000000', background_value: '#FFFFFF', bg_effect: 'none' };
const linkBlock = (url = 'https://example.com') => ({ type: 'link', data: { url } });

describe('getQuestStatus', () => {
  test('nothing done for a brand new account', () => {
    const quests = getQuestStatus({ profile: emptyProfile, blocks: [], flags: {} });
    assert.equal(quests.every((q) => !q.done), true);
    assert.equal(quests.length, QUEST_DEFS.length);
  });

  test('first_link completes only once a link block has a url', () => {
    const withEmptyLink = getQuestStatus({ profile: emptyProfile, blocks: [{ type: 'link', data: {} }], flags: {} });
    assert.equal(withEmptyLink.find((q) => q.id === 'first_link').done, false);

    const withRealLink = getQuestStatus({ profile: emptyProfile, blocks: [linkBlock()], flags: {} });
    assert.equal(withRealLink.find((q) => q.id === 'first_link').done, true);
  });

  test('customize_style ignores default theme values', () => {
    const quests = getQuestStatus({ profile: emptyProfile, blocks: [], flags: {} });
    assert.equal(quests.find((q) => q.id === 'customize_style').done, false);
  });

  test('customize_style detects a changed primary color', () => {
    const quests = getQuestStatus({ profile: { ...emptyProfile, primary_color: '#7C3AED' }, blocks: [], flags: {} });
    assert.equal(quests.find((q) => q.id === 'customize_style').done, true);
  });

  test('customize_style detects a non-default bg_effect', () => {
    const quests = getQuestStatus({ profile: { ...emptyProfile, bg_effect: 'aurora' }, blocks: [], flags: {} });
    assert.equal(quests.find((q) => q.id === 'customize_style').done, true);
  });

  test('customize_style is case-insensitive on hex comparison', () => {
    const quests = getQuestStatus({ profile: { ...emptyProfile, primary_color: '#000000' }, blocks: [], flags: {} });
    assert.equal(quests.find((q) => q.id === 'customize_style').done, false);
  });

  test('try_block_type requires at least two distinct block types', () => {
    const oneType = getQuestStatus({ profile: emptyProfile, blocks: [linkBlock(), linkBlock('https://two.com')], flags: {} });
    assert.equal(oneType.find((q) => q.id === 'try_block_type').done, false);

    const twoTypes = getQuestStatus({ profile: emptyProfile, blocks: [linkBlock(), { type: 'heading', data: {} }], flags: {} });
    assert.equal(twoTypes.find((q) => q.id === 'try_block_type').done, true);
  });

  test('flag-backed quests reflect the flags object directly', () => {
    const quests = getQuestStatus({
      profile: emptyProfile,
      blocks: [],
      flags: { published: true, viewed_analytics: true, shared_page: false },
    });
    assert.equal(quests.find((q) => q.id === 'published').done, true);
    assert.equal(quests.find((q) => q.id === 'viewed_analytics').done, true);
    assert.equal(quests.find((q) => q.id === 'shared_page').done, false);
  });

  test('published is done when content matches live state, even without an explicit publish click', () => {
    // Mirrors onboarding: content exists, DashboardContext.load() auto-published
    // it on first view, so hasUnpostedChanges is false with no manual flag set.
    const quests = getQuestStatus({
      profile: emptyProfile,
      blocks: [linkBlock()],
      flags: {},
      hasUnpostedChanges: false,
    });
    assert.equal(quests.find((q) => q.id === 'published').done, true);
  });

  test('published is NOT done for an empty page that merely matches its (empty) live state', () => {
    const quests = getQuestStatus({ profile: emptyProfile, blocks: [], flags: {}, hasUnpostedChanges: false });
    assert.equal(quests.find((q) => q.id === 'published').done, false);
  });

  test('published is NOT done while there are unposted draft changes, absent an explicit flag', () => {
    const quests = getQuestStatus({ profile: emptyProfile, blocks: [linkBlock()], flags: {}, hasUnpostedChanges: true });
    assert.equal(quests.find((q) => q.id === 'published').done, false);
  });

  test('defaults hasUnpostedChanges to true (unpublished) when not provided', () => {
    const quests = getQuestStatus({ profile: emptyProfile, blocks: [linkBlock()], flags: {} });
    assert.equal(quests.find((q) => q.id === 'published').done, false);
  });

  test('handles a null profile and undefined blocks without throwing', () => {
    assert.doesNotThrow(() => getQuestStatus({ profile: null, blocks: undefined, flags: {} }));
    const quests = getQuestStatus({ profile: null, blocks: undefined, flags: {} });
    assert.equal(quests.find((q) => q.id === 'customize_style').done, false);
    assert.equal(quests.find((q) => q.id === 'first_link').done, false);
  });
});

describe('questProgress', () => {
  test('computes completed/total/pct correctly', () => {
    const quests = [{ done: true }, { done: true }, { done: false }, { done: false }];
    assert.deepEqual(questProgress(quests), { completed: 2, total: 4, pct: 50 });
  });

  test('handles an empty quest list without dividing by zero', () => {
    assert.deepEqual(questProgress([]), { completed: 0, total: 0, pct: 0 });
  });

  test('rounds percentage rather than truncating', () => {
    const quests = [{ done: true }, { done: false }, { done: false }]; // 1/3 = 33.33%
    assert.equal(questProgress(quests).pct, 33);
  });
});

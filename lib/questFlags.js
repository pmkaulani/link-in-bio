const KEY = 'quest_flags';

export function getQuestFlags() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function setQuestFlag(id) {
  if (typeof window === 'undefined') return;
  try {
    const flags = getQuestFlags();
    if (flags[id]) return;
    flags[id] = true;
    localStorage.setItem(KEY, JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent('quest-flag-set', { detail: id }));
  } catch {}
}

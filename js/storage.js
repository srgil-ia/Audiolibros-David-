// All persistent data lives here, in localStorage on the device.
// Nothing leaves the phone. Shape of the state:
// {
//   version: 1,
//   settings: { lang: 'en'|'es', theme: 'auto'|'light'|'dark', goal: number },
//   cards:    { [cardId]: { seen, last, due, ivl, ease, liked, saved, savedAt, readOn } },
//   taste:    { tags: { [tag]: score }, decks: { [deckId]: score } },
//   days:     { 'YYYY-MM-DD': cardsReadThatDay },
//   imported: [ deck, ... ]   // decks pasted via Import (same format as content/*.json)
// }

const KEY = 'mise.state.v1';
export const BACKUP_KIND = 'mise-backup';

const defaults = () => ({
  version: 1,
  settings: { lang: 'en', theme: 'auto', goal: 10 },
  cards: {},
  taste: { tags: {}, decks: {} },
  days: {},
  imported: [],
});

function merge(base, saved) {
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings || {}) },
    taste: { ...base.taste, ...(saved.taste || {}) },
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? merge(defaults(), JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

export const state = read();

let saveTimer;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
}

export function flush() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Could not save state', err);
  }
}

// Save immediately when the app goes to background (iOS may kill it).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});

export function cardState(id) {
  return (state.cards[id] ||= { seen: 0, ease: 2.3, ivl: 0, due: 0 });
}

export function exportBackup() {
  return JSON.stringify({ kind: BACKUP_KIND, exportedAt: new Date().toISOString(), state }, null, 2);
}

export function restoreBackup(obj) {
  const next = merge(defaults(), obj.state || {});
  replaceState(next);
}

export function resetTaste() {
  state.taste = { tags: {}, decks: {} };
  flush();
}

export function resetAll() {
  const keep = { settings: state.settings, imported: state.imported };
  replaceState({ ...defaults(), ...keep });
}

function replaceState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, next);
  flush();
}

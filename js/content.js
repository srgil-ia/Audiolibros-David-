// Loads built-in decks (content/*.json) and merges decks imported in the app.

import { state, save } from './storage.js';
import { validateDeck, normalizeImport } from './schema.js';

export const library = {
  decks: new Map(), // deckId → deck (without cards)
  cards: new Map(), // cardId → card (with .deck = deckId)
};

export async function loadLibrary() {
  const index = await fetchJSON('content/index.json');
  const builtIn = await Promise.all(index.decks.map((file) => fetchJSON(`content/${file}`)));
  library.decks.clear();
  library.cards.clear();
  for (const deck of builtIn) addDeck(deck);
  for (const deck of state.imported) addDeck(deck);
  return library;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.json();
}

function addDeck(deck) {
  const existing = library.decks.get(deck.id);
  const { cards, ...meta } = deck;
  library.decks.set(deck.id, existing ? { ...existing, ...pickMeta(meta) } : meta);
  for (const card of cards) library.cards.set(card.id, { ...card, deck: deck.id });
}

// Only override deck metadata the import actually provides.
function pickMeta(meta) {
  return Object.fromEntries(Object.entries(meta).filter(([, v]) => v != null));
}

export function cardsOf(deckId) {
  return [...library.cards.values()].filter((c) => c.deck === deckId);
}

// Import from pasted JSON. Returns { added, updated, errors }.
export function importDecks(obj) {
  const decks = normalizeImport(obj);
  const errors = decks.flatMap((d, i) => validateDeck(d, decks.length > 1 ? `deck ${i + 1}` : 'deck'));
  if (errors.length) return { added: 0, updated: 0, errors };

  let added = 0;
  let updated = 0;
  for (const deck of decks) {
    for (const card of deck.cards) library.cards.has(card.id) ? updated++ : added++;
    const stored = state.imported.find((d) => d.id === deck.id);
    if (stored) {
      const byId = new Map(stored.cards.map((c) => [c.id, c]));
      for (const card of deck.cards) byId.set(card.id, card);
      Object.assign(stored, { ...deck, cards: [...byId.values()] });
    } else {
      state.imported.push(deck);
    }
    addDeck(deck);
  }
  save();
  return { added, updated, errors: [] };
}

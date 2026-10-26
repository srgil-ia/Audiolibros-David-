// "Learns what you like" — a small, local recommender.
// Every interaction nudges a score for the card's tags and its deck.
// The feed then samples the next card from a mix of affinity, due reviews,
// new cards and some randomness (so you don't get stuck in a bubble).

import { state, save, cardState } from './storage.js';
import { isDue, isNew } from './srs.js';

export const SIGNALS = {
  like: 3,
  unlike: -3,
  save: 2,
  unsave: -1,
  longRead: 1, // stayed > LONG_READ_MS
  translate: 0.3,
  again: 0.5,
  skip: -0.6, // scrolled past in < SKIP_MS
};
export const LONG_READ_MS = 10000;
export const SKIP_MS = 1500;

const MAX = 25;
const MIN = -10;
const EXPLORE = 0.12; // chance of a purely random pick among new/due cards

export function signal(card, name) {
  const w = SIGNALS[name] || 0;
  const { tags, decks } = state.taste;
  for (const t of card.tags) tags[t] = clamp((tags[t] || 0) + w);
  decks[card.deck] = clamp((decks[card.deck] || 0) + w * 0.4);
  save();
}

const clamp = (v) => Math.round(Math.min(MAX, Math.max(MIN, v)) * 100) / 100;

export function affinity(card) {
  const { tags, decks } = state.taste;
  const tagScores = card.tags.map((t) => tags[t] || 0);
  const best = tagScores.length ? Math.max(...tagScores) : 0;
  const avg = tagScores.length ? tagScores.reduce((a, b) => a + b, 0) / tagScores.length : 0;
  return 0.6 * best + 0.4 * avg + (decks[card.deck] || 0);
}

function score(card, now) {
  const st = cardState(card.id);
  let base;
  if (isNew(card.id)) base = 1;
  else if (isDue(card.id, now)) base = 1.6;
  else {
    // Already read and not due: rarely, and the older the better.
    const days = (now - (st.last || 0)) / 86400000;
    base = -3 + Math.min(days, 3);
  }
  if (st.liked) base += 0.3;
  return base + 0.18 * affinity(card) + (Math.random() - 0.5) * 0.8;
}

// Pick the next card from `pool`, avoiding ids in `recent`.
export function pickNext(pool, recent, now = Date.now()) {
  if (!pool.length) return null;
  const avoid = new Set(recent.slice(-Math.min(recent.length, pool.length - 1)));
  const candidates = pool.filter((c) => !avoid.has(c.id));
  if (!candidates.length) return pool[Math.floor(Math.random() * pool.length)];

  if (Math.random() < EXPLORE) {
    const fresh = candidates.filter((c) => isNew(c.id) || isDue(c.id, now));
    if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  }

  // Softmax-style weighted sampling.
  const weights = candidates.map((c) => Math.exp(score(c, now)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export function topTags(n = 8) {
  return Object.entries(state.taste.tags)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

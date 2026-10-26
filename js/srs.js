// Simplified SM-2 spaced repetition, driven by scrolling instead of buttons.
// - Reading a card (staying on it a few seconds) counts as a successful review.
// - "Again" brings it back soon and makes future intervals a bit shorter.

import { cardState } from './storage.js';

export const READ_MS = 4000; // time on a card to count it as read
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export function isNew(id) {
  return !cardState(id).seen;
}

export function isDue(id, now = Date.now()) {
  const st = cardState(id);
  return st.seen > 0 && st.due <= now;
}

// Returns true if this read counted as a review (only once per due period).
export function markRead(id, now = Date.now()) {
  const st = cardState(id);
  if (st.seen > 0 && st.due > now) {
    st.last = now;
    return false;
  }
  if (!st.ivl) st.ivl = 1;
  else if (st.ivl < 3) st.ivl = 3;
  else st.ivl = Math.round(st.ivl * st.ease);
  st.seen += 1;
  st.last = now;
  st.due = now + st.ivl * DAY;
  return true;
}

export function markAgain(id, now = Date.now()) {
  const st = cardState(id);
  st.ease = Math.max(1.3, (st.ease || 2.3) - 0.2);
  st.ivl = 0;
  st.seen = Math.max(1, st.seen);
  st.due = now + 10 * MIN;
}

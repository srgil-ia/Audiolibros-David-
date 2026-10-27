// Daily goal and streak. A day counts for the streak when the goal is met.

import { state, save } from './storage.js';

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayCount() {
  return state.days[dayKey()] || 0;
}

// Returns true if this read just completed today's goal.
export function countRead() {
  const key = dayKey();
  const before = state.days[key] || 0;
  state.days[key] = before + 1;
  save();
  return before + 1 === state.settings.goal;
}

function metGoal(key) {
  return (state.days[key] || 0) >= state.settings.goal;
}

export function streak() {
  const d = new Date();
  // Today still in progress: the streak is alive if yesterday counted.
  if (!metGoal(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (metGoal(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function bestStreak() {
  const keys = Object.keys(state.days).filter(metGoal).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const date = new Date(k + 'T12:00:00');
    run = prev && (date - prev) / 86400000 < 1.5 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function totalRead() {
  return Object.values(state.days).reduce((a, b) => a + b, 0);
}

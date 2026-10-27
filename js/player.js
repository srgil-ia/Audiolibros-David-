// Video mode audio: the active card's narration plays in a loop (with a short
// gap) until you scroll away or mute it, over soft generated lo-fi music.
// Cards with a recording in audio/ use it; the rest use the phone's voice.

import { state } from './storage.js';
import { narrationText, narrationLang } from './narration.js';
import { createMusic } from './music.js';

const GAP_MS = 1500; // silence between repetitions
const MUSIC_LEVEL = 0.5;
const MUSIC_DUCKED = 0.18; // music level while the voice speaks
const TTS_CHARS_PER_SEC = 14; // to estimate progress for the phone voice

let ctx = null;
let voiceGain;
let musicGain;
let music;
let unlocked = false;
let manifest = {};
const buffers = new Map(); // cardId → Promise<AudioBuffer>
const unlockListeners = new Set();

// current = { card, onProgress, pass } — pass = the running repetition
let current = null;

export async function loadAudioManifest() {
  try {
    const res = await fetch('audio/index.json');
    manifest = res.ok ? await res.json() : {};
  } catch {
    manifest = {};
  }
}

export const isUnlocked = () => unlocked;
export const onUnlock = (fn) => unlockListeners.add(fn);

// Exact narrated text (recordings may differ slightly from the card text).
export const spokenText = (card) => manifest[card.id]?.text || narrationText(card);

function ensureContext() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioCtx();
  // iOS 17+: play even when the silent switch is on.
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {}
  voiceGain = ctx.createGain();
  voiceGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = MUSIC_LEVEL;
  musicGain.connect(ctx.destination);
  music = createMusic(ctx, musicGain);
}

// Must run inside a user gesture (iOS blocks audio until the first touch).
export function unlock() {
  ensureContext();
  ctx.resume();
  const silent = ctx.createBufferSource();
  silent.buffer = ctx.createBuffer(1, 1, 22050);
  silent.connect(ctx.destination);
  silent.start(0);
  if (unlocked) return;
  unlocked = true;
  unlockListeners.forEach((fn) => fn());
  syncMusic();
  if (current) startPass(current);
}

export function play(card, onProgress) {
  stop();
  current = { card, onProgress, pass: null };
  if (unlocked) startPass(current);
}

export function stop() {
  if (!current) return;
  endPass(current);
  current.onProgress?.(null);
  current = null;
}

// Start the current card again from the beginning (e.g. the 🔊 button).
export function replay() {
  if (!current) return;
  endPass(current);
  startPass(current, true);
}

// Settings changed (voice / music on or off).
export function refresh() {
  syncMusic();
  if (!current) return;
  endPass(current);
  current.onProgress?.(null);
  startPass(current);
}

export function preload(card) {
  if (manifest[card.id]) loadBuffer(card.id).catch(() => {});
}

function syncMusic() {
  if (!music) return;
  const on = unlocked && state.settings.music && document.visibilityState === 'visible';
  on ? music.start() : music.stop();
}

function duck(on) {
  if (!musicGain) return;
  musicGain.gain.setTargetAtTime(on ? MUSIC_DUCKED : MUSIC_LEVEL, ctx.currentTime, 0.3);
}

function loadBuffer(id) {
  if (!buffers.has(id)) {
    ensureContext();
    const p = fetch(`audio/${id}.mp3`)
      .then((res) => {
        if (!res.ok) throw new Error(`audio ${id}`);
        return res.arrayBuffer();
      })
      .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)));
    p.catch(() => buffers.delete(id));
    buffers.set(id, p);
    if (buffers.size > 8) buffers.delete(buffers.keys().next().value);
  }
  return buffers.get(id);
}

async function startPass(cur, force = false) {
  if (!unlocked || (!state.settings.voice && !force) || current !== cur) return;
  const pass = { stopped: false, raf: 0, timer: 0, source: null, utterance: null };
  cur.pass = pass;

  const finish = () => {
    if (pass.stopped) return;
    cancelAnimationFrame(pass.raf);
    duck(false);
    cur.onProgress?.(1);
    pass.timer = setTimeout(() => {
      if (!pass.stopped && current === cur) startPass(cur);
    }, GAP_MS);
  };

  let startedAt;
  let duration;
  let clock;

  if (manifest[cur.card.id]) {
    let buffer;
    try {
      buffer = await loadBuffer(cur.card.id);
    } catch {
      buffer = null;
    }
    if (pass.stopped) return;
    if (buffer) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(voiceGain);
      src.onended = finish;
      src.start();
      pass.source = src;
      clock = () => ctx.currentTime;
      startedAt = clock();
      duration = buffer.duration;
    }
  }

  if (!pass.source) {
    if (!('speechSynthesis' in window)) return;
    const text = narrationText(cur.card);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = narrationLang(cur.card);
    u.rate = cur.card.de ? 0.85 : 1;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === u.lang)
      || speechSynthesis.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = finish;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    pass.utterance = u;
    clock = () => performance.now() / 1000;
    startedAt = clock();
    duration = text.length / TTS_CHARS_PER_SEC / u.rate;
  }

  duck(true);
  const tick = () => {
    if (pass.stopped) return;
    cur.onProgress?.(Math.min(0.999, (clock() - startedAt) / duration));
    pass.raf = requestAnimationFrame(tick);
  };
  tick();
}

function endPass(cur) {
  const pass = cur.pass;
  if (!pass) return;
  pass.stopped = true;
  cancelAnimationFrame(pass.raf);
  clearTimeout(pass.timer);
  if (pass.source) {
    pass.source.onended = null;
    try {
      pass.source.stop();
    } catch {}
  }
  if (pass.utterance) speechSynthesis.cancel();
  cur.pass = null;
  duck(false);
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.visibilityState === 'hidden') {
    if (current) endPass(current);
    ctx.suspend();
  } else if (unlocked) {
    ctx.resume();
    if (current) startPass(current);
  }
  syncMusic();
});

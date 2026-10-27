// Infinite vertical feed: one card per screen, snap scrolling.
// The next cards are chosen on the fly by the taste recommender.

import { h, toast } from '../dom.js';
import { icons } from '../icons.js';
import { t, pick } from '../i18n.js';
import { library } from '../content.js';
import { state, save, cardState } from '../storage.js';
import { READ_MS, markRead, markAgain } from '../srs.js';
import { signal, pickNext, LONG_READ_MS, SKIP_MS } from '../taste.js';
import { countRead, todayCount, streak } from '../stats.js';
import * as player from '../player.js';
import { renderCard as renderCardView } from './card.js';

const AHEAD = 3; // cards kept rendered ahead of the current one
const MAX_SLIDES = 40; // older slides are trimmed to keep the DOM light

let root;
let scroller;
let header;
let observer;
let recent = [];
let active = null; // { id, card, start, readTimer, el }
let filterDeck = null;
let visible = true; // false while another tab is open

export function mountFeed(container) {
  root = container;
  build();
}

export function setFeedFilter(deckId) {
  filterDeck = deckId;
  build();
}

export function refreshFeed() {
  build();
}

function pool() {
  const all = [...library.cards.values()];
  return filterDeck ? all.filter((c) => c.deck === filterDeck) : all;
}

function build() {
  leaveActive();
  observer?.disconnect();
  header = h('header.feed-header');
  scroller = h('div.feed-scroller');
  root.replaceChildren(scroller, header);
  renderHeader();

  observer = new IntersectionObserver(onIntersect, { root: scroller, threshold: 0.6 });

  if (!pool().length) {
    scroller.append(h('div.feed-empty', {}, t('feed.empty')));
    return;
  }
  for (let i = 0; i < AHEAD + 1; i++) appendNext();
}

export function renderHeader() {
  if (!header) return;
  const done = todayCount();
  const goal = state.settings.goal;
  const pct = Math.min(1, done / goal);
  const deck = filterDeck && library.decks.get(filterDeck);

  const { voice, music } = state.settings;
  header.replaceChildren(...[
    h('div.pill.streak', { title: t('me.streak') },
      h('span', { html: icons.flame }), String(streak())),
    deck
      ? h('button.pill.filter', { onclick: () => setFeedFilter(null) },
          h('span.ellipsis', {}, `${deck.emoji || ''} ${pick(deck.title)}`), h('span', { html: icons.close }))
      : h('div.pill.filter.muted', {}, h('span.ellipsis', {}, t('feed.allDecks'))),
    h('button.pill.icon', {
      class: voice ? 'on' : '',
      'aria-label': t('feed.voice'),
      html: voice ? icons.speaker : icons.mute,
      onclick: () => toggleSetting('voice'),
    }),
    h('button.pill.icon', {
      class: music ? 'on' : '',
      'aria-label': t('feed.music'),
      html: icons.music,
      onclick: () => toggleSetting('music'),
    }),
    h('div.pill.goal', { style: { '--pct': pct }, class: pct >= 1 ? 'done' : '' },
      h('span.ring'), `${Math.min(done, goal)}/${goal}`),
    !player.isUnlocked() && (voice || music)
      ? h('div.sound-hint', {}, h('span', { html: icons.speaker }), t('feed.tapSound'))
      : null,
  ].filter(Boolean));
}

function toggleSetting(key) {
  state.settings[key] = !state.settings[key];
  save();
  player.refresh();
  renderHeader();
}

player.onUnlock(() => renderHeader());

// Called by the app when switching tabs: only the visible feed makes sound.
export function setFeedVisible(on) {
  visible = on;
  if (!on) player.stop();
  else if (active) startAudio(active.el);
}

function startAudio(slide) {
  if (!visible) return;
  player.play(slide._card, slide._view.setProgress);
  // Warm up the next recordings so the voice starts instantly.
  let next = slide.nextElementSibling;
  for (let i = 0; i < 2 && next; i++, next = next.nextElementSibling) player.preload(next._card);
}

function appendNext() {
  const card = pickNext(pool(), recent);
  if (!card) return;
  recent.push(card.id);
  if (recent.length > 60) recent = recent.slice(-60);

  const st = cardState(card.id);
  const view = renderCard(card, st);
  const slide = h('section.slide', { dataset: { id: card.id } }, view.el);
  slide._card = card;
  slide._view = view;
  scroller.append(slide);
  view.fit();
  observer.observe(slide);
}

function renderCard(card, st) {
  const view = renderCardView(card, st, {
    onLike: () => {
      st.liked = !st.liked;
      view.setLiked(st.liked);
      signal(card, st.liked ? 'like' : 'unlike');
      save();
    },
    onSave: () => {
      st.saved = !st.saved;
      st.savedAt = st.saved ? Date.now() : undefined;
      view.setSaved(st.saved);
      signal(card, st.saved ? 'save' : 'unsave');
      if (st.saved) toast(t('feed.savedToast'));
      save();
    },
    onAgain: () => {
      markAgain(card.id);
      signal(card, 'again');
      toast(t('feed.againToast'));
      save();
    },
    onTranslate: () => signal(card, 'translate'),
    onSpeak: () => player.replay(),
  });
  return view;
}

function onIntersect(entries) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const slide = entry.target;
    if (active && active.el === slide) continue;
    leaveActive();
    enter(slide);
  }
}

function enter(slide) {
  const card = slide._card;
  active = {
    el: slide,
    card,
    start: Date.now(),
    read: false,
    readTimer: setTimeout(() => onRead(), READ_MS),
  };

  // Keep cards ready below, trim far above.
  const slides = [...scroller.children];
  const idx = slides.indexOf(slide);
  for (let i = slides.length - 1 - idx; i < AHEAD; i++) appendNext();
  if (idx > MAX_SLIDES) trimAbove(idx - MAX_SLIDES);
  startAudio(slide);
}

function leaveActive() {
  if (!active) return;
  clearTimeout(active.readTimer);
  player.stop();
  const dwell = Date.now() - active.start;
  if (dwell < SKIP_MS) signal(active.card, 'skip');
  else if (dwell > LONG_READ_MS) signal(active.card, 'longRead');
  active = null;
}

function onRead() {
  if (!active || active.read) return;
  active.read = true;
  markRead(active.card.id);
  const reachedGoal = countRead();
  renderHeader();
  if (reachedGoal) toast(t('feed.goalDone'), 3000);
  save();
}

function trimAbove(count) {
  // Remove slides above while keeping the visual position stable.
  const removed = [...scroller.children].slice(0, count);
  const height = removed.reduce((sum, el) => sum + el.offsetHeight, 0);
  removed.forEach((el) => {
    observer.unobserve(el);
    el.remove();
  });
  scroller.scrollTop -= height;
}

// Pause read timers while the app is in background.
document.addEventListener('visibilitychange', () => {
  if (!active) return;
  if (document.visibilityState === 'hidden') {
    clearTimeout(active.readTimer);
  } else {
    active.start = Date.now();
    if (!active.read) active.readTimer = setTimeout(() => onRead(), READ_MS);
  }
});

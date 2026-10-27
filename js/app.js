// App entry: theme, tab navigation, service worker.

import { h } from './dom.js';
import { icons } from './icons.js';
import { t } from './i18n.js';
import { state } from './storage.js';
import { loadLibrary } from './content.js';
import { mountFeed, setFeedFilter, refreshFeed, renderHeader } from './views/feed.js';
import { renderDecks } from './views/decks.js';
import { renderSaved } from './views/saved.js';
import { renderMe } from './views/me.js';

const TABS = [
  { id: 'feed', icon: icons.feed },
  { id: 'decks', icon: icons.decks },
  { id: 'saved', icon: icons.bookmark },
  { id: 'me', icon: icons.me },
];

let current = 'feed';

function applyTheme() {
  const theme = state.settings.theme;
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  document.documentElement.lang = state.settings.lang;
}

function renderTabbar() {
  const bar = document.getElementById('tabbar');
  bar.replaceChildren(...TABS.map((tab) =>
    h('button.tab', {
      class: tab.id === current ? 'on' : '',
      'aria-label': t(`tab.${tab.id}`),
      onclick: () => show(tab.id),
    }, h('span', { html: tab.icon }), h('span.tab-label', {}, t(`tab.${tab.id}`)))));
}

function show(view) {
  current = view;
  document.querySelectorAll('.view').forEach((el) => (el.hidden = el.dataset.view !== view));
  document.body.dataset.view = view;
  const el = document.getElementById(`view-${view}`);
  if (view === 'decks') renderDecks(el, { onFocus: (deckId) => { setFeedFilter(deckId); show('feed'); } });
  if (view === 'saved') renderSaved(el);
  if (view === 'me') renderMe(el, { onChange });
  if (view === 'feed') renderHeader();
  if (view !== 'feed') el.scrollTop = 0;
  renderTabbar();
}

function onChange(kind) {
  if (kind === 'theme' || kind === 'lang') applyTheme();
  if (kind === 'lang') renderTabbar();
  if (kind === 'lang' || kind === 'content' || kind === 'data') refreshFeed();
  if (kind === 'goal') renderHeader();
}

async function start() {
  applyTheme();
  renderTabbar();
  document.body.dataset.view = 'feed';
  const feedEl = document.getElementById('view-feed');
  try {
    await loadLibrary();
    mountFeed(feedEl);
  } catch (err) {
    console.error(err);
    feedEl.replaceChildren(h('div.feed-empty', {}, t('feed.loadError')));
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW registration failed', err));
  }
}

start();

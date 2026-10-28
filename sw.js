// Service worker: makes the app work offline.
// Strategy: serve from cache instantly, refresh the cache in the background
// (stale-while-revalidate). New content appears on the next app launch.
// Bump VERSION when you add/rename files in PRECACHE.
// Narration MP3s (audio/*.mp3) are not precached: each one is cached the
// first time it plays, so the app stays light.

const VERSION = 'mise-v4';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'i18n/ui.js',
  'js/app.js',
  'js/content.js',
  'js/dom.js',
  'js/i18n.js',
  'js/music.js',
  'js/narration.js',
  'js/player.js',
  'js/icons.js',
  'js/prompt.js',
  'js/schema.js',
  'js/srs.js',
  'js/stats.js',
  'js/storage.js',
  'js/taste.js',
  'js/views/card.js',
  'js/views/decks.js',
  'js/views/feed.js',
  'js/views/me.js',
  'js/views/saved.js',
  'content/index.json',
  'audio/index.json',
  'content/mindset.json',
  'content/psychology.json',
  'content/leadership.json',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const res = await network;
      if (res) return res;
      if (request.mode === 'navigate') return cache.match('index.html');
      return new Response('Offline', { status: 503 });
    }),
  );
});

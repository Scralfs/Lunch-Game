/* Offline support: cache everything on install. Bump VERSION when adding or removing files. */
const VERSION = 'lunchbox-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/core.js',
  'js/app.js',
  'js/games/colour-clash.js',
  'js/games/make-24.js',
  'js/games/memory-match.js',
  'js/games/missing-vowels.js',
  'js/games/n-back.js',
  'js/games/number-flash.js',
  'js/games/number-hunt.js',
  'js/games/odd-colour.js',
  'js/games/pattern-recall.js',
  'js/games/quick-maths.js',
  'js/games/reaction.js',
  'js/games/sudoku.js',
  'js/games/target-number.js',
  'js/games/word-scramble.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: answer instantly from the cache (works offline),
// then refresh the cached copy in the background so updates arrive next launch.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(e.request, { ignoreSearch: true }).then((hit) => {
        const refresh = fetch(e.request)
          .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
          .catch(() => hit || cache.match('index.html'));
        if (hit) { e.waitUntil(refresh.catch(() => {})); return hit; }
        return refresh;
      })
    )
  );
});

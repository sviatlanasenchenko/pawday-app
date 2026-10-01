/* Pawday: versioned core, bounded photo cache, no forced mid-quiz update. */
const VERSION = '1d2ca376216b';
const ROOT = new URL('./', self.location.href);
const CORE = 'pawday-core-' + VERSION;
const MEDIA = 'pawday-media-' + VERSION;
const FILES = ["app.js?v=51", "assets/icons/apple-touch-icon.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "breed-coats.js?v=34", "breed-evidence.js?v=32", "breed-photos.js?v=58", "breed-ratings.js?v=32", "breeds.js?v=32", "coat-preferences.js?v=45", "database-v6-adapter.js?v=39", "database-v6.js?v=55", "en/index.html", "index.html", "live-counter.css?v=47", "live-counter.js?v=51", "manifest.json", "mascot-transparent.png", "matcher-v2-ui.js?v=51", "matching.js?v=54", "photo-credits.js?v=58", "playful.css?v=36", "playful.js?v=51", "pwa/cat-guidance-ui.js?v=57", "pwa/cat-review.js?v=57", "pwa/locales.js", "pwa/matcher-v6.js?v=51", "pwa/ownership-guidance-ui.js?v=59", "pwa/photo-offline.svg", "pwa/register.js", "pwa/rhythm.js", "pwa/theme.css", "quiz-groups.css?v=51", "quiz-groups.js?v=51", "redesign.css?v=34", "redesign.js?v=51", "result-sharing.css?v=56", "result-sharing.js?v=56", "results-design.css?v=53", "results-design.js?v=47&build=49", "ru/index.html", "share-core.js?v=56", "story-meeting.png", "story-together.png", "style.css", "youth-ui.css?v=24", "youth-ui.js?v=31", "zh/index.html"];
const url = path => new URL(path, ROOT).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CORE).then(cache => cache.addAll(FILES.map(url))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('pawday-core-') || key.startsWith('pawday-media-')) && key !== CORE && key !== MEDIA) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
let mediaWrites = Promise.resolve();
self.addEventListener('fetch', event => {
  const req = event.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== ROOT.origin || !u.pathname.startsWith(ROOT.pathname)) return;
  const relative = u.pathname.slice(ROOT.pathname.length);
  if (req.mode === 'navigate') {
    const page = /^(ru|zh|en)\/index\.html$/.test(relative) ? relative : /^(ru|zh|en)\/?$/.test(relative) ? relative.replace(/\/?$/, '/') + 'index.html' : /^(index.html)?$/.test(relative) ? 'index.html' : null;
    if (page) event.respondWith(caches.open(CORE).then(async cache => (await cache.match(url(page))) || fetch(req)));
    return;
  }
  if (FILES.some(f => url(f) === u.href)) {
    event.respondWith(caches.open(CORE).then(async cache => (await cache.match(req)) || fetch(req)));
  } else if (relative.startsWith('photos/')) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA), saved = await cache.match(req);
      if (saved) return saved;
      try {
        const response = await fetch(req);
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          mediaWrites = mediaWrites.catch(() => {}).then(async () => {
            await cache.put(req, copy);
            const keys = await cache.keys();
            for (const key of keys.slice(0, Math.max(0, keys.length - 80))) await cache.delete(key);
          });
          event.waitUntil(mediaWrites);
        }
        return response;
      } catch {
        return (await caches.open(CORE)).match(url('pwa/photo-offline.svg'));
      }
    })());
  }
});

// PDF Editor — service worker
// Precaches the app shell so the installed app opens offline, and caches
// vendor/* (pdf.js, pdf-lib, tesseract) the first time each file loads so
// OCR/export keep working offline after that.

const CACHE_VERSION = 'pdf-editor-v1';
const APP_SHELL = [
  './',
  './index.html',
  './final.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            // Fine if final.html vs index.html — whichever exists gets cached.
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // App shell HTML: try the network first so edits/updates show up,
  // fall back to the cached copy when offline.
  if (url.origin === self.location.origin && (req.mode === 'navigate' || req.destination === 'document')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./final.html')))
    );
    return;
  }

  // Vendor libraries (pdf.js / pdf-lib / tesseract) and fonts/icons:
  // cache-first, so once loaded once they work fully offline.
  if (url.origin === self.location.origin || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});

// ─── TAG Kaizen Tracker — Service Worker ───────────────────
// Strategy: Network-first with cache fallback.
// • Always tries the network so GitHub Pages updates land
//   on every device within one page load.
// • Falls back to cache when offline (full PWA support).
// • skipWaiting + clients.claim = new SW activates immediately.
// • Bump CACHE name whenever you need to force a hard reset.
const CACHE = 'kz-v13';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

// ── Install: pre-cache assets from network ──────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // Take over immediately — don't wait for existing tabs to close
  self.skipWaiting();
});

// ── Activate: delete every old cache version ────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  // Claim all open clients so they use this SW without a reload
  self.clients.claim();
});

// ── Fetch: network-first, cache on success, cache fallback ──
self.addEventListener('fetch', e => {
  // Only intercept GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Clone before consuming — cache the fresh copy
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        // Offline fallback: serve from cache, or the shell if no match
        caches.match(e.request)
          .then(r => r || caches.match('./index.html'))
      )
  );
});

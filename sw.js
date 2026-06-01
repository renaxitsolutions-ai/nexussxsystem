/* ══════════════════════════════════════════════════════════════════
   NexussX Service Worker — PWA offline support
   Version: 1.0.0
   Strategy:
     - Static assets (CSS, JS, fonts, images) → Cache-first
     - HTML pages                              → Network-first (always fresh)
     - API calls                              → Network-only (no caching)
   ══════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'nxs-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;
const ALL_CACHES    = [STATIC_CACHE, PAGES_CACHE];

/* Assets to pre-cache on install */
const PRECACHE_ASSETS = [
  '/nexus.css',
  '/nexus.js',
  '/logo.jpeg',
  '/home.html',
  '/servicios.html',
  '/productos.html',
  '/contacto.html',
  '/faq.html',
  '/blog.html',
  '/sobre.html',
  '/404.html',
  '/site.webmanifest'
];

/* ── Install: pre-cache critical assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

/* ── Activate: clean up old cache versions ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !ALL_CACHES.includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: route requests by type ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and API/server requests */
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/server/')) return;
  if (url.hostname !== self.location.hostname && !url.hostname.includes('fonts.gstatic.com')) return;

  /* Google Fonts — cache-first */
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* Static assets — cache-first */
  const isStatic = /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /* HTML pages — network-first, fall back to cache then offline page */
  if (request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(networkFirst(request));
    return;
  }
});

/* ══════ Strategies ══════ */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Network failed — try cache */
    const cached = await caches.match(request);
    if (cached) return cached;
    /* Ultimate fallback: offline page */
    const offline = await caches.match('/404.html');
    return offline || new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a1a;color:#fff"><h1>Sin conexión</h1><p>Revisa tu conexión a internet y vuelve a intentarlo.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

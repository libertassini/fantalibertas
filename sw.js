// FantaLibertas Service Worker
// Strategia: network-first (contenuti sempre aggiornati), con fallback alla cache se offline.
const CACHE = 'fantalibertas-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // salva in cache solo le richieste GET dello stesso dominio (l'app), non i dati esterni
        try {
          const url = new URL(req.url);
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        } catch (err) {}
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('index.html');
          return new Response('', { status: 504, statusText: 'Offline' });
        })
      )
  );
});

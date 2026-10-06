// Service worker per installare il gioco (PWA) e avviarlo anche senza rete,
// come in NIMBUS (n_redux, sw.js). Strategia "prima la rete": finche' c'e'
// rete si scarica sempre la versione fresca, la copia in cache serve solo
// quando la rete manca; ogni file passa in cache la prima volta che il
// gioco lo chiede (le room si giocano offline dopo averle aperte una volta
// online). Le richieste ad altre origini non si toccano.
const CACHE = "535-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      // la pagina con ?room=... e' la stessa index.html
      .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" })),
  );
});

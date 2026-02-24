// sw.js
const CACHE_NAME = "catalogo-luquisa-v1.1.0";
const ASSETS = [
  "/",
  "/index.html",
  "/catalogo.json",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon-32.png",
  "/img/PORTADA.png"
];

// Instala y cachea lo básico
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activa y limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Estrategia:
// - JSON e imágenes: cache-first (rápido offline)
// - HTML: network-first (para que actualice si hay internet)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  const isHTML = req.mode === "navigate" || req.destination === "document";
  const isData = url.pathname.endsWith(".json") || req.destination === "image";

  if (isHTML) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  if (isData) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // default
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
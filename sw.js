const CACHE_NAME = "catalogo-luquisa-v1.1.1";
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


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  const isHTML = req.mode === "navigate" || req.destination === "document";
  const isData = url.pathname.endsWith(".json") || req.destination === "image";

 if (isHTML) {
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put("/index.html", copy));
        return res;
      })
      .catch(async () => {
       const cached = await caches.match("/index.html");
        return cached || caches.match("/");
      })
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
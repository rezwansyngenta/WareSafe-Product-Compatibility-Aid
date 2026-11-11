/* ============================================================
   WareSafe service worker
   The app shell must open instantly and work with no network.
   The dataset is part of the release, so every resource is
   cache-first and a new release replaces the whole cache.
   ============================================================ */

const CACHE = "waresafe-v8";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/fonts.css",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/components.css",
  "./styles/matrix.css",
  "./styles/screens.css",
  "./src/app.js",
  "./src/config.js",
  "./src/store.js",
  "./src/matrix.js",
  "./src/i18n.js",
  "./src/ui.js",
  "./src/icons.js",
  "./src/widgets.js",
  "./src/screens/store.js",
  "./src/screens/compare.js",
  "./src/screens/pair.js",
  "./src/screens/response.js",
  "./assets/fonts/Montserrat-Variable.woff2",
  "./assets/fonts/NotoSansBengali-Variable.woff2",
  "./assets/brand/logo-syngenta-navy.svg",
  "./assets/brand/logo-syngenta-onbrand.svg",
  "./assets/pictograms/ghs01.svg",
  "./assets/pictograms/ghs02.svg",
  "./assets/pictograms/ghs03.svg",
  "./assets/pictograms/ghs04.svg",
  "./assets/pictograms/ghs05.svg",
  "./assets/pictograms/ghs06.svg",
  "./assets/pictograms/ghs07.svg",
  "./assets/pictograms/ghs08.svg",
  "./assets/pictograms/ghs09.svg",
  "./data/snapshot.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function serveShell() {
  const cache = await caches.open(CACHE);
  const hit = (await cache.match("./index.html")) || (await cache.match("./"));
  if (!hit) {
    return new Response("WareSafe shell unavailable offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return hit;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(serveShell());
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(cacheFirst(request));
});

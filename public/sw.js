// Hackathon Hunter's service worker: keeps the app usable offline and on flaky connections.
// Pages and the listings API are fetched from the network first and saved, so the last
// version you saw opens when you're offline. Built assets never change once deployed
// (their names carry a hash), so they're served from the cache.
const VERSION = "hh-v1";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Hackathon Hunter</title>
<style>body{font-family:system-ui,sans-serif;background:#fafafa;color:#18181b;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px}a{color:#4f46e5}@media(prefers-color-scheme:dark){body{background:#09090b;color:#f4f4f5}}</style></head>
<body><div><h1>You're offline</h1><p>This page hasn't been saved for offline use yet. Open Browse or Saved once while online and they'll work offline after that.</p><p><a href="/">Try again</a></p></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(["/", "/saved"]))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) || (request.mode === "navigate" && (await cache.match("/", { ignoreSearch: true })));
    if (cached) return cached;
    if (request.mode === "navigate") return new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // event images and other sites go straight to the network
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate" || url.pathname === "/api/hackathons") {
    event.respondWith(networkFirst(request));
  }
});

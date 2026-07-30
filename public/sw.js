const CACHE_NAME = "xendaria-static-v2";
const LEGACY_CACHE_NAME = "xendaria-v1";

const APP_SHELL = ["/", "/manifest.json"];
const STATIC_DESTINATIONS = new Set([
  "font",
  "image",
  "manifest",
  "script",
  "style",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const legacyCacheExists = await caches.has(LEGACY_CACHE_NAME);
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);

      // Esta primera migracion debe desplazar al SW que cacheaba la API.
      if (legacyCacheExists) {
        await self.skipWaiting();
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("xendaria-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Las APIs y recursos externos siempre quedan a cargo de la red.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/", response.clone());
          }

          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  if (!STATIC_DESTINATIONS.has(request.destination)) return;

  // Los archivos estaticos tambien consultan primero la red. La copia solo
  // se utiliza como respaldo cuando el dispositivo queda sin conexion.
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});

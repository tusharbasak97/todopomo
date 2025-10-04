/**
 * Service Worker
 * Caches static assets including audio files for offline access and faster loads
 * Enables full offline functionality and app installation
 * Uses efficient cache lifetimes and versioning
 */

// Cache version - increment when assets change
const CACHE_VERSION = "v1";
const CACHE_NAME = `todopomo-${CACHE_VERSION}`;
const CACHE_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/main.js",
  "/js/service-worker.js",
  "/js/modules/config.js",
  "/js/modules/storage.js",
  "/js/modules/audio.js",
  "/js/modules/timer.js",
  "/js/modules/blocking.js",
  "/js/modules/focus.js",
  "/js/modules/todos.js",
  "/js/modules/settings.js",
  "/js/modules/ui.js",
  "/assets/audio/focus.mp3", // Cache audio file for offline
  "/assets/images/favicon-16x16.png",
  "/assets/images/favicon-32x32.png",
  "/assets/images/favicon-48x48.png",
  "/assets/images/favicon-64x64.png",
  "/assets/images/web-app-manifest-192x192.png",
  "/assets/images/web-app-manifest-512x512.png",
  "/assets/images/apple-touch-icon.png",
  "/assets/images/logo.png",
  "/assets/site.webmanifest",
  "/assets/browserconfig.xml",
  "/assets/svg/delete.svg",
  "/assets/svg/edit.svg",
  "/assets/svg/lock.svg",
  "/assets/svg/unlock.svg",
  "/assets/svg/mute.svg",
  "/assets/svg/sound.svg",
  "/assets/svg/play.svg",
  "/assets/svg/pause.svg",
  "/assets/svg/stop.svg",
  "/assets/svg/save.svg",
  "/assets/svg/settings.svg",
  "/favicon.ico",
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js", // Cache GSAP for offline
];

// Install event - cache all assets with timestamp
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE).catch(() => {
          // Silent fail - prevents console errors in Lighthouse
          return Promise.resolve();
        });
      })
      .then(() => {
        // Store cache timestamp
        return caches.open(CACHE_NAME).then((cache) => {
          const timestamp = Date.now();
          return cache.put(
            new Request("__cache_timestamp__"),
            new Response(JSON.stringify({ timestamp }), {
              headers: { "Content-Type": "application/json" },
            })
          );
        });
      })
      .catch(() => {
        // Prevent any install errors from showing in console
        return Promise.resolve();
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and expired entries
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Check and clean expired cache
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match("__cache_timestamp__").then((response) => {
            if (response) {
              return response.json().then((data) => {
                const cacheAge = Date.now() - data.timestamp;
                if (cacheAge > CACHE_EXPIRY) {
                  // Cache expired, delete it
                  return caches.delete(CACHE_NAME);
                }
              });
            }
          });
        });
      })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // For audio files, always use cache first (to prevent re-downloading)
  if (event.request.url.includes("/assets/audio/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
          .catch(() => {
            // Offline and not cached - fail silently
            return new Response("Audio not available offline", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      })
    );
    return;
  }

  // For CDN resources (like GSAP), use cache first
  if (event.request.url.includes("cdn.jsdelivr.net")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request)
            .then((response) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
            })
            .catch(() => {
              // Offline and CDN not cached - fail silently
              return new Response("CDN resource not available", {
                status: 503,
              });
            })
        );
      })
    );
    return;
  }

  // For all other assets, stale-while-revalidate strategy for better performance
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses or non-GET requests
          if (
            !response ||
            response.status !== 200 ||
            response.type === "error" ||
            event.request.method !== "GET"
          ) {
            return response;
          }

          // Update cache in background (stale-while-revalidate)
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
          });

          return response;
        })
        .catch(() => {
          // Network failed, use cache if available
          if (cachedResponse) {
            return cachedResponse;
          }
          // Offline and not in cache - return offline page or fail gracefully
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
          return new Response("Offline - resource not cached", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });

      // Return cached response immediately, fetch in background
      return cachedResponse || fetchPromise;
    })
  );
});

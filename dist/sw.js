// Suzu AI Service Worker v2.0
const CACHE_NAME = "suzu-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
    "/",
    "/index.html",
    "/offline.html",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

// ── Install: precache essential files ──────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ───────
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Always network for API calls
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request).catch(() =>
                new Response(JSON.stringify({ error: "Offline — no network" }), {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                })
            )
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((response) => {
                    if (response.ok && response.type !== "opaque") {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(OFFLINE_URL));
        })
    );
});

// ── Push notifications ─────────────────────────────────────────
self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
    event.waitUntil(
        self.registration.showNotification(data.title || "Suzu AI", {
            body: data.body || "आपके लिए एक संदेश है!",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-96.png",
            vibrate: [200, 100, 200],
            data: { url: data.url || "/" },
            actions: [
                { action: "open", title: "खोलें" },
                { action: "dismiss", title: "बंद करें" },
            ],
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.action === "dismiss") return;
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            if (list.length > 0) return list[0].focus();
            return clients.openWindow(event.notification.data?.url || "/");
        })
    );
});

// ── Background sync (retry failed messages) ───────────────────
self.addEventListener("sync", (event) => {
    if (event.tag === "retry-message") {
        event.waitUntil(retryPendingMessages());
    }
});

async function retryPendingMessages() {
    // In a real app, read from IndexedDB and retry
    console.log("[SW] Retrying pending messages...");
}
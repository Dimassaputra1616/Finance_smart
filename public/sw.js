/**
 * Service Worker untuk PWA Perbendaharaan & Kas.
 *
 * Strategi:
 * 1. Aset statis (_next/static, font, icon): Cache-First / Stale-While-Revalidate
 * 2. Navigasi halaman: Network-First agar angka keuangan selalu real-time
 * 3. Mutasi data & Server Action (POST/PUT/DELETE): Network-Only
 */

const CACHE_NAME = "keuangan-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = ["/manifest.webmanifest", "/icon.svg", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Hanya tangani GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Abaikan API bot & request upload
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    return;
  }

  // 1. Aset statis Next.js -> Cache-First
  if (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".webmanifest")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return networkRes;
        });
      }),
    );
    return;
  }

  // 2. Navigasi Halaman -> Network-First (angka keuangan harus selalu segar)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match(OFFLINE_URL).then((offlineRes) => {
          return (
            offlineRes ||
            new Response(
              "<!doctype html><html lang='id'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Offline · Keuangan</title><style>body{font-family:sans-serif;background:#0d1a14;color:#f0f4f1;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center;}h1{color:#e8c77b;font-size:1.25rem;}p{color:#8c9f95;font-size:0.9rem;max-width:360px;line-height:1.5;}</style></head><body><div><h1>Koneksi Terputus</h1><p>Aplikasi sedang offline. Sambungkan kembali perangkat ke jaringan untuk menyinkronkan data perbendaharaan.</p></div></body></html>",
              { headers: { "Content-Type": "text/html; charset=utf-8" } },
            )
          );
        });
      }),
    );
  }
});

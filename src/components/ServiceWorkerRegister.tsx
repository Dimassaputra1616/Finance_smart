"use client";

import { useEffect } from "react";

/**
 * Pendaftaran Service Worker di sisi browser.
 *
 * Hanya diaktifkan pada mode PRODUKSI di lingkungan HTTPS atau domain publik.
 * Pada mode PENGEMBANGAN (development / localhost), Service Worker dinonaktifkan
 * dan seluruh cache dibersihkan agar aset HMR Next.js tidak tertahan di cache (stale).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Di development, unregister semua SW dan bersihkan cache agar perubahan kode langsung terbaca
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // Daftarkan setelah window load agar tidak memperlambat First Contentful Paint
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Cek update di background secara periodik
          reg.update().catch(() => {});
        })
        .catch(() => {
          // SW gagal terdaftar (misal mode privat), aplikasi tetap berjalan normal
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

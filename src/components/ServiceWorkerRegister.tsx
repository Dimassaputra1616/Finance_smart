"use client";

import { useEffect } from "react";

/**
 * Pendaftaran Service Worker di sisi browser.
 *
 * Hanya berjalan di browser yang mendukung Service Worker dan di lingkungan
 * HTTPS atau localhost. Membantu PWA terpasang di homescreen HP dan
 * mempercepat loading aset statis.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
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

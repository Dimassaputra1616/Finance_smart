import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";

/**
 * Web App Manifest untuk mode PWA (Progressive Web App).
 *
 * Mengizinkan aplikasi di-install di layar utama ponsel (iOS Safari & Android Chrome)
 * sebagai aplikasi mandiri (standalone), dengan bilah status bernada perbendaharaan.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "Keuangan",
    description: "Sistem pencatatan mutasi kas, persetujuan pengeluaran staf, dan rekonsiliasi likuiditas.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1711",
    theme_color: "#142d22",
    categories: ["finance", "business", "productivity"],
    lang: "id",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

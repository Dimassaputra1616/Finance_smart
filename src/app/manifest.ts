import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/brand";
import { getBrandConfig } from "@/server/brand-storage";

/**
 * Web App Manifest untuk mode PWA (Progressive Web App).
 *
 * Mengizinkan aplikasi di-install di layar utama ponsel (iOS Safari & Android Chrome)
 * sebagai aplikasi mandiri (standalone), dengan bilah status bernada perbendaharaan.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandConfig();
  const iconPath = brand.hasCustomLogo
    ? `/api/brand/logo?v=${brand.logoVersion ?? 1}`
    : "/icon";

  return {
    name: brand.appName || APP_NAME,
    short_name: brand.shortName || "Keuangan",
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
        src: iconPath,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconPath,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: iconPath,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

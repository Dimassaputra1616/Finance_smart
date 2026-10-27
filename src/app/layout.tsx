import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { APP_NAME } from "@/lib/brand";
import { VAULT_INIT_SCRIPT } from "@/lib/vault-gate";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#060e0a" },
  ],
};

export const metadata: Metadata = {
  // `template` membuat tiap halaman cukup menulis judulnya sendiri
  // (mis. "Piutang") dan tab menampilkan "Piutang · Perbendaharaan & Kas".
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description:
    "Sistem pengendalian keuangan internal: transaksi, pos anggaran, rekening operasional, dan persetujuan pengeluaran.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Keuangan",
  },
  formatDetection: {
    telephone: false,
  },
};

/**
 * Skrip anti-kedip. Harus berjalan SEBELUM React meng-hydrate dan sebelum
 * halaman digambar, karena itu placed inline di dalam `<head>`.
 *
 * Prioritas tema tersimpan; bila belum pernah disetel, ikut preferensi
 * sistem operasi.
 */
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    // `suppressHydrationWarning` wajib karena skrip di atas memodifikasi
    // atribut <html> sebelum React hydrate.
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Mematikan gerbang login yang sudah pernah diputar di sesi tab ini,
            sebelum halaman digambar, supaya tidak berkedip. */}
        <script dangerouslySetInnerHTML={{ __html: VAULT_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
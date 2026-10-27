"use client";

import { useEffect, useLayoutEffect } from "react";
import { APP_NAME } from "@/lib/brand";
import {
  VAULT_ATTRIBUTE,
  VAULT_DURATION_MS,
  getSessionStorage,
  hasPlayed,
  markPlayed,
} from "@/lib/vault-gate";
import { BrandMark } from "./BrandMark";

/**
 * Gerbang pembuka di halaman login. Hanya dekorasi: `aria-hidden` dan
 * `pointer-events-none`, jadi tidak pernah menahan klik atau pembaca layar.
 *
 * Diputar sekali per sesi tab (~0,9 detik). Mematikannya lewat atribut di
 * <html> (`html[data-vault-played]` di globals.css) karena tiga jalur:
 *
 * 1. Muat ulang keras: skrip inline di root layout memasang atribut sebelum
 *    halaman digambar.
 * 2. Pindah halaman tanpa muat ulang (mis. setelah keluar): skrip itu tidak
 *    jalan lagi, jadi `useLayoutEffect` di bawah memasangnya sebelum paint.
 * 3. Kunjungan pertama: setelah animasi selesai, sesi ditandai dan atribut
 *    dipasang.
 *
 * Penandaan sengaja menunggu animasi selesai, bukan saat mount. Di mode
 * pengembangan React menjalankan efek dua kali; menandai saat mount akan
 * mematikan gerbang di putaran kedua sebelum sempat terlihat.
 */
export function VaultGate() {
  useLayoutEffect(() => {
    if (hasPlayed(getSessionStorage())) {
      document.documentElement.setAttribute(VAULT_ATTRIBUTE, "1");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      markPlayed(getSessionStorage());
      document.documentElement.setAttribute(VAULT_ATTRIBUTE, "1");
    }, VAULT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="vault-gate pointer-events-none fixed inset-0 z-50 flex overflow-hidden"
    >
      <div className="relative h-full w-1/2 transform-gpu border-r border-sidebar-border bg-sidebar shadow-2xl animate-vault-left">
        <div className="absolute inset-y-0 right-0 w-0.5 bg-linear-to-b from-transparent via-sidebar-brand-to to-transparent opacity-80" />
      </div>

      <div className="relative h-full w-1/2 transform-gpu border-l border-sidebar-border bg-sidebar shadow-2xl animate-vault-right">
        <div className="absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-transparent via-sidebar-brand-to to-transparent opacity-80" />
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 transform-gpu flex-col items-center gap-3 animate-vault-seam">
        <BrandMark className="h-20 w-20 rounded-3xl text-2xl shadow-2xl" />
        <span className="rounded-full border border-sidebar-border bg-sidebar-active px-3.5 py-1 text-xs font-medium tracking-wide text-sidebar-foreground shadow-md">
          {APP_NAME}
        </span>
      </div>
    </div>
  );
}

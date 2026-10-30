"use client";

import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { getBrandLogoUrl, type BrandConfig } from "@/lib/brand-config";
import {
  VAULT_ATTRIBUTE,
  VAULT_DURATION_MS,
  VAULT_STORAGE_KEY,
} from "@/lib/vault-gate";
import { BrandMark } from "./BrandMark";

/**
 * Gerbang pembuka di halaman login. Selalu diputar setiap kali halaman login
 * dibuka atau dimuat ulang (~1 detik), lalu membuka dan menghilang mulus.
 */
export function VaultGate({ brand }: { brand?: BrandConfig }) {
  const [closed, setClosed] = useState(false);

  const appName = brand?.appName ?? APP_NAME;
  const logoUrl = getBrandLogoUrl(brand);

  useEffect(() => {
    // Bersihkan penanda lama agar selalu bisa berputar saat halaman dibuka atau dimuat ulang
    document.documentElement.removeAttribute(VAULT_ATTRIBUTE);
    try {
      window.sessionStorage?.removeItem(VAULT_STORAGE_KEY);
    } catch {}

    const timer = window.setTimeout(() => {
      setClosed(true);
      document.documentElement.setAttribute(VAULT_ATTRIBUTE, "1");
    }, VAULT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (closed) return null;

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
        <BrandMark
          logoUrl={logoUrl}
          hasCustomLogo={brand?.hasCustomLogo}
          shape={brand?.logoShape}
          className="h-20 w-20 rounded-3xl text-2xl shadow-2xl"
        />
        <span className="rounded-full border border-sidebar-border bg-sidebar-active px-3.5 py-1 text-xs font-medium tracking-wide text-sidebar-foreground shadow-md">
          {appName}
        </span>
      </div>
    </div>
  );
}

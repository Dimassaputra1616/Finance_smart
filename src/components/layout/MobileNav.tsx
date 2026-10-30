"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavLinks } from "./NavLinks";
import { MobileUserDropdown } from "./MobileUserDropdown";
import { IconArrowLeft } from "@/components/Icons";
import { BrandMark } from "@/components/auth/BrandMark";
import { APP_NAME } from "@/lib/brand";
import { getBrandLogoUrl, type BrandConfig } from "@/lib/brand-config";
import type { SessionUser } from "@/lib/auth";

/**
 * Pemetaan judul sub-halaman untuk Mobile Navigation Stack.
 */
function getSubpageTitle(path: string): string | null {
  if (path === "/transaksi/baru") return "Catat Mutasi Kas";
  if (path === "/transaksi/transfer") return "Pindah Buku Kas";
  if (path.startsWith("/transaksi/") && path.endsWith("/edit")) return "Ubah Mutasi Kas";
  if (path === "/piutang/baru") return "Tambah Piutang Usaha";
  if (path.startsWith("/piutang/") && path !== "/piutang") return "Detail Piutang Usaha";
  if (path === "/kategori") return "Pos Anggaran";
  if (path === "/pengguna") return "Kelola Pengguna";
  if (path === "/pengaturan" || path.startsWith("/pengaturan/")) return "Config Master";
  return null;
}

/**
 * Header Navigasi Pintar untuk Layar Ponsel & PWA.
 *
 * Menampilkan:
 * 1. Mode Sub-Halaman: Tombol panah kembali [ ← ], judul layar aktif, dan tombol profil tunggal terpadu.
 * 2. Mode Halaman Utama: Identitas perbendaharaan dan tombol profil tunggal terpadu.
 */
export function MobileNav({
  user,
  canManage,
  canManageUsers = false,
  brand,
}: {
  user?: SessionUser | null;
  canManage: boolean;
  canManageUsers?: boolean;
  brand?: BrandConfig;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const subpageTitle = getSubpageTitle(pathname);
  const appName = brand?.appName ?? APP_NAME;
  const logoUrl = getBrandLogoUrl(brand);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-xl lg:hidden">
        {subpageTitle ? (
          /* Header Sub-Halaman Native Stack */
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Kembali ke halaman sebelumnya"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-muted/60 text-foreground transition active:scale-90 cursor-pointer hover:bg-surface-muted"
            >
              <IconArrowLeft className="h-4 w-4" />
            </button>

            <h1 className="truncate text-center text-sm font-semibold tracking-tight text-foreground flex-1">
              {subpageTitle}
            </h1>

            <div className="flex shrink-0 items-center">
              <MobileUserDropdown user={user} canManageUsers={canManageUsers} />
            </div>
          </div>
        ) : (
          /* Header Beranda & Tab Utama */
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <BrandMark
                logoUrl={logoUrl}
                hasCustomLogo={brand?.hasCustomLogo}
                shape={brand?.logoShape}
                className="h-9 w-9 text-[0.7rem] shadow-xs"
              />
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {appName}
              </span>
            </Link>

            <div className="flex shrink-0 items-center">
              <MobileUserDropdown user={user} canManageUsers={canManageUsers} />
            </div>
          </div>
        )}
      </header>

      <MobileTabBar canManage={canManage} />
    </>
  );
}

/**
 * Bilah navigasi pulau melayang (Floating Glass Dock) untuk layar ponsel / PWA.
 */
function MobileTabBar({ canManage }: { canManage: boolean }) {
  return (
    <nav
      aria-label="Navigasi perbendaharaan ponsel"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md lg:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="rounded-3xl border border-border/90 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-border/20">
        <NavLinks variant="tabbar" canManage={canManage} />
      </div>
    </nav>
  );
}

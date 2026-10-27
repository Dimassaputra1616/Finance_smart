"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconArrowLeft, IconUser } from "@/components/Icons";
import { BrandMark } from "@/components/auth/BrandMark";
import { APP_NAME } from "@/lib/brand";

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
  return null;
}

/**
 * Header Navigasi Pintar untuk Layar Ponsel & PWA.
 *
 * Menampilkan:
 * 1. Mode Sub-Halaman: Tombol panah kembali [ ← ], judul layar aktif, dan tombol tema.
 * 2. Mode Halaman Utama: Identitas perbendaharaan, status kas, dan tombol keluar.
 */
export function MobileNav({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const subpageTitle = getSubpageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-xl lg:hidden">
        {subpageTitle ? (
          /* Header Sub-Halaman Native Stack */
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
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
              <ThemeToggle className="min-h-9 min-w-9 p-1.5 rounded-xl border-border/60" />
            </div>
          </div>
        ) : (
          /* Header Beranda & Tab Utama */
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              <BrandMark className="h-9 w-9 text-[0.7rem] shadow-xs" />
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5">
              <ThemeToggle className="min-h-9 min-w-9 p-1.5 rounded-xl border-border/60" />
              <Link
                href="/profil"
                aria-label="Profil dan keamanan"
                title="Profil & Keamanan"
                className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <IconUser className="h-5 w-5" />
              </Link>
              <LogoutButton isCollapsed className="p-1.5 min-h-9 min-w-9 rounded-xl" />
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
      <div className="rounded-3xl border border-border/90 bg-surface/90 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:bg-[#0c1a14]/92 dark:ring-white/10">
        <NavLinks variant="tabbar" canManage={canManage} />
      </div>
    </nav>
  );
}

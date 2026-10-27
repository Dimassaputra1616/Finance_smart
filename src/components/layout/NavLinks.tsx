"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCategory,
  IconDashboard,
  IconReceivable,
  IconTransactions,
  IconUser,
  IconWallet,
} from "@/components/Icons";
import { cx } from "@/components/ui/Card";
import { MobileActionSheet } from "./MobileActionSheet";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof IconDashboard;
  /** Hanya tampil untuk Administrator. Staf tidak melihat tautannya. */
  adminOnly?: boolean;
};

const LINKS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Beranda", icon: IconDashboard },
  { href: "/transaksi", label: "Jurnal Kas", shortLabel: "Jurnal", icon: IconTransactions },
  { href: "/piutang", label: "Piutang Usaha", shortLabel: "Piutang", icon: IconReceivable, adminOnly: true },
  { href: "/kategori", label: "Pos Anggaran", shortLabel: "Anggaran", icon: IconCategory, adminOnly: true },
  { href: "/akun", label: "Rekening & Kas", shortLabel: "Rekening", icon: IconWallet, adminOnly: true },
  { href: "/profil", label: "Profil & Keamanan", shortLabel: "Profil", icon: IconUser },
];

type NavVariant = "sidebar" | "tabbar";

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Ambil tautan menurut urutan `hrefs` yang diminta. */
function pick(...hrefs: string[]): NavItem[] {
  return hrefs.flatMap((href) => LINKS.filter((link) => link.href === href));
}

/**
 * Daftar navigasi utama.
 *
 * Harus Client Component karena penandaan rute aktif memakai `usePathname()`.
 *
 * `sidebar` untuk layar lebar, `tabbar` untuk floating dock di layar HP/PWA.
 * `canManage` (Administrator) menentukan tautan admin-only ikut tampil atau
 * tidak. Ini hanya merapikan tampilan; yang menjaga data adalah `adminGuard()`
 * di Server Action dan `isAdminSession()` di halamannya.
 */
export function NavLinks({
  variant = "sidebar",
  isCollapsed = false,
  canManage,
}: {
  variant?: NavVariant;
  isCollapsed?: boolean;
  canManage: boolean;
}) {
  const pathname = usePathname();

  if (variant === "tabbar") {
    const leftLinks = pick("/", "/transaksi");
    // Staf tidak punya Piutang dan Rekening, jadi sisi kanan diisi Profil.
    const rightLinks = canManage ? pick("/piutang", "/akun") : pick("/profil");

    const renderTab = (link: NavItem) => {
      const isActive = isActivePath(pathname, link.href);
      const Icon = link.icon;

      return (
        <li key={link.href} className="flex-1 min-w-0">
          <Link
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cx(
              "relative flex min-h-[48px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl py-1 px-0.5 transition-all duration-200 active:scale-90",
              isActive
                ? "bg-[#142d22] text-[#f7f5ed] shadow-xs dark:bg-[#e8c77b] dark:text-[#060e0a]"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/40",
            )}
          >
            <Icon
              className={cx(
                "h-[1.2rem] w-[1.2rem] shrink-0 transition-transform duration-200",
                isActive ? "scale-105" : "opacity-75",
              )}
            />
            <span className="truncate text-[10px] font-medium leading-none tracking-tight">
              {link.shortLabel}
            </span>
          </Link>
        </li>
      );
    };

    return (
      <ul className="flex items-center justify-between gap-1">
        {leftLinks.map(renderTab)}
        <li className="shrink-0 flex items-center justify-center">
          <MobileActionSheet canManage={canManage} />
        </li>
        {rightLinks.map(renderTab)}
      </ul>
    );
  }

  return (
    <ul className="space-y-1.5">
      {LINKS.filter((link) => canManage || !link.adminOnly).map((link) => {
        const isActive = isActivePath(pathname, link.href);
        const Icon = link.icon;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              title={link.label}
              className={cx(
                "group relative flex min-h-10 items-center rounded-xl text-xs font-medium transition duration-150",
                isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-sidebar-active text-sidebar-active-foreground font-semibold shadow-xs border border-sidebar-border"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              )}
            >
              {/* Indikator aktif di kiri saat terbuka */}
              {!isCollapsed && isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-sidebar-brand-from"
                />
              )}
              <Icon
                className={cx(
                  "h-4 w-4 shrink-0 transition-transform duration-150",
                  isActive
                    ? "text-sidebar-brand-from ml-1"
                    : "text-sidebar-subtle group-hover:scale-105 group-hover:text-sidebar-foreground",
                )}
              />
              {!isCollapsed && (
                <span className="truncate leading-none tracking-tight">{link.label}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

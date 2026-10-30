"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconArrowDown,
  IconArrowUp,
  IconCategory,
  IconChevronDown,
  IconClock,
  IconDashboard,
  IconDownload,
  IconMail,
  IconReceipt,
  IconReceivable,
  IconShield,
  IconSliders,
  IconSparkle,
  IconTransactions,
  IconTransfer,
  IconUser,
  IconUsers,
  IconWallet,
} from "@/components/Icons";
import { cx } from "@/components/ui/Card";
import { MobileActionSheet } from "./MobileActionSheet";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof IconDashboard;
  /** Tampil untuk Administrator dan Direktur. */
  adminOnly?: boolean;
  /** Khusus Super Admin saja. */
  superAdminOnly?: boolean;
};

type SubNavItem = {
  href: string;
  label: string;
  icon: typeof IconSparkle;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
};

/** Sub-menu di dalam modul dropdown Jurnal Kas (Transaksi Masuk & Keluar). */
const JOURNAL_SUB_ITEMS: SubNavItem[] = [
  { href: "/transaksi", label: "Semua Mutasi", icon: IconTransactions },
  { href: "/transaksi?jenis=INCOME", label: "Kas Masuk (Inflow)", icon: IconArrowDown },
  { href: "/transaksi?jenis=EXPENSE", label: "Kas Keluar (Outflow)", icon: IconArrowUp },
  { href: "/transaksi/transfer", label: "Pindah Buku", icon: IconTransfer, adminOnly: true },
  { href: "/transaksi?status=PENDING", label: "Persetujuan Direktur", icon: IconClock },
];

/** Sub-menu di dalam modul dropdown Config Master. */
const CONFIG_SUB_ITEMS: SubNavItem[] = [
  { href: "/pengaturan?tab=brand", label: "Identitas & Logo", icon: IconSparkle },
  { href: "/pengaturan?tab=company", label: "Profil Badan Usaha", icon: IconReceipt },
  { href: "/pengaturan?tab=approval", label: "Approval & Otorisasi", icon: IconShield },
  { href: "/pengaturan?tab=finance", label: "Rekening & Pajak", icon: IconWallet },
  { href: "/pengaturan?tab=telegram", label: "Notifikasi Telegram", icon: IconMail },
  { href: "/pengaturan?tab=ai", label: "Integrasi AI Vision", icon: IconSparkle },
  { href: "/pengaturan?tab=backup", label: "Cadangan Database", icon: IconDownload },
  { href: "/kategori", label: "Pos Anggaran & Pagu", icon: IconCategory },
  { href: "/akun", label: "Rekening Bank & Kas", icon: IconWallet },
  { href: "/pengguna", label: "Kelola Pengguna", icon: IconUsers, superAdminOnly: true },
];

/** Tautan akun profil di bagian bawah. */
const BOTTOM_LINK: NavItem = {
  href: "/profil",
  label: "Profil & Keamanan",
  shortLabel: "Profil",
  icon: IconUser,
};

/** Tautan lengkap untuk kebutuhan Mobile Tab Bar. */
const ALL_LINKS: NavItem[] = [
  { href: "/", label: "Dashboard", shortLabel: "Beranda", icon: IconDashboard },
  { href: "/transaksi", label: "Jurnal Kas", shortLabel: "Jurnal", icon: IconTransactions },
  { href: "/piutang", label: "Piutang Usaha", shortLabel: "Piutang", icon: IconReceivable, adminOnly: true },
  { href: "/kategori", label: "Pos Anggaran", shortLabel: "Anggaran", icon: IconCategory, adminOnly: true },
  { href: "/akun", label: "Rekening & Kas", shortLabel: "Rekening", icon: IconWallet, adminOnly: true },
  { href: "/pengaturan", label: "Config Master", shortLabel: "Config", icon: IconSliders, superAdminOnly: true },
  { href: "/pengguna", label: "Kelola Pengguna", shortLabel: "Pengguna", icon: IconUsers, superAdminOnly: true },
  BOTTOM_LINK,
];

type NavVariant = "sidebar" | "tabbar";

function isActivePath(pathname: string, href: string): boolean {
  const baseHref = href.split("?")[0];
  return baseHref === "/" ? pathname === "/" : pathname.startsWith(baseHref);
}

/** Mengecek apakah sebuah sub-item aktif secara persis berdasarkan pathname dan query string. */
function isSubItemActive(pathname: string, href: string, currentQuery: string): boolean {
  const [baseHref, hrefQuery] = href.split("?");

  if (hrefQuery) {
    return pathname === baseHref && currentQuery.includes(hrefQuery);
  }

  // Jika href tanpa query (misal `/transaksi`), hanya aktif jika tidak ada filter jenis/status
  if (baseHref === "/transaksi") {
    return (
      pathname === "/transaksi" &&
      (!currentQuery || (!currentQuery.includes("jenis=") && !currentQuery.includes("status=")))
    );
  }

  if (baseHref === "/pengaturan") {
    return (
      pathname === "/pengaturan" &&
      (!currentQuery || !currentQuery.includes("tab="))
    );
  }

  return pathname === baseHref;
}

/** Ambil tautan menurut urutan `hrefs` yang diminta. */
function pick(...hrefs: string[]): NavItem[] {
  return hrefs.flatMap((href) => ALL_LINKS.filter((link) => link.href === href));
}

/**
 * Daftar navigasi utama dengan Dropdown Accordion Sub-Menu untuk:
 * 1. Jurnal Kas (Semua Mutasi, Kas Masuk, Kas Keluar, Pindah Buku, Approval)
 * 2. Config Master (Brand, Perusahaan, Approval, Rekening, Telegram, Backup, Master Data)
 */
export function NavLinks({
  variant = "sidebar",
  isCollapsed = false,
  canManage,
  canManageUsers = false,
}: {
  variant?: NavVariant;
  isCollapsed?: boolean;
  canManage: boolean;
  canManageUsers?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Query string di browser untuk penandaan sub-menu aktif
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentQuery(window.location.search);
      const onPopState = () => setCurrentQuery(window.location.search);
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, [pathname]);

  // Deteksi apakah rute aktif saat ini berada di dalam rumpun Jurnal Kas
  const isJournalRouteActive = pathname.startsWith("/transaksi");

  // Deteksi apakah rute aktif saat ini berada di dalam rumpun Config Master
  const isConfigRouteActive =
    pathname.startsWith("/pengaturan") ||
    pathname.startsWith("/kategori") ||
    pathname.startsWith("/akun") ||
    pathname.startsWith("/pengguna");

  // State dropdown terbuka/tertutup (otomatis sinkron sesuai rute yang aktif)
  const [isJournalOpen, setIsJournalOpen] = useState(isJournalRouteActive);
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigRouteActive);

  // Saat berpindah rute:
  // - Jika masuk ke rumpun Jurnal Kas -> Jurnal Kas terbuka, Config Master tertutup
  // - Jika masuk ke rumpun Config Master -> Config Master terbuka, Jurnal Kas tertutup
  // - Jika berada di menu lain (Dashboard, Piutang, Profil) -> keduanya otomatis tertutup
  useEffect(() => {
    setIsJournalOpen(isJournalRouteActive);
    setIsConfigOpen(isConfigRouteActive);
  }, [pathname, isJournalRouteActive, isConfigRouteActive]);

  // -------------------------------------------------------------
  // 1. TAMPILAN MOBILE FLOATING TAB BAR
  // -------------------------------------------------------------
  if (variant === "tabbar") {
    const leftLinks = pick("/", "/transaksi");
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
                ? "bg-sidebar-brand-from text-sidebar-brand-foreground shadow-xs font-semibold"
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
          <MobileActionSheet canManage={canManage} canManageUsers={canManageUsers} />
        </li>
        {rightLinks.map(renderTab)}
      </ul>
    );
  }

  // -------------------------------------------------------------
  // 2. TAMPILAN SIDEBAR DESKTOP DENGAN ACCORDION DROPDOWN SUB-MENU
  // -------------------------------------------------------------
  const visibleJournalSubItems = JOURNAL_SUB_ITEMS.filter((item) => {
    if (item.adminOnly) return Boolean(canManage);
    return true;
  });

  const visibleConfigSubItems = CONFIG_SUB_ITEMS.filter((item) => {
    if (item.superAdminOnly) return Boolean(canManageUsers);
    return true;
  });

  const isDashboardActive = pathname === "/";
  const isPiutangActive = pathname.startsWith("/piutang");
  const isProfileActive = pathname.startsWith("/profil");

  return (
    <ul className="space-y-1.5">
      {/* 1. Dashboard (Beranda) */}
      <li>
        <Link
          href="/"
          onClick={() => {
            setIsJournalOpen(false);
            setIsConfigOpen(false);
          }}
          aria-current={isDashboardActive ? "page" : undefined}
          title="Dashboard"
          className={cx(
            "group relative flex min-h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out",
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5",
            isDashboardActive
              ? "bg-sidebar-active text-sidebar-foreground font-semibold shadow-xs border border-sidebar-border/80 scale-[1.01]"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/80 hover:translate-x-1 hover:shadow-2xs",
          )}
        >
          <IconDashboard
            className={cx(
              "h-5 w-5 shrink-0 transition-all duration-200 ease-out",
              isDashboardActive
                ? "text-sidebar-brand-from scale-110"
                : "text-sidebar-subtle group-hover:scale-110 group-hover:text-sidebar-brand-from",
            )}
          />
          {!isCollapsed && (
            <span className="truncate leading-none tracking-tight transition-colors duration-200 text-sm">
              Dashboard
            </span>
          )}
        </Link>
      </li>

      {/* ======================================================== */}
      {/* 2. DROPDOWN SUB-MENU: JURNAL KAS (TRANSAKSI KELUAR MASUK) */}
      {/* ======================================================== */}
      <li>
        <button
          type="button"
          onClick={() => {
            if (isCollapsed) {
              router.push("/transaksi");
            } else {
              setIsJournalOpen(!isJournalOpen);
            }
          }}
          aria-expanded={isJournalOpen}
          aria-label="Menu Jurnal Kas"
          title="Jurnal Kas"
          className={cx(
            "group relative flex w-full min-h-11 items-center justify-between rounded-xl text-sm font-medium transition-all duration-200 ease-out cursor-pointer",
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5",
            isJournalRouteActive
              ? "bg-sidebar-active/70 text-sidebar-foreground font-semibold border border-sidebar-border/80 shadow-2xs"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/80",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <IconTransactions
              className={cx(
                "h-5 w-5 shrink-0 transition-all duration-200",
                isJournalRouteActive
                  ? "text-sidebar-brand-from scale-110"
                  : "text-sidebar-subtle group-hover:scale-110 group-hover:text-sidebar-brand-from",
              )}
            />
            {!isCollapsed && (
              <span className="truncate leading-none tracking-tight text-sm">
                Jurnal Kas
              </span>
            )}
          </div>

          {!isCollapsed && (
            <IconChevronDown
              className={cx(
                "h-4 w-4 shrink-0 transition-transform duration-200 text-sidebar-muted group-hover:text-sidebar-foreground",
                isJournalOpen ? "rotate-180 text-sidebar-foreground" : "",
              )}
            />
          )}
        </button>

        {/* Daftar Sub-Menu Jurnal Kas (Keluar Masuk & Approval) */}
        {!isCollapsed && isJournalOpen && (
          <ul className="relative ml-4 mt-1.5 space-y-1 border-l-2 border-sidebar-border/70 pl-3 animate-fade-in">
            {visibleJournalSubItems.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = isSubItemActive(pathname, sub.href, currentQuery);

              return (
                <li key={sub.href}>
                  <Link
                    href={sub.href}
                    onClick={() => {
                      const [, q] = sub.href.split("?");
                      setCurrentQuery(q ? `?${q}` : "");
                    }}
                    aria-current={isSubActive ? "page" : undefined}
                    title={sub.label}
                    className={cx(
                      "group flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                      isSubActive
                        ? "bg-sidebar-active text-sidebar-foreground font-semibold shadow-2xs border border-sidebar-border/60"
                        : "text-sidebar-muted hover:bg-sidebar-hover/70 hover:text-sidebar-foreground hover:translate-x-0.5",
                    )}
                  >
                    <SubIcon
                      className={cx(
                        "h-3.5 w-3.5 shrink-0 transition-colors duration-150",
                        isSubActive
                          ? "text-sidebar-brand-from"
                          : sub.href.includes("jenis=INCOME")
                            ? "text-income"
                            : sub.href.includes("jenis=EXPENSE")
                              ? "text-expense"
                              : "text-sidebar-subtle group-hover:text-sidebar-brand-from",
                      )}
                    />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>

      {/* 3. Piutang Usaha (Administrator & Direktur) */}
      {canManage && (
        <li>
          <Link
            href="/piutang"
            onClick={() => {
              setIsJournalOpen(false);
              setIsConfigOpen(false);
            }}
            aria-current={isPiutangActive ? "page" : undefined}
            title="Piutang Usaha"
            className={cx(
              "group relative flex min-h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out",
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5",
              isPiutangActive
                ? "bg-sidebar-active text-sidebar-foreground font-semibold shadow-xs border border-sidebar-border/80 scale-[1.01]"
                : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/80 hover:translate-x-1 hover:shadow-2xs",
            )}
          >
            <IconReceivable
              className={cx(
                "h-5 w-5 shrink-0 transition-all duration-200 ease-out",
                isPiutangActive
                  ? "text-sidebar-brand-from scale-110"
                  : "text-sidebar-subtle group-hover:scale-110 group-hover:text-sidebar-brand-from",
              )}
            />
            {!isCollapsed && (
              <span className="truncate leading-none tracking-tight transition-colors duration-200 text-sm">
                Piutang Usaha
              </span>
            )}
          </Link>
        </li>
      )}

      {/* ======================================================== */}
      {/* 4. DROPDOWN SUB-MENU: CONFIG MASTER (KHUSUS SUPER ADMIN)  */}
      {/* ======================================================== */}
      {canManageUsers && (
        <li className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                router.push("/pengaturan");
              } else {
                setIsConfigOpen(!isConfigOpen);
              }
            }}
            aria-expanded={isConfigOpen}
            aria-label="Menu Config Master"
            title="Config Master"
            className={cx(
              "group relative flex w-full min-h-11 items-center justify-between rounded-xl text-sm font-medium transition-all duration-200 ease-out cursor-pointer",
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5",
              isConfigRouteActive
                ? "bg-sidebar-active/70 text-sidebar-foreground font-semibold border border-sidebar-border/80 shadow-2xs"
                : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/80",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <IconSliders
                className={cx(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  isConfigRouteActive
                    ? "text-sidebar-brand-from scale-110"
                    : "text-sidebar-subtle group-hover:scale-110 group-hover:text-sidebar-brand-from",
                )}
              />
              {!isCollapsed && (
                <span className="truncate leading-none tracking-tight text-sm">
                  Config Master
                </span>
              )}
            </div>

            {!isCollapsed && (
              <IconChevronDown
                className={cx(
                  "h-4 w-4 shrink-0 transition-transform duration-200 text-sidebar-muted group-hover:text-sidebar-foreground",
                  isConfigOpen ? "rotate-180 text-sidebar-foreground" : "",
                )}
              />
            )}
          </button>

          {/* Daftar Sub-Menu Config Master */}
          {!isCollapsed && isConfigOpen && (
            <ul className="relative ml-4 mt-1.5 space-y-1 border-l-2 border-sidebar-border/70 pl-3 animate-fade-in">
              {visibleConfigSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = isSubItemActive(pathname, sub.href, currentQuery);

                return (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={() => {
                        const [, q] = sub.href.split("?");
                        setCurrentQuery(q ? `?${q}` : "");
                      }}
                      aria-current={isSubActive ? "page" : undefined}
                      title={sub.label}
                      className={cx(
                        "group flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                        isSubActive
                          ? "bg-sidebar-active text-sidebar-foreground font-semibold shadow-2xs border border-sidebar-border/60"
                          : "text-sidebar-muted hover:bg-sidebar-hover/70 hover:text-sidebar-foreground hover:translate-x-0.5",
                      )}
                    >
                      <SubIcon
                        className={cx(
                          "h-3.5 w-3.5 shrink-0 transition-colors duration-150",
                          isSubActive
                            ? "text-sidebar-brand-from"
                            : "text-sidebar-subtle group-hover:text-sidebar-brand-from",
                        )}
                      />
                      <span className="truncate">{sub.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      )}

      {/* 5. Tautan Profil & Keamanan Pengguna */}
      <li className="pt-0.5">
        <Link
          href={BOTTOM_LINK.href}
          onClick={() => {
            setIsJournalOpen(false);
            setIsConfigOpen(false);
          }}
          aria-current={isProfileActive ? "page" : undefined}
          title={BOTTOM_LINK.label}
          className={cx(
            "group relative flex min-h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out",
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5",
            isProfileActive
              ? "bg-sidebar-active text-sidebar-foreground font-semibold shadow-xs border border-sidebar-border/80 scale-[1.01]"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/80 hover:translate-x-1 hover:shadow-2xs",
          )}
        >
          <BOTTOM_LINK.icon
            className={cx(
              "h-5 w-5 shrink-0 transition-all duration-200 ease-out",
              isProfileActive
                ? "text-sidebar-brand-from scale-110"
                : "text-sidebar-subtle group-hover:scale-110 group-hover:text-sidebar-brand-from",
            )}
          />
          {!isCollapsed && (
            <span className="truncate leading-none tracking-tight transition-colors duration-200 text-sm">
              {BOTTOM_LINK.label}
            </span>
          )}
        </Link>
      </li>
    </ul>
  );
}

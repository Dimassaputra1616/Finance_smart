"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { NavLinks } from "./NavLinks";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { IconArrowLeft, IconArrowRight, IconShield, IconUser } from "@/components/Icons";
import { cx } from "@/components/ui/Card";
import type { SessionUser } from "@/lib/auth";
import { BrandMark } from "@/components/auth/BrandMark";
import { APP_NAME } from "@/lib/brand";
import { getBrandLogoUrl, type BrandConfig } from "@/lib/brand-config";
import { canManageMasterData, canManageUsers } from "@/lib/transaction-rules";
import { USER_ROLE_LABELS } from "@/lib/types";
import { UserAvatar } from "@/components/users/UserAvatar";

/**
 * Sidebar Enterprise Layar Lebar: Rapi, modern, jelas terbaca di laptop.
 *
 * - Tombol kuncup/perluas dipasang tepat di garis pembatas (border seam) ala Linear/Notion.
 * - Header identitas bersih dan lapang tanpa terhimpit tombol.
 * - Navigasi menu utama dengan animasi hover modern (glide & scale).
 * - Bagian bawah menyatukan profil pengguna, tautan akun, dan tombol keluar.
 */
export function SidebarNav({
  user,
  brand,
}: {
  user?: SessionUser | null;
  brand?: BrandConfig;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const appName = brand?.appName ?? APP_NAME;
  const appTagline = brand?.appTagline ?? "Sistem Keuangan Internal";
  const logoUrl = getBrandLogoUrl(brand);

  return (
    <aside
      className={cx(
        "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar-2 text-sidebar-foreground shadow-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block z-30",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      {/* Tombol Kuncup / Perluas Persis di Garis Pembatas (Border Seam Button) */}
      <button
        type="button"
        className={cx(
          "absolute -right-3.5 top-6.5 z-40 grid h-7 w-7 place-items-center rounded-full border border-sidebar-border bg-surface text-foreground shadow-xs transition-all duration-200 hover:scale-115 hover:border-primary/50 hover:text-primary active:scale-90 cursor-pointer",
          isCollapsed
            ? "opacity-100 ring-2 ring-primary/20"
            : "opacity-75 hover:opacity-100",
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Perluas bilah samping" : "Kuncupkan bilah samping"}
        title={isCollapsed ? "Perluas bilah samping" : "Kuncupkan bilah samping"}
      >
        {isCollapsed ? (
          <IconArrowRight className="h-3.5 w-3.5" />
        ) : (
          <IconArrowLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="relative flex h-full flex-col justify-between p-4.5 overflow-hidden">
        {/* ======================================================== */}
        {/* BAGIAN ATAS: LOGO PERUSAHAAN                             */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div
            className={cx(
              "flex items-center pb-1",
              isCollapsed ? "justify-center" : "gap-3",
            )}
          >
            <Link
              href="/"
              title={appName}
              className="group flex items-center gap-3 rounded-2xl min-w-0"
            >
              <BrandMark
                logoUrl={logoUrl}
                hasCustomLogo={brand?.hasCustomLogo}
                shape={brand?.logoShape}
                className="h-10 w-10 text-sm shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="block truncate text-base font-bold tracking-tight text-sidebar-foreground transition-colors duration-200 group-hover:text-sidebar-brand-from">
                    {appName}
                  </span>
                  <span className="block truncate text-xs text-sidebar-muted">
                    {appTagline}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* ======================================================== */}
          {/* NAVIGASI MENU UTAMA (Dengan Tipografi Jelas & Hover)     */}
          {/* ======================================================== */}
          <nav
            aria-label="Navigasi perbendaharaan"
            className="min-h-0 flex-1 overflow-y-auto pt-2"
          >
            <NavLinks
              variant="sidebar"
              isCollapsed={isCollapsed}
              canManage={canManageMasterData(user?.role)}
              canManageUsers={canManageUsers(user?.role)}
            />
          </nav>
        </div>

        {/* ======================================================== */}
        {/* BAGIAN BAWAH: AKUN PENGGUNA TERPADU & KELUAR (ICON ONLY) */}
        {/* ======================================================== */}
        {user && (
          <div className="border-t border-sidebar-border/80 pt-3">
            {!isCollapsed ? (
              <div className="group flex items-center justify-between gap-2 rounded-2xl border border-sidebar-border/80 bg-sidebar-active/70 p-2 shadow-2xs backdrop-blur-md transition-all duration-200 hover:bg-sidebar-active hover:border-sidebar-border hover:shadow-xs">
                {/* Informasi Pengguna (Dapat diklik menuju profil) */}
                <Link
                  href="/profil"
                  title="Lihat Profil & Keamanan"
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/user"
                >
                  <UserAvatar
                    userId={user.id}
                    name={user.name}
                    size="md"
                    className="transition-transform duration-200 group-hover/user:scale-105"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-sidebar-foreground transition-colors duration-150 group-hover/user:text-sidebar-brand-from leading-tight">
                      {user.name}
                    </p>
                    <div className="mt-1 flex items-center">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap",
                          user.role === "ADMIN"
                            ? "bg-income-soft text-income border border-income/25"
                            : user.role === "DIRECTOR"
                              ? "bg-sidebar-brand-from/15 text-sidebar-brand-from border border-sidebar-brand-from/30 font-semibold"
                              : "bg-surface-muted text-muted-foreground border border-border/80",
                        )}
                      >
                        <IconShield className="h-2.5 w-2.5 shrink-0" />
                        <span>{USER_ROLE_LABELS[user.role] ?? user.role}</span>
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Aksi Cepat: Notifikasi, Akun (Profil) & Keluar (Logout) sebagai Ikon Ramping */}
                <div className="flex items-center gap-0.5 shrink-0 pl-1.5 border-l border-sidebar-border/60">
                  <NotificationBell className="min-h-7 min-w-7 h-7 w-7 rounded-lg border-transparent hover:border-sidebar-border/80 text-sidebar-muted" />

                  <Link
                    href="/profil"
                    title="Pengaturan Akun & Keamanan"
                    aria-label="Pengaturan Akun & Keamanan"
                    className="grid h-7 w-7 place-items-center rounded-lg text-sidebar-muted transition-all duration-150 hover:bg-sidebar-hover hover:text-sidebar-foreground hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <IconUser className="h-4 w-4" />
                  </Link>

                  <LogoutButton
                    iconOnly
                    className="grid h-7 w-7 place-items-center rounded-lg text-sidebar-muted transition-all duration-150 hover:bg-destructive-soft hover:text-destructive hover:scale-110 active:scale-95 cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Mode Kuncup (Collapsed) */
              <div className="flex flex-col items-center gap-2">
                <NotificationBell className="min-h-8 min-w-8 h-8 w-8 rounded-xl border-transparent hover:border-sidebar-border/80 text-sidebar-muted" />

                <Link
                  href="/profil"
                  title={`${user.name} (${USER_ROLE_LABELS[user.role] ?? user.role})`}
                  className="transition-transform duration-200 hover:scale-110 cursor-pointer"
                >
                  <UserAvatar userId={user.id} name={user.name} size="md" />
                </Link>

                <LogoutButton
                  iconOnly
                  className="grid h-8 w-8 place-items-center rounded-xl text-sidebar-muted transition-all duration-150 hover:bg-destructive-soft hover:text-destructive hover:scale-110 active:scale-95 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

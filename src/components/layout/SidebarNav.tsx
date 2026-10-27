"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconArrowLeft, IconArrowRight, IconShield } from "@/components/Icons";
import { cx } from "@/components/ui/Card";
import type { SessionUser } from "@/lib/auth";
import { BrandMark } from "@/components/auth/BrandMark";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { canManageMasterData } from "@/lib/transaction-rules";

/**
 * Sidebar Enterprise Layar Lebar.
 *
 * Mengusung gaya perbendaharaan arsitektural:
 * - Bersih, bebas dari gradien cyan/lavender neon.
 * - Header korporat dengan kartu profil eksekutif terintegrasi.
 * - Mendukung mode kuncup (collapsed: w-20) dan diperluas (expanded: w-72).
 */
export function SidebarNav({ user }: { user?: SessionUser | null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cx(
        "sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar-2 text-sidebar-foreground shadow-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      <div className="relative flex h-full flex-col justify-between p-4">
        {/* ======================================================== */}
        {/* BAGIAN ATAS: LOGO PERUSAHAAN & TOGGLE COLLAPSE */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div
            className={cx(
              "flex items-center",
              isCollapsed
                ? "flex-col gap-3 items-center"
                : "justify-between gap-2 pb-2",
            )}
          >
            <Link
              href="/"
              title={APP_NAME}
              className="group flex items-center gap-3 rounded-2xl min-w-0"
            >
              <BrandMark className="h-10 w-10 text-xs shadow-xs transition duration-200 group-hover:scale-105" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                    {APP_NAME}
                  </span>
                  <span className="block truncate text-[11px] text-sidebar-muted">
                    {APP_TAGLINE}
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-xl border border-sidebar-border/60 bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors duration-150 cursor-pointer"
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
          </div>

          {/* ======================================================== */}
          {/* KARTU PROFIL USER EKSEKUTIF (APPROVER / STAF) */}
          {/* ======================================================== */}
          {user && !isCollapsed && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-sidebar-border bg-sidebar-active p-2.5 shadow-2xs">
              <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sidebar-brand-from text-sidebar-brand-foreground text-xs font-bold font-mono shadow-xs">
                {user.name.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-income ring-2 ring-sidebar-active" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-sidebar-foreground">
                  {user.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase font-mono",
                      user.role === "ADMIN"
                        ? "bg-income-soft text-income"
                        : "bg-sidebar-hover text-sidebar-muted",
                    )}
                  >
                    <IconShield className="h-2.5 w-2.5" />
                    {user.role === "ADMIN" ? "Approver" : "Staf"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {user && isCollapsed && (
            <div
              title={`${user.name} (${user.role === "ADMIN" ? "Approver" : "Staf"})`}
              className="relative grid h-9 w-9 mx-auto place-items-center rounded-xl bg-sidebar-brand-from text-sidebar-brand-foreground text-xs font-bold font-mono shadow-xs cursor-default"
            >
              {user.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-income ring-2 ring-sidebar" />
            </div>
          )}

          {/* ======================================================== */}
          {/* NAVIGASI MENU UTAMA */}
          {/* ======================================================== */}
          <nav
            aria-label="Navigasi perbendaharaan"
            className="min-h-0 flex-1 overflow-y-auto pt-1"
          >
            <NavLinks
              variant="sidebar"
              isCollapsed={isCollapsed}
              canManage={canManageMasterData(user?.role)}
            />
          </nav>
        </div>

        {/* ======================================================== */}
        {/* BAGIAN BAWAH: STATUS PERBENDAHARAAN & KELUAR */}
        {/* ======================================================== */}
        <div className="space-y-2 border-t border-sidebar-border pt-4">
          <div
            className={cx(
              "flex items-center rounded-2xl border border-sidebar-border/80 bg-sidebar-active/60 p-2",
              isCollapsed
                ? "justify-center"
                : "justify-between gap-2 px-3",
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-income animate-pulse shrink-0" />
                <span className="truncate text-xs font-medium text-sidebar-muted font-mono">
                  Sistem Aktif
                </span>
              </div>
            )}
            <ThemeToggle className="border-sidebar-border/70 bg-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground" />
          </div>

          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
}

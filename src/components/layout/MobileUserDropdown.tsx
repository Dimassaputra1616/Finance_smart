"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconBell,
  IconCheck,
  IconClock,
  IconMoon,
  IconReceipt,
  IconScale,
  IconShield,
  IconSliders,
  IconSparkle,
  IconSun,
  IconUser,
} from "@/components/Icons";
import { UserAvatar } from "@/components/users/UserAvatar";
import { cx } from "@/components/ui/Card";
import { logout } from "@/server/actions/auth";
import { USER_ROLE_LABELS } from "@/lib/types";
import type { SessionUser } from "@/lib/auth";
import type { AppNotification } from "@/server/notifications-storage";

const STORAGE_KEY = "theme";

/**
 * Menu Dropdown Profil Terpadu untuk Layar Ponsel & PWA.
 *
 * Menggantikan deretan tombol yang ramai di header atas dengan 1 tombol logo profil elegan.
 * Di dalamnya menyatukan:
 * 1. Info Akun & Peran Otorisasi (Super Admin / Direktur / Staf)
 * 2. Notifikasi Aplikasi (Pemberitahuan kas & approval)
 * 3. Pengalih Tema (Mode Terang & Gelap)
 * 4. Pintasan Config Master (khusus Super Admin)
 * 5. Tautan Profil & Keamanan
 * 6. Keluar dari Sesi (Logout)
 */
export function MobileUserDropdown({
  user,
  canManageUsers = false,
}: {
  user?: SessionUser | null;
  canManageUsers?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "notifications">("menu");
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inisialisasi tema
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Ambil notifikasi
  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setView("menu");
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read_all" }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "approval":
        return <IconClock className="h-3.5 w-3.5 text-warning" />;
      case "budget":
        return <IconScale className="h-3.5 w-3.5 text-destructive" />;
      case "transaction":
        return <IconReceipt className="h-3.5 w-3.5 text-income" />;
      default:
        return <IconSparkle className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Baru saja";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam`;
      return `${Math.floor(diffSec / 86400)} hari`;
    } catch {
      return "";
    }
  };

  const userName = user?.name || "Pengguna";
  const userRole = user?.role || "STAFF";
  const roleLabel = USER_ROLE_LABELS[userRole] ?? userRole;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Utama: Avatar Profil Tunggal di Header */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setView("menu");
          if (!isOpen) fetchNotifications();
        }}
        aria-label={`Menu profil ${userName}`}
        title={`Profil ${userName}`}
        className="relative grid min-h-11 min-w-11 place-items-center cursor-pointer transition active:scale-90"
      >
        <div className="relative">
          {user ? (
            <UserAvatar
              userId={user.id}
              name={userName}
              size="md"
              className={cx(
                "h-9 w-9 ring-2 transition-all duration-200",
                isOpen
                  ? "ring-primary shadow-md scale-105"
                  : "ring-border/80 hover:ring-primary/50 shadow-xs",
              )}
            />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-muted text-muted-foreground border border-border">
              <IconUser className="h-5 w-5" />
            </div>
          )}

          {/* Badge Notifikasi Belum Dibaca pada Avatar */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold font-mono text-white ring-2 ring-surface shadow-xs animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Popover Dropdown Menu Terpadu */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-3xl border border-border/80 bg-surface/95 p-3 shadow-2xl backdrop-blur-2xl animate-fade-in text-foreground"
        >
          {view === "menu" ? (
            <div className="space-y-2">
              {/* 1. Header Informasi Akun Pengguna */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-muted/50 border border-border/60">
                {user ? (
                  <UserAvatar userId={user.id} name={userName} size="md" className="h-10 w-10 shrink-0" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground border border-border">
                    <IconUser className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground leading-tight">
                    {userName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground font-mono mt-0.5">
                    {user?.username}
                  </p>
                  <div className="mt-1 flex items-center">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase",
                        userRole === "ADMIN"
                          ? "bg-income-soft text-income border border-income/25"
                          : userRole === "DIRECTOR"
                            ? "bg-sidebar-brand-from/15 text-sidebar-brand-from border border-sidebar-brand-from/30 font-bold"
                            : "bg-surface-muted text-muted-foreground border border-border/80",
                      )}
                    >
                      <IconShield className="h-2.5 w-2.5" />
                      <span>{roleLabel}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Daftar Aksi Menu Utama */}
              <div className="space-y-1 pt-1 text-xs font-medium">
                {/* A. Notifikasi Aplikasi */}
                <button
                  type="button"
                  onClick={() => setView("notifications")}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 transition hover:bg-surface-hover hover:text-foreground text-muted-foreground active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconBell className="h-4 w-4" />
                    </span>
                    <span className="truncate text-foreground font-semibold">Notifikasi</span>
                  </div>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                      {unreadCount} baru
                    </span>
                  ) : (
                    <span className="text-[11px] text-subtle-foreground font-normal">Semua terbaca</span>
                  )}
                </button>

                {/* B. Pengalih Tema (Mode Gelap / Terang) */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 transition hover:bg-surface-hover hover:text-foreground text-muted-foreground active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-muted text-foreground border border-border/80 shrink-0">
                      {isDark ? <IconSun className="h-4 w-4 text-warning" /> : <IconMoon className="h-4 w-4 text-primary" />}
                    </span>
                    <span className="truncate text-foreground font-semibold">Tema Tampilan</span>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">
                    {isDark ? "Mode Gelap" : "Mode Terang"}
                  </span>
                </button>

                {/* C. Profil & Keamanan Akun */}
                <Link
                  href="/profil"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl p-2.5 transition hover:bg-surface-hover hover:text-foreground text-muted-foreground active:scale-[0.98]"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-muted text-muted-foreground border border-border/80 shrink-0">
                    <IconUser className="h-4 w-4" />
                  </span>
                  <span className="truncate text-foreground font-semibold">Profil &amp; Keamanan</span>
                </Link>

                {/* D. Config Master (Khusus Super Admin) */}
                {canManageUsers && (
                  <Link
                    href="/pengaturan"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl p-2.5 transition hover:bg-surface-hover hover:text-foreground text-muted-foreground active:scale-[0.98]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-sidebar-brand-from/15 text-sidebar-brand-from border border-sidebar-brand-from/30 shrink-0">
                      <IconSliders className="h-4 w-4" />
                    </span>
                    <span className="truncate text-foreground font-semibold">Config Master</span>
                  </Link>
                )}
              </div>

              {/* 3. Tombol Keluar dari Sesi (Logout) */}
              <div className="pt-1 border-t border-border/70">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive active:scale-[0.98]"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-destructive-soft text-destructive shrink-0">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    <span>Keluar dari Sesi</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Sub-View: Daftar Notifikasi Aplikasi */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setView("menu")}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <IconArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali</span>
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <p>Belum ada notifikasi baru.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.url || "/"}
                      onClick={() => setIsOpen(false)}
                      className={cx(
                        "flex items-start gap-2.5 p-2 transition rounded-xl hover:bg-surface-hover",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface border border-border shadow-2xs mt-0.5">
                        {getNotificationIcon(n.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-foreground truncate">{n.title}</p>
                          <span className="text-[9px] text-subtle-foreground shrink-0 font-mono">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

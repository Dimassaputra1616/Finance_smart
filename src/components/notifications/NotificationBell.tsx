"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconBell,
  IconCheck,
  IconClock,
  IconReceipt,
  IconScale,
  IconSparkle,
} from "@/components/Icons";
import { cx } from "@/components/ui/Card";
import type { AppNotification } from "@/server/notifications-storage";

type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

/**
 * Komponen Lonceng Notifikasi Terpadu (In-App Notification Center & Web Push Controller).
 *
 * Mengontrol:
 * 1. Pemicuan Pop-up Izin Bawaan Sistem HP (Android / iOS / Desktop: "Izinkan / Blokir").
 * 2. Banner Notifikasi Status Bar HP melalui Service Worker (`showNotification`).
 * 3. Uji Coba Getar & Suara Notifikasi ("Tes Notifikasi HP").
 * 4. Kotak Masuk Pemberitahuan Mutasi Kas & Approval.
 */
export function NotificationBell({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Periksa dukungan dan status izin notifikasi di peramban
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as NotificationPermissionState);

    // Ambil data notifikasi tersimpan
    fetchNotifications();

    // Dengarkan klik di luar untuk menutup dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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

  /**
   * Memicu dialog pop-up izin asli bawaan sistem HP Android / Browser.
   * Muncul prompt: "[Nama Aplikasi] ingin mengirimkan notifikasi kepada Anda: [Blokir] [Izinkan]"
   */
  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setIsRequesting(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as NotificationPermissionState);

      if (perm === "granted") {
        // Tembak notifikasi sambutan pertama langsung ke notification drawer HP
        await triggerSystemNotification(
          "🔔 Notifikasi HP Aktif!",
          "Pemberitahuan mutasi kas dan persetujuan pengeluaran kini terhubung ke HP Anda.",
          "/",
        );

        // Daftarkan push subscription jika didukung
        await registerPushSubscription();
      }
    } catch {
      // Abaikan jika browser menolak pemanggilan
    } finally {
      setIsRequesting(false);
    }
  };

  /**
   * Mendaftarkan PushManager subscription ke server.
   */
  const registerPushSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg.pushManager) return;

      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      }
    } catch {}
  };

  /**
   * Menampilkan banner notifikasi native di status bar HP Android melalui Service Worker.
   */
  const triggerSystemNotification = async (title: string, body: string, url = "/") => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: "/icon",
          badge: "/icon",
          // Pola getar khas pesan Android (getar, jeda, getar)
          vibrate: [200, 100, 200],
          data: { url },
          tag: "keuangan-app-alert",
          renotify: true,
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon" });
      }
    } catch {}
  };

  /**
   * Uji coba pengiriman notifikasi langsung ke layar HP.
   */
  const handleTestNotification = async () => {
    setTestStatus("Mengirim sinyal...");
    await triggerSystemNotification(
      "Perbendaharaan & Kas Kantor",
      "🔔 Tes Berhasil! HP Anda bergetar dan notifikasi aplikasi terpasang dengan sempurna.",
      "/transaksi",
    );
    setTestStatus("✅ Notif terkirim ke HP!");
    setTimeout(() => setTestStatus(null), 3000);
  };

  /**
   * Menandai semua notifikasi telah dibaca.
   */
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
        return <IconClock className="h-4 w-4 text-warning" />;
      case "budget":
        return <IconScale className="h-4 w-4 text-destructive" />;
      case "transaction":
        return <IconReceipt className="h-4 w-4 text-income" />;
      default:
        return <IconSparkle className="h-4 w-4 text-primary" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Baru saja";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      return `${Math.floor(diffSec / 86400)} hari lalu`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Tombol Lonceng Navigasi */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Pemberitahuan aplikasi"
        title="Notifikasi Aplikasi"
        className={cx(
          "relative grid min-h-11 min-w-11 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition-all duration-200 hover:bg-surface-hover hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
          isOpen && "bg-surface-hover text-foreground ring-2 ring-primary/20",
          className,
        )}
      >
        <IconBell className="h-5 w-5" />

        {/* Badge Angka Belum Dibaca atau Titik Indikator Izin */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold font-mono text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : permission === "default" ? (
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-warning ring-2 ring-surface animate-ping" />
        ) : null}
      </button>

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 top-13 z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-surface/95 p-3.5 shadow-2xl backdrop-blur-2xl animate-fade-in text-foreground">
          {/* Header Popover */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <IconBell className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Notifikasi Aplikasi
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Tandai dibaca
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* KARTU KONTROL IZIN NOTIFIKASI ANDROID / SISTEM OPERASI   */}
          {/* ======================================================== */}
          <div className="my-3">
            {permission === "default" && (
              <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-warning shrink-0 mt-1.5 animate-pulse" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">
                      Aktifkan Notifikasi di HP Ini
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      Dapatkan getar &amp; suara di HP saat ada kas masuk atau pengajuan kas keluar staf.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 px-3 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary-hover active:scale-95 cursor-pointer"
                >
                  <IconBell className="h-3.5 w-3.5" />
                  <span>{isRequesting ? "Membuka Prompt HP..." : "Izinkan Notifikasi di HP"}</span>
                </button>
              </div>
            )}

            {permission === "granted" && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-income/25 bg-income-soft/30 p-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconCheck className="h-4 w-4 text-income shrink-0" />
                  <span className="text-[11px] font-bold text-income truncate">
                    Notifikasi HP Aktif
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="rounded-lg bg-surface border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-surface-hover active:scale-95 transition shadow-2xs cursor-pointer shrink-0"
                >
                  {testStatus || "Tes Notifikasi HP"}
                </button>
              </div>
            )}

            {permission === "denied" && (
              <div className="rounded-xl border border-border bg-surface-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground">Izin Notifikasi Diblokir</p>
                <p className="mt-0.5">
                  Buka Pengaturan Browser / Setelan Aplikasi di HP Anda untuk mengaktifkan notifikasi kembali.
                </p>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* DAFTAR RIWAYAT PEMBERITAHUAN DALAM APLIKASI              */}
          {/* ======================================================== */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>Belum ada notifikasi baru.</p>
                <p className="text-[10px] text-subtle-foreground mt-0.5">
                  Aktivitas mutasi kas penting akan tercatat di sini.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.url || "/"}
                  onClick={() => setIsOpen(false)}
                  className={cx(
                    "flex items-start gap-3 p-2.5 transition rounded-xl hover:bg-surface-hover/80",
                    !n.read && "bg-primary/5 font-medium",
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface border border-border shadow-2xs mt-0.5">
                    {getNotificationIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                        {n.targetRole === "DIRECTOR" && (
                          <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[9px] font-bold text-warning border border-warning/30 shrink-0">
                            Direktur
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-subtle-foreground shrink-0 font-mono">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
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
  );
}

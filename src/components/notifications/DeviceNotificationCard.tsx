"use client";

import { useEffect, useState } from "react";
import { IconBell, IconCheck } from "@/components/Icons";
import { Alert, Button, Card, CardHeader } from "@/components/ui";

type PermissionStatus = "default" | "granted" | "denied" | "unsupported";

/**
 * Kartu Pengaturan Notifikasi Perangkat & PWA di Halaman Profil.
 * Memungkinkan pengguna mengizinkan notifikasi bawaan HP (Android / iOS / Desktop)
 * dan menguji suara/getaran notifikasi seketika.
 */
export function DeviceNotificationCard() {
  const [permission, setPermission] = useState<PermissionStatus>("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionStatus);
  }, []);

  /**
   * Memicu dialog resmi pop-up izin bawaan sistem HP Android / Browser.
   */
  const handleRequest = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    setIsRequesting(true);
    setStatusMessage(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionStatus);

      if (result === "granted") {
        setStatusMessage({
          tone: "success",
          text: "Izin berhasil diberikan! Mengirimkan notifikasi sambutan ke HP Anda...",
        });

        // Tembak notifikasi sambutan native
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification("Perbendaharaan & Kas", {
            body: "🔔 Notifikasi HP Aktif! Anda akan menerima update mutasi kas dan persetujuan di HP ini.",
            icon: "/icon",
            badge: "/icon",
            vibrate: [200, 100, 200],
            data: { url: "/" },
            tag: "welcome-alert",
          });
        }
      } else if (result === "denied") {
        setStatusMessage({
          tone: "error",
          text: "Izin notifikasi ditolak. Untuk mengaktifkan kembali, buka Setelan Aplikasi di HP Anda.",
        });
      }
    } catch {
      setStatusMessage({
        tone: "error",
        text: "Gagal meminta izin notifikasi dari browser.",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  /**
   * Menguji notifikasi HP dengan getaran dan suara native.
   */
  const handleTest = async () => {
    setStatusMessage({
      tone: "info",
      text: "Mengirimkan notifikasi uji coba ke status bar HP...",
    });

    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Perbendaharaan & Kas Kantor", {
          body: "🔔 Tes Suara & Getar Berhasil! Notifikasi aplikasi terhubung sempurna di HP Android Anda.",
          icon: "/icon",
          badge: "/icon",
          vibrate: [250, 100, 250],
          data: { url: "/transaksi" },
          tag: "test-alert",
          renotify: true,
        });

        setStatusMessage({
          tone: "success",
          text: "Notifikasi terkirim! Periksa bar atas layar HP Anda.",
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Perbendaharaan & Kas", {
          body: "Tes notifikasi berhasil terkirim!",
          icon: "/icon",
        });
      }
    } catch {
      setStatusMessage({
        tone: "error",
        text: "Gagal memicu notifikasi sistem di perangkat ini.",
      });
    }
  };

  return (
    <Card>
      <CardHeader
        title="Notifikasi Aplikasi di Perangkat Ini"
        description="Menerima pemberitahuan kas masuk dan persetujuan pengeluaran langsung di layar HP (suara & getar seperti aplikasi Android native)."
      />

      <div className="p-5 space-y-4">
        {statusMessage && (
          <Alert tone={statusMessage.tone}>
            {statusMessage.text}
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface-muted/30 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconBell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                Status Izin Perangkat:{" "}
                <span className="font-semibold text-primary">
                  {permission === "granted"
                    ? "Aktif & Diizinkan"
                    : permission === "denied"
                      ? "Diblokir / Ditolak"
                      : permission === "unsupported"
                        ? "Tidak Didukung Peramban Ini"
                        : "Belum Diaktifkan"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {permission === "granted"
                  ? "HP ini siap menerima notifikasi mutasi kas dan antrean persetujuan."
                  : "Klik tombol di samping untuk memunculkan pop-up izin notifikasi bawaan HP."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission !== "granted" && permission !== "unsupported" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isRequesting}
                onClick={handleRequest}
                className="gap-2 min-h-11 cursor-pointer"
              >
                <IconBell className="h-4 w-4" />
                <span>{isRequesting ? "Membuka Dialog..." : "Izinkan Notifikasi di HP"}</span>
              </Button>
            )}

            {permission === "granted" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTest}
                className="gap-2 min-h-11 cursor-pointer"
              >
                <IconCheck className="h-4 w-4 text-income" />
                <span>Tes Notifikasi Suara &amp; Getar HP</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

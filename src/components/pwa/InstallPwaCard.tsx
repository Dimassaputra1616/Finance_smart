"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconDownload, IconSparkle } from "@/components/Icons";
import { Button, Card, CardHeader } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Komponen Panduan & Tombol 1-Klik Pasang Aplikasi ke Layar Utama HP (PWA Install).
 */
export function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Cek apakah aplikasi sudah berjalan dalam mode standalone (sudah ter-install di HP)
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((window.navigator as any).standalone);
    setIsStandalone(checkStandalone);

    // 2. Deteksi perangkat iOS (iPhone / iPad)
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleMobile);

    // 3. Tangkap event prompt instalasi bawaan Android Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Pasang Aplikasi di Layar Utama HP (PWA)"
        description="Pasang ikon aplikasi di HP agar bisa langsung dibuka 1-klik tanpa perlu mengetik alamat domain di peramban."
      />

      <div className="p-5 space-y-4">
        {isStandalone ? (
          <div className="flex items-center gap-3 rounded-2xl border border-income/30 bg-income-soft/30 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-income/15 text-income">
              <IconCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-income">Aplikasi Sudah Terpasang!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anda sedang membuka aplikasi dalam mode layar penuh (standalone).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface-muted/30 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <IconDownload className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Pasang ke Layar Utama (Homescreen)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Buka cepat seperti aplikasi Android asli, layar penuh tanpa bar URL peramban.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                className="gap-2 min-h-11 shrink-0 px-4 cursor-pointer"
              >
                <IconDownload className="h-4 w-4" />
                <span>Instal Aplikasi di HP</span>
              </Button>
            </div>

            {/* Panduan Instalasi Manual bila Prompt Otomatis Belum Muncul */}
            {showInstructions && (
              <div className="rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <IconSparkle className="h-4 w-4 text-primary" />
                  <span>Petunjuk Pemasangan Cepat:</span>
                </div>

                {isIos ? (
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Buka aplikasi ini di peramban <strong>Safari</strong> iPhone Anda.</li>
                    <li>
                      Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah layar (ikon kotak dengan panah ke atas).
                    </li>
                    <li>
                      Gulir ke bawah dan pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (<em>Add to Home Screen</em>).
                    </li>
                    <li>Ketuk <strong>Tambah</strong> di pojok kanan atas. Ikon aplikasi akan langsung muncul di layar utama iPhone Anda!</li>
                  </ol>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Buka peramban <strong>Chrome</strong> atau <strong>Edge</strong> di HP Android Anda.</li>
                    <li>Ketuk <strong>ikon titik tiga (⋮)</strong> di pojok kanan atas layar peramban.</li>
                    <li>
                      Pilih menu <strong>&quot;Instal Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                    </li>
                    <li>Ketuk <strong>Instal</strong>. Aplikasi akan otomatis terpasang dengan logo dan nama brand resmi Anda!</li>
                  </ol>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

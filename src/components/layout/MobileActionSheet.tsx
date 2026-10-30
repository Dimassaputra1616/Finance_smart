"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  IconCamera,
  IconImage,
  IconPencil,
  IconClose,
  IconReceipt,
  IconSliders,
} from "@/components/Icons";
import { compressImageToWebP } from "@/lib/image-compress";
import { setPendingProof } from "@/lib/proof-transfer";
import { CameraViewfinder } from "./CameraViewfinder";

/**
 * Komponen Tombol Kamera Tengah Melayang & Action Sheet Drawer.
 *
 * Gaya B:
 * 1. Tombol Kamera sentral melayang di tengah bilah navigasi bawah.
 * 2. Saat ditekan, memunculkan laci geser (Action Sheet Drawer) dari bawah.
 * 3. Tiga opsi: Ambil Foto Kamera, Pilih dari Galeri, atau Catat Manual.
 * 4. Foto yang dipilih langsung dikompres ke WebP dan diteruskan otomatis
 *    ke halaman `/transaksi/baru`.
 */
export function MobileActionSheet({
  canManage,
  canManageUsers = false,
}: {
  canManage: boolean;
  canManageUsers?: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup drawer dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isProcessing]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    try {
      const compressed = await compressImageToWebP(file, 1600, 0.8);
      const meta = {
        originalSize: file.size,
        compressedSize: compressed.size,
      };

      setPendingProof(compressed, meta);
      setIsOpen(false);
      setIsProcessing(false);

      if (window.location.pathname !== "/transaksi/baru") {
        router.push("/transaksi/baru");
      }
    } catch {
      // Fallback: teruskan file asli jika kompresi gagal
      setPendingProof(file, {
        originalSize: file.size,
        compressedSize: file.size,
      });
      setIsOpen(false);
      setIsProcessing(false);

      if (window.location.pathname !== "/transaksi/baru") {
        router.push("/transaksi/baru");
      }
    }
  };

  const onCameraChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const onGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        onChange={onCameraChange}
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={onGalleryChange}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Tombol Kamera Sentral Melayang (The Center Floating Hub) */}
      <div className="relative flex items-center justify-center -translate-y-4 px-1">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Catat Bukti Transaksi"
          aria-label="Buka kamera atau input transaksi"
          className="group relative flex h-13 w-13 cursor-pointer items-center justify-center rounded-2xl bg-sidebar-brand-from text-sidebar-brand-foreground shadow-lg shadow-black/20 ring-4 ring-surface transition-all duration-200 hover:scale-105 active:scale-90"
        >
          <IconCamera className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">Foto Bukti Nota</span>
        </button>
      </div>

      {/* Action Sheet Drawer (Laci Pilihan dari Bawah) - Diteleport ke document.body */}
      {isOpen && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] flex items-end justify-center lg:hidden"
        >
          {/* Backdrop gelap lembut */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !isProcessing && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Konten Laci Meluncur dari Bawah */}
          <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-border/80 bg-surface p-5 pb-8 shadow-2xl animate-fade-up">
            {/* Handle strip laci */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />

            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <IconReceipt className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Catat Bukti Transaksi
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Pilih metode input kuitansi atau nota pengeluaran
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground transition cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            {/* Opsi Aksi */}
            <div className="mt-4 space-y-2.5">
              {/* 1. Ambil Foto Kamera Belakang */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setIsOpen(false);
                  setIsCameraOpen(true);
                }}
                className="group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-border/80 bg-surface-muted/40 p-3.5 text-left transition hover:border-primary/40 hover:bg-surface-muted active:scale-[0.98]"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sidebar-brand-from text-sidebar-brand-foreground shadow-xs group-hover:scale-105 transition">
                  <IconCamera className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Ambil Foto Nota (Kamera)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buka kamera belakang langsung & kompres tajam otomatis
                  </p>
                </div>
              </button>

              {/* 2. Pilih dari Galeri */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => galleryInputRef.current?.click()}
                className="group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-border/80 bg-surface-muted/40 p-3.5 text-left transition hover:border-primary/40 hover:bg-surface-muted active:scale-[0.98]"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-foreground border border-border shadow-xs group-hover:scale-105 transition">
                  <IconImage className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Pilih dari Galeri
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unggah struk atau bukti transfer yang sudah tersimpan
                  </p>
                </div>
              </button>

              {/* 3. Catat Manual Tanpa Bukti */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setIsOpen(false);
                  router.push("/transaksi/baru");
                }}
                className="group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-border/80 bg-surface-muted/40 p-3.5 text-left transition hover:border-primary/40 hover:bg-surface-muted active:scale-[0.98]"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-foreground border border-border shadow-xs group-hover:scale-105 transition">
                  <IconPencil className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Catat Manual Tanpa Bukti
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pengeluaran kas kecil tanpa kuitansi (parkir, tips kurir)
                  </p>
                </div>
              </button>
            </div>

            {/* Navigasi Cepat Tambahan untuk Mobile (khusus Administrator) */}
            {canManage ? (
            <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                {canManageUsers ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/pengaturan");
                    }}
                    className="flex items-center gap-1.5 text-primary font-semibold hover:underline transition cursor-pointer min-h-11 py-1"
                  >
                    <IconSliders className="h-4 w-4" />
                    <span>Buka Config Master</span>
                  </button>
                ) : <div />}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/transaksi/transfer");
                  }}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer min-h-11 py-1 font-medium"
                >
                  Pindah Buku Rekening →
                </button>
              </div>
            </div>
            ) : null}

            {/* Indikator Loading Kompresi */}
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-2.5 text-xs font-medium text-primary animate-fade-in">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Mengompres foto nota & menyiapkan formulir…</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* Viewfinder Kamera Langsung di Dalam Aplikasi */}
      <CameraViewfinder
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => handleFileProcess(file)}
        onFallback={() => {
          setIsCameraOpen(false);
          cameraInputRef.current?.click();
        }}
      />
    </>
  );
}

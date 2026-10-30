"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  IconUpload,
  IconReceipt,
  IconTrash,
  IconCamera,
  IconSparkle,
  IconCheck,
  IconAlert,
} from "@/components/Icons";
import {
  compressImageToWebP,
  formatFileSize,
  isImageFile,
} from "@/lib/image-compress";
import {
  consumePendingProof,
  subscribeToProofAttached,
} from "@/lib/proof-transfer";
import { cx } from "@/components/ui/Card";

export interface ScanReceiptData {
  amount?: number;
  date?: string;
  description?: string;
  categoryId?: string | null;
  accountId?: string | null;
}

/**
 * Komponen upload bukti transaksi / nota dengan kompresi otomatis WebP
 * dan Integrasi Pemindai AI Cerdas (Anthropic Claude Vision).
 */
export function ProofUpload({
  onScanSuccess,
}: {
  onScanSuccess?: (data: ScanReceiptData) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const applyFile = (file: File, meta?: { original: number; compressed: number }) => {
    setCurrentFile(file);
    setScanStatus(null);

    // Buat pratinjau URL lokal
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });

    if (meta) {
      setStats(meta);
    } else {
      setStats({ original: file.size, compressed: file.size });
    }

    // Set ke input file element menggunakan DataTransfer jika didukung
    try {
      if (typeof DataTransfer !== "undefined") {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    } catch {
      // Browser tanpa DataTransfer support (WebKit lama), fallback aman
    }
  };

  // Dengarkan foto yang masuk baik saat baru mount maupun saat user memotret saat form sudah terbuka
  useEffect(() => {
    const pending = consumePendingProof();
    if (pending) {
      applyFile(
        pending.file,
        pending.meta
          ? {
              original: pending.meta.originalSize,
              compressed: pending.meta.compressedSize,
            }
          : undefined,
      );
    }

    const unsubscribe = subscribeToProofAttached((payload) => {
      applyFile(
        payload.file,
        payload.meta
          ? {
              original: payload.meta.originalSize,
              compressed: payload.meta.compressedSize,
            }
          : undefined,
      );
    });

    return () => {
      unsubscribe();
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) return;

    setIsCompressing(true);
    try {
      const originalSize = file.size;
      const compressed = await compressImageToWebP(file, 1600, 0.8);
      applyFile(compressed, {
        original: originalSize,
        compressed: compressed.size,
      });
    } catch {
      applyFile(file, {
        original: file.size,
        compressed: file.size,
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCurrentFile(null);
    setStats(null);
    setScanStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleScanWithAI = async () => {
    const fileToScan = currentFile || fileInputRef.current?.files?.[0];
    if (!fileToScan) return;

    setIsScanning(true);
    setScanStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToScan);

      const res = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.ok) {
        setScanStatus({
          ok: false,
          message: data.message || "Gagal memindai nota. Coba periksa kunci API.",
        });
        return;
      }

      onScanSuccess?.({
        amount: data.amount,
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        accountId: data.accountId,
      });

      setScanStatus({
        ok: true,
        message: "✨ AI berhasil membaca struk! Formulir telah terisi otomatis.",
      });
    } catch (err) {
      setScanStatus({
        ok: false,
        message: `Terjadi kendala jaringan: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Input file disembunyikan tapi tetap ada di dalam DOM untuk FormData */}
      <input
        ref={fileInputRef}
        type="file"
        name="proof"
        id="proof-input"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="sr-only"
      />

      {!previewUrl ? (
        <label
          htmlFor="proof-input"
          className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-muted/40 p-4 text-center transition hover:border-primary/50 hover:bg-surface-muted focus-within:outline focus-within:outline-2 focus-within:outline-ring active:scale-[0.99]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted-foreground shadow-xs">
            {isCompressing ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <IconUpload className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isCompressing ? "Mengompres foto nota…" : "Upload Bukti / Nota Transaksi"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kamera HP atau Galeri · Otomatis dikompres tajam (~200 KB)
            </p>
          </div>
        </label>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-3.5 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Bukti transaksi"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <IconReceipt className="h-4 w-4 shrink-0 text-primary" />
                <p className="truncate text-xs font-semibold text-foreground">
                  Bukti Transaksi Terlampir
                </p>
              </div>
              {stats && (
                <p className="mt-0.5 text-xs text-income font-medium font-mono">
                  {formatFileSize(stats.original)} → {formatFileSize(stats.compressed)}{" "}
                  <span className="text-subtle-foreground font-normal">
                    (-{Math.round((1 - stats.compressed / stats.original) * 100)}%)
                  </span>
                </p>
              )}
              <p className="text-[0.7rem] text-muted-foreground">Teks nota tetap tajam &amp; jernih</p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Ganti foto"
                aria-label="Ganti foto bukti"
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-surface-hover hover:text-foreground active:scale-95"
              >
                <IconCamera className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                title="Hapus foto"
                aria-label="Hapus foto bukti"
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive active:scale-95"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tombol Pemicu AI Scanner Cerdas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={handleScanWithAI}
              disabled={isScanning || isCompressing}
              className={cx(
                "group flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition active:scale-95 disabled:opacity-50",
                "bg-sidebar-brand-from hover:bg-sidebar-brand-from/90",
              )}
            >
              {isScanning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI Sedang Membaca Struk…</span>
                </>
              ) : (
                <>
                  <IconSparkle className="h-4 w-4 text-warning" />
                  <span>✨ Pindai Struk dengan AI</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-muted-foreground text-center sm:text-right">
              Otomatis isi nominal, tanggal &amp; pos anggaran
            </span>
          </div>

          {/* Banner Status Pemindaian AI */}
          {scanStatus && (
            <div
              className={cx(
                "flex items-start gap-2 rounded-xl p-2.5 text-xs font-medium animate-fade-in",
                scanStatus.ok
                  ? "border border-income/30 bg-income-soft/50 text-income"
                  : "border border-destructive/30 bg-destructive-soft/50 text-destructive",
              )}
            >
              {scanStatus.ok ? (
                <IconCheck className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <IconAlert className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{scanStatus.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

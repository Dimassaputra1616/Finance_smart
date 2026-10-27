"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { IconUpload, IconReceipt, IconTrash } from "@/components/Icons";
import { compressImageToWebP, formatFileSize } from "@/lib/image-compress";

/**
 * Komponen upload bukti transaksi / nota dengan kompresi otomatis WebP.
 *
 * Mengompres foto nota kamera HP (4-12 MB) langsung di sisi browser menjadi
 * ~150-250 KB tanpa membuat teks struk kabur/blur.
 *
 * Mendukung transfer foto otomatis saat user memotret dari tombol kamera
 * di bilah navigasi bawah (Action Sheet Drawer).
 */
export function ProofUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  // Periksa apakah ada foto nota pending dari Action Sheet Drawer
  useEffect(() => {
    try {
      const pendingData = sessionStorage.getItem("pending_proof_data");
      const pendingName = sessionStorage.getItem("pending_proof_name") || "bukti_transaksi.webp";
      const pendingMeta = sessionStorage.getItem("pending_proof_meta");

      if (pendingData) {
        // Hapus segera agar tidak dipakai ganda pada entri berikutnya
        sessionStorage.removeItem("pending_proof_data");
        sessionStorage.removeItem("pending_proof_name");
        sessionStorage.removeItem("pending_proof_meta");

        fetch(pendingData)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], pendingName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            if (fileInputRef.current) {
              fileInputRef.current.files = dataTransfer.files;
            }

            if (pendingMeta) {
              const meta = JSON.parse(pendingMeta);
              setStats({
                original: meta.originalSize,
                compressed: meta.compressedSize,
              });
            }

            setPreviewUrl(pendingData);
          })
          .catch(() => {});
      }
    } catch {
      // Abaikan jika browser memblokir sessionStorage
    }
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Jika bukan gambar, abaikan kompresi
    if (!file.type.startsWith("image/")) return;

    setIsCompressing(true);
    try {
      const originalSize = file.size;
      const compressed = await compressImageToWebP(file, 1600, 0.8);

      // Buat DataTransfer baru untuk memperbarui input file dengan file hasil kompresi
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      setStats({
        original: originalSize,
        compressed: compressed.size,
      });

      // Preview URL
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
    } catch {
      // Fallback: gunakan file asli jika kompresi gagal
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* Input file disembunyikan tapi tetap ada di dalam DOM untuk FormData */}
      <input
        ref={fileInputRef}
        type="file"
        name="proof"
        id="proof-input"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />

      {!previewUrl ? (
        <label
          htmlFor="proof-input"
          className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-muted/40 p-4 text-center transition hover:border-primary/50 hover:bg-surface-muted focus-within:outline focus-within:outline-2 focus-within:outline-ring"
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
            <p className="text-xs text-muted-foreground">
              Kamera HP atau Galeri · Otomatis dikompres tajam (~200 KB)
            </p>
          </div>
        </label>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
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
              <p className="mt-0.5 text-xs text-income font-medium">
                Dikompres: {formatFileSize(stats.original)} → {formatFileSize(stats.compressed)}{" "}
                <span className="text-subtle-foreground font-normal">
                  (-{Math.round((1 - stats.compressed / stats.original) * 100)}%)
                </span>
              </p>
            )}
            <p className="text-[0.7rem] text-muted-foreground">Teks nota tetap tajam & jernih</p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            title="Hapus foto"
            aria-label="Hapus foto bukti"
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

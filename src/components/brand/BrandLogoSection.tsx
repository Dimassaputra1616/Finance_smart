"use client";

import { useRef, useState } from "react";
import { uploadBrandLogo, removeBrandLogo } from "@/server/actions/brand";
import { BrandMark } from "@/components/auth/BrandMark";
import { IconCamera, IconClose, IconSparkle } from "@/components/Icons";
import { Alert, alertDuration, Button } from "@/components/ui";
import { getBrandLogoUrl, type BrandConfig } from "@/lib/brand-config";
import { optimizeLogoImage } from "@/lib/image-compress";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Komponen Pengelolaan Logo Perusahaan / Brand.
 * Memungkinkan administrator mengunggah gambar logo apa saja;
 * otomatis dikonversi, dioptimasi ke WebP 512x512, dan dipusatkan (center fit).
 */
export function BrandLogoSection({ brand }: { brand: BrandConfig }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ActionResult>(INITIAL_RESULT);
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [key, setKey] = useState(Date.now());

  const currentLogoUrl = previewUrl ?? getBrandLogoUrl(brand);
  const isBusy = isProcessing || isRemoving;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Otomatis optimasi & konversi format + ratio (512x512 centered transparent WebP / preserve SVG)
      const optimizedFile = await optimizeLogoImage(file, 512);

      // Buat pratinjau lokal sementara saat proses unggah berlangsung
      const objectUrl = URL.createObjectURL(optimizedFile);
      setPreviewUrl(objectUrl);

      const formData = new FormData();
      formData.append("logo", optimizedFile);
      const res = await uploadBrandLogo(INITIAL_RESULT, formData);
      setResult(res);
      setRemoveResult(null);

      setKey(Date.now());
      setPreviewUrl(null);
    } catch {
      setResult({ ok: false, message: "Terjadi kesalahan saat mengunggah logo." });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("Kembalikan lambang ke monogram bawaan sistem (Rp)?")) return;

    setIsRemoving(true);
    try {
      const res = await removeBrandLogo();
      setRemoveResult(res);
      setResult(INITIAL_RESULT);
      setPreviewUrl(null);
      setKey(Date.now());
    } finally {
      setIsRemoving(false);
    }
  };

  const activeMessage = result.message || removeResult?.message;
  const isSuccess = result.ok || removeResult?.ok;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Pratinjau Logo Aktif */}
        <div className="relative shrink-0 flex flex-col items-center gap-2">
          <div className="relative grid place-items-center rounded-2xl border-2 border-dashed border-border/80 bg-surface-muted/40 p-3 shadow-xs">
            <BrandMark
              key={key}
              logoUrl={currentLogoUrl}
              hasCustomLogo={previewUrl ? true : brand.hasCustomLogo}
              shape={brand.logoShape}
              className="h-20 w-20 text-xl shadow-md"
            />
            {isBusy ? (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40 backdrop-blur-xs">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : null}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {brand.hasCustomLogo ? "Logo Kustom Aktif" : "Monogram Bawaan"}
          </span>
        </div>

        {/* Informasi dan Tombol Aksi */}
        <div className="flex-1 space-y-3 text-center sm:text-left min-w-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Berkas Logo Aplikasi</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Tinggal pilih berkas gambar apa saja (PNG, JPG, SVG, WebP, dsb) dalam ukuran atau rasio
              apa pun. Sistem otomatis mengonversi, memusatkan (center fit), dan mengoptimasinya ke
              bujur sangkar 512×512 dengan latar transparan.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-surface-muted/30 p-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconSparkle className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Otomatis Dikonversi &amp; Diposisikan:</strong> Bebas unggah format gambar apa saja (PNG, JPG, WebP, SVG, HEIC).
              </span>
            </div>
          </div>

          {activeMessage ? (
            <Alert
              key={activeMessage}
              tone={isSuccess ? "success" : "error"}
              duration={alertDuration(result.message ? result : removeResult!)}
            >
              {activeMessage}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif,.svg,.png,.webp,.jpg,.jpeg"
              onChange={handleFileChange}
              className="sr-only"
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 min-h-11 cursor-pointer"
            >
              <IconCamera className="h-4 w-4" />
              <span>
                {isProcessing
                  ? "Mengonversi & Menyimpan..."
                  : brand.hasCustomLogo
                    ? "Ganti Logo Baru"
                    : "Pilih Gambar Logo"}
              </span>
            </Button>

            {brand.hasCustomLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={handleRemove}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive min-h-11 cursor-pointer"
              >
                <IconClose className="h-3.5 w-3.5" />
                <span>Hapus Logo (Kembali ke Monogram Rp)</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

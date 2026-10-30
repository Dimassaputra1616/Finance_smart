"use client";

import { useRef, useState } from "react";
import { uploadBrandMascot, removeBrandMascot } from "@/server/actions/brand";
import { IconCamera, IconClose, IconSparkle } from "@/components/Icons";
import { Alert, alertDuration, Button } from "@/components/ui";
import { getBrandMascotUrl, type BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Komponen Pengelolaan Maskot Karakter Brand di Config Master.
 * Memungkinkan administrator mengganti karakter maskot 3D bawaan dengan
 * maskot brand / avatar perusahaan mereka sendiri.
 */
export function BrandMascotSection({ brand }: { brand: BrandConfig }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ActionResult>(INITIAL_RESULT);
  const [removeResult, setRemoveResult] = useState<ActionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [key, setKey] = useState(Date.now());

  const currentMascotUrl = previewUrl ?? getBrandMascotUrl(brand);
  const isBusy = pending || isRemoving;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPending(true);

    try {
      const formData = new FormData();
      formData.append("mascot", file);
      const res = await uploadBrandMascot(INITIAL_RESULT, formData);
      setResult(res);
      setRemoveResult(null);
      setKey(Date.now());
      setPreviewUrl(null);
    } catch {
      setResult({ ok: false, message: "Terjadi kesalahan saat mengunggah maskot." });
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!confirm("Kembalikan maskot ke karakter bendahara 3D bawaan ('The Treasurer')?")) return;

    setIsRemoving(true);
    try {
      const res = await removeBrandMascot();
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
        {/* Pratinjau Maskot Aktif */}
        <div className="relative shrink-0 flex flex-col items-center gap-2">
          <div className="relative grid h-44 w-40 place-items-center rounded-2xl border-2 border-dashed border-border/80 bg-surface-muted/40 p-3 shadow-xs overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={key}
              src={currentMascotUrl}
              alt="Maskot Karakter Brand"
              className="h-full w-full object-contain drop-shadow-md"
            />
            {isBusy ? (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40 backdrop-blur-xs">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : null}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {brand.hasCustomMascot ? "Maskot Kustom Aktif" : "Maskot Bendahara 3D Bawaan"}
          </span>
        </div>

        {/* Informasi dan Aksi Unggah Maskot */}
        <div className="flex-1 space-y-3 text-center sm:text-left min-w-0">
          <div>
            <h3 className="text-sm font-bold text-foreground">Karakter Maskot Halaman Masuk</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Karakter maskot tampil eksklusif di panel sambutan <strong>Halaman Masuk (Login)</strong>. Anda dapat mengunggah karakter 3D, ilustrasi kartun, atau foto maskot perusahaan Anda sendiri.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-surface-muted/30 p-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconSparkle className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Tips Format:</strong> Disarankan berkas <strong>PNG transparan</strong> (tanpa background) agar menyatu mulus dengan pendaran latar panggung.
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
              accept="image/png,image/webp,image/svg+xml,image/jpeg,.png,.webp,.svg,.jpg"
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
                {pending
                  ? "Menyimpan Maskot..."
                  : brand.hasCustomMascot
                    ? "Ganti Maskot Baru"
                    : "Unggah Maskot Sendiri"}
              </span>
            </Button>

            {brand.hasCustomMascot && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={handleRemove}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive min-h-11 cursor-pointer"
              >
                <IconClose className="h-3.5 w-3.5" />
                <span>Kembalikan ke Maskot 3D Asli</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

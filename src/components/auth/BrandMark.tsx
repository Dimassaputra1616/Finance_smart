"use client";

import { useState } from "react";
import { cx } from "@/components/ui/Card";
import type { LogoShape } from "@/lib/brand-config";

export interface BrandMarkProps {
  className?: string;
  logoUrl?: string | null;
  hasCustomLogo?: boolean;
  shape?: LogoShape;
  alt?: string;
}

const SHAPE_STYLES: Record<LogoShape, string> = {
  rounded: "rounded-xl",
  circle: "rounded-full",
  square: "rounded-sm",
};

const logoNotFoundSet = new Set<string>();

/**
 * Lambang merek aplikasi.
 *
 * Menampilkan logo kustom pengguna jika tersedia, dengan cadangan (fallback)
 * otomatis ke lambang monogram "Rp" bawaan jika belum ada logo kustom atau jika
 * pemuatan berkas gambar gagal.
 */
export function BrandMark({
  className,
  logoUrl,
  hasCustomLogo,
  shape = "rounded",
  alt = "Logo Brand",
}: BrandMarkProps) {
  const effectiveLogoUrl = logoUrl ?? (hasCustomLogo ? "/api/brand/logo" : null);
  const [loadFailed, setLoadFailed] = useState(() =>
    effectiveLogoUrl ? logoNotFoundSet.has(effectiveLogoUrl) : false,
  );

  const handleError = () => {
    if (effectiveLogoUrl) logoNotFoundSet.add(effectiveLogoUrl);
    setLoadFailed(true);
  };

  if (effectiveLogoUrl && !loadFailed) {
    return (
      <span
        className={cx(
          "relative grid shrink-0 place-items-center overflow-hidden bg-surface-muted/80 shadow-xs ring-1 ring-border/50",
          SHAPE_STYLES[shape],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={effectiveLogoUrl}
          alt={alt}
          onError={handleError}
          className="h-full w-full object-contain p-1"
          loading="eager"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center bg-sidebar-brand-from font-mono font-bold text-sidebar-brand-foreground select-none",
        SHAPE_STYLES[shape],
        className,
      )}
    >
      Rp
    </span>
  );
}

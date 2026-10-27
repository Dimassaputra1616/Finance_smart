"use client";

import { useEffect } from "react";
import { IconReceipt, IconClose } from "@/components/Icons";

/**
 * Modal dialog untuk melihat foto bukti transaksi nota/kuitansi secara penuh.
 *
 * Responsif pada layar HP maupun desktop, dengan latar backdrop blur dan
 * tombol tutup yang mudah dijangkau.
 */
export function ProofModal({
  isOpen,
  onClose,
  proofUrl,
  description,
}: {
  isOpen: boolean;
  onClose: () => void;
  proofUrl: string | null;
  description?: string;
}) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !proofUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-lifted animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface-muted text-primary">
              <IconReceipt className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2
                id="proof-modal-title"
                className="truncate text-sm font-semibold text-foreground"
              >
                Bukti Transaksi
              </h2>
              {description && (
                <p className="truncate text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* Image Content */}
        <div className="flex-1 overflow-auto bg-surface-muted/30 p-4">
          <div className="flex min-h-64 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proofUrl}
              alt={description ?? "Bukti nota"}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-subtle-foreground">
          <span>Format WebP Tajam</span>
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Buka Ukuran Penuh ↗
          </a>
        </div>
      </div>
    </div>
  );
}

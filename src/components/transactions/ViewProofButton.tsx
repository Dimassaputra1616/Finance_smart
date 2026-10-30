"use client";

import { useState } from "react";
import { IconReceipt } from "@/components/Icons";
import { ProofModal } from "./ProofModal";

/**
 * Tombol untuk membuka foto bukti transaksi nota/kuitansi.
 * Dilengkapi pratinjau thumbnail mengambang interaktif saat disentuh kursor di desktop.
 */
export function ViewProofButton({
  proofUrl,
  description,
}: {
  proofUrl: string;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/40 hover:bg-surface-muted hover:text-primary active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        title="Lihat bukti nota"
        aria-label="Lihat bukti nota"
      >
        <IconReceipt className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="hidden sm:inline">Bukti Nota</span>
      </button>

      {/* Floating Hover Mini-Preview di Layar Komputer */}
      {isHovered && !isOpen && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 rounded-2xl border border-border bg-surface p-1.5 shadow-xl sm:block animate-fade-in"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt={description}
            className="h-32 w-32 rounded-xl object-cover shadow-2xs"
          />
          <div className="mt-1 px-1 text-center text-[10px] text-muted-foreground font-medium truncate max-w-[8rem]">
            Klik untuk zoom
          </div>
        </div>
      )}

      <ProofModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        proofUrl={proofUrl}
        description={description}
      />
    </div>
  );
}

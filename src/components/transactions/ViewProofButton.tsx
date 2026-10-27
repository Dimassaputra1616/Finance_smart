"use client";

import { useState } from "react";
import { IconReceipt } from "@/components/Icons";
import { ProofModal } from "./ProofModal";

/**
 * Tombol untuk membuka foto bukti transaksi nota/kuitansi.
 */
export function ViewProofButton({
  proofUrl,
  description,
}: {
  proofUrl: string;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-xl border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-surface-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        title="Lihat bukti nota"
        aria-label="Lihat bukti nota"
      >
        <IconReceipt className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="hidden sm:inline">Bukti Nota</span>
      </button>

      <ProofModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        proofUrl={proofUrl}
        description={description}
      />
    </>
  );
}

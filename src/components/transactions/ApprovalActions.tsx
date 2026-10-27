"use client";

import { useActionState, useState } from "react";
import {
  approveTransaction,
  rejectTransaction,
} from "@/server/actions/transactions";
import { IconCheck, IconClose } from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult = { ok: true };

/**
 * Tombol aksi persetujuan (Approval) untuk Administrator/Approver.
 *
 * Menyetujui atau menolak pengeluaran staf langsung dengan konfirmasi
 * yang ramah layar sentuh (touch target min-h-11).
 */
export function ApprovalActions({
  transactionId,
  description,
}: {
  transactionId: string;
  description: string;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [, approveAction, isApproving] = useActionState(
    approveTransaction,
    INITIAL_STATE,
  );
  const [, rejectAction, isRejecting] = useActionState(
    rejectTransaction,
    INITIAL_STATE,
  );

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Tombol Setujui */}
      <form action={approveAction}>
        <input type="hidden" name="id" value={transactionId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isApproving || isRejecting}
          className="gap-1 border border-income/30 bg-income-soft text-income hover:bg-income hover:text-income-foreground"
          title={`Setujui "${description}"`}
        >
          <IconCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Setujui</span>
        </Button>
      </form>

      {/* Tombol Tolak */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isApproving || isRejecting}
        onClick={() => setRejectOpen(true)}
        className="gap-1 border border-destructive-border/50 text-destructive hover:bg-destructive-soft hover:text-destructive"
        title={`Tolak "${description}"`}
      >
        <IconClose className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tolak</span>
      </Button>

      {/* Dialog Alasan Penolakan */}
      {rejectOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setRejectOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-lifted animate-fade-up">
            <h3 className="text-base font-semibold text-foreground">
              Tolak Transaksi
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Masukkan alasan penolakan untuk transaksi &ldquo;{description}&rdquo;.
            </p>

            <form
              action={async (formData) => {
                await rejectAction(formData);
                setRejectOpen(false);
              }}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={transactionId} />

              <div>
                <label
                  htmlFor="reject-reason"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Alasan Penolakan
                </label>
                <input
                  id="reject-reason"
                  name="reason"
                  type="text"
                  required
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Bukti nota buram / salah nominal"
                  className="w-full min-h-11 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-2 focus:outline-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isRejecting}
                >
                  {isRejecting ? "Memproses…" : "Tolak Transaksi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

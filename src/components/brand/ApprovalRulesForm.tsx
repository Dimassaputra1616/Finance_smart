"use client";

import { useActionState, useState } from "react";
import { updateApprovalRules } from "@/server/actions/brand";
import { IconAlert, IconCheck, IconReceipt, IconShield } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input, Select } from "@/components/ui";
import { formatRupiah } from "@/lib/money";
import type { BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Aturan Otorisasi & Plafon Approval Transaksi.
 */
export function ApprovalRulesForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateApprovalRules, INITIAL_RESULT);

  const [thresholdInput, setThresholdInput] = useState(
    brand.directorApprovalThreshold
      ? formatRupiah(brand.directorApprovalThreshold).replace("Rp ", "")
      : "2.500.000",
  );
  const [autoApprove, setAutoApprove] = useState<boolean>(brand.autoApproveAdmin ?? true);
  const [requireProof, setRequireProof] = useState<boolean>(brand.requireProofForExpense ?? false);
  const [budgetThreshold, setBudgetThreshold] = useState<number>(brand.budgetAlertThreshold ?? 80);

  const activeMessage = result.message;
  const isSuccess = result.ok;

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setThresholdInput("");
      return;
    }
    const num = parseInt(raw, 10);
    setThresholdInput(formatRupiah(num).replace("Rp ", ""));
  };

  return (
    <form action={formAction} className="space-y-6">
      {activeMessage ? (
        <Alert
          key={activeMessage}
          tone={isSuccess ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {activeMessage}
        </Alert>
      ) : null}

      <div className="space-y-5">
        {/* Plafon Approval Direktur */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconShield className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Plafon Batas Approval Direktur (Tier Approval)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pengeluaran staf dengan nominal di atas nilai ini mewajibkan persetujuan khusus
                dari <strong>Direktur</strong>. Nominal di bawah batas ini dapat disetujui oleh Administrator.
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-sm">
            <FormField
              label="Nominal Batas Approval (Rupiah)"
              htmlFor="directorApprovalThreshold"
              name="directorApprovalThreshold"
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="directorApprovalThreshold"
                  name="directorApprovalThreshold"
                  value={thresholdInput}
                  onChange={handleThresholdChange}
                  placeholder="2.500.000"
                  className="pl-10 font-mono font-bold"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Auto-Approve Transaksi Administrator */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-income/15 text-income">
              <IconCheck className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Otorisasi Otomatis Transaksi Administrator
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Menentukan apakah mutasi kas yang dicatat langsung oleh Super Admin langsung berstatus
                <strong> Disetujui (Approved)</strong> tanpa perlu langkah verifikasi terpisah.
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-sm">
            <FormField
              label="Status Otorisasi Admin"
              htmlFor="autoApproveAdmin"
              name="autoApproveAdmin"
            >
              <Select
                id="autoApproveAdmin"
                name="autoApproveAdmin"
                value={autoApprove ? "true" : "false"}
                onChange={(e) => setAutoApprove(e.target.value === "true")}
              >
                <option value="true">Otomatis Disetujui (Langsung Tercatat di Buku Kas)</option>
                <option value="false">Tetap Melalui Antrean Review (Pending)</option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Kebijakan Bukti Nota Pengeluaran */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconReceipt className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Kebijakan Lampiran Bukti Nota / Kuitansi
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aturan pengunggahan foto kuitansi saat staf mengajukan mutasi kas pengeluaran belanja kantor.
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-sm">
            <FormField
              label="Kewajiban Bukti Kuitansi"
              htmlFor="requireProofForExpense"
              name="requireProofForExpense"
            >
              <Select
                id="requireProofForExpense"
                name="requireProofForExpense"
                value={requireProof ? "true" : "false"}
                onChange={(e) => setRequireProof(e.target.value === "true")}
              >
                <option value="false">
                  Fleksibel (Opsional — Boleh catat kas kecil tanpa kuitansi, misal parkir)
                </option>
                <option value="true">
                  Ketat (Wajib Lampirkan Nota — Transaksi pengeluaran wajib foto bukti)
                </option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Ambang Batas Waspada Pagu Anggaran */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
              <IconAlert className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Ambang Batas Peringatan Pagu Anggaran (Budget Warning Threshold)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Persentase serapan belanja pos anggaran untuk mulai memunculkan peringatan waspada (amber).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={budgetThreshold}
              onChange={(e) => setBudgetThreshold(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-primary"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Input
                type="number"
                name="budgetAlertThreshold"
                min={50}
                max={100}
                value={budgetThreshold}
                onChange={(e) => setBudgetThreshold(Number(e.target.value))}
                className="w-20 text-center font-bold"
              />
              <span className="text-sm font-bold text-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border/80 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="gap-2 min-h-11 cursor-pointer px-5"
        >
          <IconCheck className="h-4 w-4" />
          <span>{pending ? "Menyimpan Aturan..." : "Simpan Aturan Otorisasi"}</span>
        </Button>
      </div>
    </form>
  );
}

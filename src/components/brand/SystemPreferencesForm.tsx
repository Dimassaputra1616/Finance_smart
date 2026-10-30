"use client";

import { useActionState, useState } from "react";
import { updateSystemPreferences } from "@/server/actions/brand";
import { IconAlert, IconCheck, IconReceipt } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input, Select } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Preferensi Keuangan & Aturan Sistem.
 */
export function SystemPreferencesForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateSystemPreferences, INITIAL_RESULT);

  const [threshold, setThreshold] = useState<number>(brand.budgetAlertThreshold ?? 80);
  const [requireProof, setRequireProof] = useState<boolean>(brand.requireProofForExpense ?? false);

  const activeMessage = result.message;
  const isSuccess = result.ok;

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

      <div className="space-y-6">
        {/* Ambang Batas Pagu Anggaran */}
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
                Tentukan pada persentase berapa sistem mulai menampilkan sinyal peringatan waspada
                (kuning/amber) saat serapan belanja pos anggaran mendekati batas pagu bulanan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-primary"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Input
                type="number"
                name="budgetAlertThreshold"
                min={50}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-20 text-center font-bold"
              />
              <span className="text-sm font-bold text-foreground">%</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Rekomendasi: <strong>80%</strong> (memberi waktu persiapan sebelum anggaran benar-benar habis).
          </p>
        </div>

        {/* Kebijakan Bukti Nota Pengeluaran */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <IconReceipt className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Kebijakan Lampiran Bukti Nota / Kuitansi
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aturan pengunggahan foto kuitansi saat staf mengajukan mutasi kas pengeluaran belanja.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <FormField label="Status Kewajiban Nota" name="requireProofForExpense">
              <Select
                name="requireProofForExpense"
                value={requireProof ? "true" : "false"}
                onChange={(e) => setRequireProof(e.target.value === "true")}
              >
                <option value="false">
                  Fleksibel (Opsional — Boleh catat kas kecil tanpa nota, seperti parkir/tips)
                </option>
                <option value="true">
                  Ketat (Wajib Lampirkan Nota — Transaksi pengeluaran harus disertai foto bukti)
                </option>
              </Select>
            </FormField>
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
          <span>{pending ? "Menyimpan Preferensi..." : "Simpan Preferensi Sistem"}</span>
        </Button>
      </div>
    </form>
  );
}

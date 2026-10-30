"use client";

import { useActionState, useState } from "react";
import { updateFinanceDefaults } from "@/server/actions/brand";
import { IconCheck, IconScale, IconWallet } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input, Select } from "@/components/ui";
import { formatRupiah } from "@/lib/money";
import type { BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

/**
 * Formulir Rekening Kas Utama Bawaan, Pajak, dan Biaya Transfer.
 */
export function FinanceDefaultsForm({
  brand,
  accounts = [],
}: {
  brand: BrandConfig;
  accounts?: AccountOption[];
}) {
  const [result, formAction, pending] = useActionState(updateFinanceDefaults, INITIAL_RESULT);

  const [defaultAccount, setDefaultAccount] = useState(brand.defaultAccountId || "");
  const [transferFeeInput, setTransferFeeInput] = useState(
    brand.defaultTransferFee
      ? formatRupiah(brand.defaultTransferFee).replace("Rp ", "")
      : "2.500",
  );
  const [taxRate, setTaxRate] = useState<number>(brand.defaultTaxRate ?? 11);

  const activeMessage = result.message;
  const isSuccess = result.ok;

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setTransferFeeInput("");
      return;
    }
    const num = parseInt(raw, 10);
    setTransferFeeInput(formatRupiah(num).replace("Rp ", ""));
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
        {/* Rekening Kas Utama Bawaan */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconWallet className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Rekening Kas Utama Bawaan (Default Account)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rekening bank atau dompet tunai yang otomatis terpilih pertama kali saat staf
                membuka formulir pencatatan mutasi kas baru.
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-md">
            <FormField
              label="Pilih Rekening Utama"
              htmlFor="defaultAccountId"
              name="defaultAccountId"
            >
              <Select
                id="defaultAccountId"
                name="defaultAccountId"
                value={defaultAccount}
                onChange={(e) => setDefaultAccount(e.target.value)}
              >
                <option value="">-- Tanpa Rekening Bawaan (Pilih Manual) --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        {/* Biaya Admin Transfer Antar Rekening Default */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconScale className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Biaya Administrasi Transfer Antar Bank Bawaan
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Biaya standar saat melakukan pindah buku kas antar bank (misal tarif BI-FAST Rp 2.500
                atau Realtime Online Rp 6.500).
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-sm">
            <FormField
              label="Biaya Admin Standar (Rupiah)"
              htmlFor="defaultTransferFee"
              name="defaultTransferFee"
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="defaultTransferFee"
                  name="defaultTransferFee"
                  value={transferFeeInput}
                  onChange={handleFeeChange}
                  placeholder="2.500"
                  className="pl-10 font-mono font-bold"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Tarif PPN / Pajak Standar */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <IconScale className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Tarif PPN / Pajak Standar (%)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Persentase pajak pertambahan nilai yang berlaku (default Indonesia saat ini 11%).
              </p>
            </div>
          </div>

          <div className="pt-1 max-w-xs flex items-center gap-2">
            <Input
              type="number"
              name="defaultTaxRate"
              min={0}
              max={100}
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-24 font-bold text-center"
            />
            <span className="text-sm font-bold text-foreground">%</span>
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
          <span>{pending ? "Menyimpan Setelan..." : "Simpan Setelan Keuangan"}</span>
        </Button>
      </div>
    </form>
  );
}

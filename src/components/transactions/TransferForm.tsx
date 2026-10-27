"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/lib/types";
import { getTodayInputValue } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { checkTransferBalance } from "@/lib/account-balance-rules";
import { IconAlert, IconArrowRight } from "@/components/Icons";
import {
  Alert,
  alertDuration,
  Button,
  CurrencyInput,
  FormField,
  Input,
  Select,
  Textarea,
  cx,
} from "@/components/ui";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

export type TransferAccountOption = {
  id: string;
  name: string;
  balance?: number;
  type?: string;
};

/**
 * Form transfer antar akun.
 *
 * Sengaja tidak punya field "jenis" maupun "kategori". Transfer bukan
 * pemasukan dan bukan pengeluaran, jadi memaksakan kategori di sini hanya
 * membuka jalan supaya transfer ikut terhitung sebagai income atau expense
 * dan merusak laporan arus kas.
 */
export function TransferForm({
  action,
  accounts,
}: {
  action: (
    previous: ActionResult,
    formData: FormData,
  ) => Promise<ActionResult>;
  accounts: TransferAccountOption[];
}) {
  const [result, formAction, pending] = useActionState(action, INITIAL_RESULT);
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [enteredAmount, setEnteredAmount] = useState<number | null>(null);

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const transferCheck =
    fromAccount && fromAccount.balance !== undefined
      ? checkTransferBalance({
          fromAccountType: fromAccount.type,
          fromAccountBalance: fromAccount.balance,
          amount: enteredAmount,
        })
      : null;

  const errors = result.ok ? undefined : result.errors;

  return (
    <form action={formAction} className="space-y-6">
      {result.message ? (
        <Alert
          key={result.message}
          tone={result.ok ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {result.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <div className="space-y-1.5">
          <FormField
            label="Dari akun"
            htmlFor="fromAccountId"
            required
            errors={errors?.fromAccountId}
          >
            <Select
              id="fromAccountId"
              name="fromAccountId"
              required
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              invalid={Boolean(errors?.fromAccountId)}
            >
              <option value="" disabled>
                Pilih akun asal
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.balance !== undefined
                    ? ` · ${formatRupiah(account.balance)}`
                    : ""}
                </option>
              ))}
            </Select>
          </FormField>

          {fromAccount && fromAccount.balance !== undefined ? (
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs px-0.5">
              <span className="text-subtle-foreground">
                Saldo asal:{" "}
                <strong
                  className={cx(
                    "font-mono font-semibold tabular-nums",
                    fromAccount.balance < 0 ? "text-expense" : "text-foreground",
                  )}
                >
                  {formatRupiah(fromAccount.balance)}
                </strong>
              </span>
              {transferCheck?.isInsufficient ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-warning-border/40 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning animate-fade-in">
                  <IconAlert className="h-3 w-3 shrink-0" />
                  <span>Saldo asal tidak mencukupi</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground sm:mt-7 sm:grid"
        >
          <IconArrowRight className="h-5 w-5" />
        </span>

        <div className="space-y-1.5">
          <FormField
            label="Ke akun"
            htmlFor="toAccountId"
            required
            errors={errors?.toAccountId}
          >
            <Select
              id="toAccountId"
              name="toAccountId"
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              invalid={Boolean(errors?.toAccountId)}
            >
              <option value="" disabled>
                Pilih akun tujuan
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.balance !== undefined
                    ? ` · ${formatRupiah(account.balance)}`
                    : ""}
                </option>
              ))}
            </Select>
          </FormField>

          {toAccount && toAccount.balance !== undefined ? (
            <div className="flex items-center text-xs px-0.5">
              <span className="text-subtle-foreground">
                Saldo tujuan:{" "}
                <strong
                  className={cx(
                    "font-mono font-semibold tabular-nums",
                    toAccount.balance < 0 ? "text-expense" : "text-foreground",
                  )}
                >
                  {formatRupiah(toAccount.balance)}
                </strong>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nominal"
          htmlFor="amount"
          required
          errors={errors?.amount}
        >
          {/* `CurrencyInput` sudah menaruh prefix "Rp" sendiri, jadi yang perlu
              ditambah hanya atribut penanda untuk pembaca layar. */}
          <CurrencyInput name="amount" onValueChange={setEnteredAmount} />
        </FormField>

        <FormField label="Tanggal" htmlFor="date" required errors={errors?.date}>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={getTodayInputValue()}
            invalid={Boolean(errors?.date)}
          />
        </FormField>
      </div>

      <FormField
        label="Catatan"
        htmlFor="notes"
        hint="Opsional. Misalnya untuk alasan pemindahan dana."
        errors={errors?.notes}
      >
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          invalid={Boolean(errors?.notes)}
        />
      </FormField>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan transfer"}
        </Button>
      </div>
    </form>
  );
}

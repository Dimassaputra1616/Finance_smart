"use client";

import { useActionState, useState } from "react";
import { updateTelegramNotifications } from "@/server/actions/brand";
import { IconCheck, IconMail } from "@/components/Icons";
import { Alert, alertDuration, Button, FormField, Input } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand-config";
import type { ActionResult } from "@/lib/types";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Formulir Integrasi Bot Notifikasi Telegram.
 */
export function TelegramNotificationForm({ brand }: { brand: BrandConfig }) {
  const [result, formAction, pending] = useActionState(updateTelegramNotifications, INITIAL_RESULT);

  const [token, setToken] = useState(brand.telegramBotToken || "");
  const [chatId, setChatId] = useState(brand.telegramChatId || "");
  const [notifyIncome, setNotifyIncome] = useState<boolean>(brand.notifyOnIncome ?? true);
  const [notifyExpense, setNotifyExpense] = useState<boolean>(brand.notifyOnExpensePending ?? true);
  const [notifyBudget, setNotifyBudget] = useState<boolean>(brand.notifyOnBudgetAlert ?? true);

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

      <div className="space-y-5">
        {/* Info Petunjuk Telegram */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/30 p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <IconMail className="h-5 w-5 text-primary" />
            <span>Notifikasi Instan ke Telegram Kas Kantor</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hubungkan bot Telegram resmi kantor agar setiap ada pergerakan kas masuk,
            pengajuan nota pengeluaran staf yang butuh approval, atau serapan anggaran yang menipis,
            tim perbendaharaan langsung menerima notifikasi otomatis seketika.
          </p>
        </div>

        {/* Input Kredensial Bot */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label="Telegram Bot Token"
              htmlFor="telegramBotToken"
              name="telegramBotToken"
              hint="Didapatkan dari @BotFather saat membuat bot Telegram baru."
            >
              <Input
                id="telegramBotToken"
                name="telegramBotToken"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="font-mono text-xs"
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField
              label="Telegram Chat ID / ID Grup Keuangan"
              htmlFor="telegramChatId"
              name="telegramChatId"
              hint="ID obrolan pribadi atau ID grup internal kantor (misal: -100123456789)."
            >
              <Input
                id="telegramChatId"
                name="telegramChatId"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Contoh: -100123456789 atau ID akun Anda"
                className="font-mono text-xs"
              />
            </FormField>
          </div>
        </div>

        {/* Pilihan Saklar Notifikasi */}
        <div className="rounded-2xl border border-border/80 bg-surface-muted/20 p-4 sm:p-5 space-y-3">
          <h4 className="text-sm font-bold text-foreground">Pemicu Notifikasi Otomatis</h4>
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyOnIncome"
                value="true"
                checked={notifyIncome}
                onChange={(e) => setNotifyIncome(e.target.checked)}
                className="h-4 w-4 rounded-md accent-primary cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium">
                Kirim notifikasi setiap ada <strong>Pemasukan Kas Masuk</strong>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyOnExpensePending"
                value="true"
                checked={notifyExpense}
                onChange={(e) => setNotifyExpense(e.target.checked)}
                className="h-4 w-4 rounded-md accent-primary cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium">
                Kirim notifikasi saat staf mengajukan <strong>Pengeluaran (Pending Approval)</strong>
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notifyOnBudgetAlert"
                value="true"
                checked={notifyBudget}
                onChange={(e) => setNotifyBudget(e.target.checked)}
                className="h-4 w-4 rounded-md accent-primary cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium">
                Kirim peringatan waspada jika <strong>Pos Anggaran &gt; 80% Pagu</strong>
              </span>
            </label>
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
          <span>{pending ? "Menyimpan Integrasi..." : "Simpan Pengaturan Telegram"}</span>
        </Button>
      </div>
    </form>
  );
}

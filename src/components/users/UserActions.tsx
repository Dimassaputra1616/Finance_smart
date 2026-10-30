"use client";

import { useActionState, useEffect, useState } from "react";
import { toggleUserStatus, resetUserPassword } from "@/server/actions/users";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { IconEye, IconEyeOff, IconKey } from "@/components/Icons";
import type { ActionResult } from "@/lib/types";

/**
 * Tombol untuk mengaktifkan atau menonaktifkan pengguna.
 */
export function ToggleUserStatusButton({
  id,
  name,
  isActive,
  isCurrentSessionUser,
}: {
  id: string;
  name: string;
  isActive: boolean;
  isCurrentSessionUser: boolean;
}) {
  if (isCurrentSessionUser && isActive) {
    return (
      <span className="text-xs text-subtle-foreground font-mono italic px-2">
        Sesi Anda
      </span>
    );
  }

  return (
    <ConfirmSubmitButton
      action={toggleUserStatus}
      fields={{ id }}
      title={isActive ? `Nonaktifkan akun "${name}"?` : `Aktifkan kembali akun "${name}"?`}
      description={
        isActive
          ? "Pengguna tidak akan dapat masuk ke konsol perbendaharaan. Data riwayat transaksi yang pernah dicatat tetap tersimpan utuh."
          : "Pengguna akan dapat masuk kembali ke konsol perbendaharaan dengan kredensialnya."
      }
      triggerLabel={isActive ? "Nonaktifkan" : "Aktifkan"}
      triggerVariant={isActive ? "ghost" : "secondary"}
      confirmLabel={isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
      pendingLabel="Memproses…"
    />
  );
}

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/**
 * Tombol modal untuk setel ulang kata sandi pengguna oleh Administrator.
 */
export function ResetPasswordModalButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, formAction, pending] = useActionState(resetUserPassword, INITIAL_RESULT);

  useEffect(() => {
    if (result.ok) {
      setOpen(false);
      setPassword("");
      setShowPassword(false);
    }
  }, [result]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover/80 rounded-xl px-2.5 min-h-9 transition active:scale-95"
      >
        <IconKey className="h-3.5 w-3.5 text-primary" />
        <span>Reset Sandi</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !pending && setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-lifted animate-fade-up">
            <h3 className="text-base font-semibold text-foreground">
              Reset Kata Sandi
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tetapkan kata sandi baru untuk <strong>{name}</strong>.
            </p>

            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={id} />

              <div>
                <label htmlFor={`new-pw-${id}`} className="block text-xs font-medium text-foreground mb-1.5">
                  Kata sandi baru
                </label>
                <div className="relative">
                  <Input
                    id={`new-pw-${id}`}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter…"
                    minLength={8}
                    maxLength={128}
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {!result.ok && result.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {result.message}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={pending || password.length < 8}>
                  {pending ? "Menyimpan…" : "Simpan Kata Sandi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "@/server/actions/auth";
import {
  IconAlert,
  IconEye,
  IconEyeOff,
  IconMail,
  IconShield,
} from "@/components/Icons";
import { Button, Input } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult = { ok: true };
const ERROR_ID = "login-error";

/**
 * Formulir masuk konsol perbendaharaan enterprise.
 * Menggunakan kredensial email resmi perusahaan dan kata sandi akun terdaftar.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  const errorMessage = !state.ok ? state.message : undefined;
  const describedBy = errorMessage ? ERROR_ID : undefined;

  useEffect(() => {
    document.getElementById("email")?.focus();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const passwordInput = document.getElementById("password") as HTMLInputElement | null;
      if (passwordInput) passwordInput.value = "";
      document.getElementById("password")?.focus();
    }
  }, [state, errorMessage]);

  return (
    <form
      suppressHydrationWarning
      action={formAction}
      className="space-y-4"
    >
      {errorMessage ? (
        <p
          id={ERROR_ID}
          role="alert"
          className="flex animate-fade-up items-start gap-2 rounded-xl border border-destructive-border bg-destructive-soft px-3.5 py-2.5 text-sm text-destructive"
        >
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email perusahaan
        </label>
        <div className="relative group">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary group-hover:text-foreground"
          >
            <IconMail className="h-4 w-4" />
          </span>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nama@perusahaan.com"
            readOnly={isPending}
            invalid={Boolean(errorMessage)}
            {...(describedBy ? { "aria-describedby": describedBy } : {})}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Kata sandi
        </label>
        <div className="relative group">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary group-hover:text-foreground"
          >
            <IconShield className="h-4 w-4" />
          </span>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi akun…"
            readOnly={isPending}
            invalid={Boolean(errorMessage)}
            {...(describedBy ? { "aria-describedby": describedBy } : {})}
            className="pl-10 pr-12"
            required
          />
          {/* Tombol sakelar visibilitas kata sandi */}
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label="Tampilkan kata sandi"
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

      <div className="flex items-center justify-between text-xs pt-0.5">
        <label className="group flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors duration-200">
          <input
            suppressHydrationWarning
            type="checkbox"
            name="rememberMe"
            defaultChecked
            disabled={isPending}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring cursor-pointer accent-primary transition-transform duration-150 group-hover:scale-110"
          />
          <span className="transition-colors duration-150 group-hover:text-foreground">
            Ingat sesi masuk di perangkat ini
          </span>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:translate-y-0 active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent shrink-0"
            />
            <span>Memverifikasi Otoritas…</span>
          </>
        ) : (
          <span>Masuk ke Konsol</span>
        )}
      </Button>

      <p className="text-center text-xs text-subtle-foreground transition-colors duration-200 hover:text-foreground">
        Kendala autentikasi? Hubungi Administrator TI.
      </p>
    </form>
  );
}

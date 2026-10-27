"use client";

import { useActionState, useEffect, useState } from "react";
import { login } from "@/server/actions/auth";
import { IconAlert, IconEye, IconEyeOff } from "@/components/Icons";
import { Button, Input } from "@/components/ui";
import type { ActionResult } from "@/lib/types";

const INITIAL_STATE: ActionResult = { ok: true };
const ERROR_ID = "login-error";

/**
 * Formulir masuk. Logika autentikasinya ada di Server Action `login`; komponen
 * ini hanya mengurus tampilan dan aksesibilitas.
 *
 * Tanpa placeholder: label sudah terlihat, dan placeholder abu-abu pucat
 * sebelumnya hanya 1,8:1 kontrasnya di mode terang.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errorMessage = !state.ok ? state.message : undefined;
  const describedBy = errorMessage ? ERROR_ID : undefined;

  // React mengosongkan kolom yang tidak dikontrol setelah aksi selesai, jadi
  // kata sandi memang hilang saat gagal (disengaja) sementara nama pengguna
  // dipertahankan lewat state. Fokus dikembalikan ke kata sandi supaya pengguna
  // bisa langsung mengetik ulang.
  useEffect(() => {
    if (errorMessage) document.getElementById("password")?.focus();
  }, [state, errorMessage]);

  return (
    <form action={formAction} className="space-y-5">
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
        <label htmlFor="username" className="block text-sm font-medium text-foreground">
          Nama pengguna
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          // `readOnly`, bukan `disabled`: kolom yang dinonaktifkan kehilangan
          // fokus, dan nilainya tidak terkirim kalau statusnya berubah sebelum
          // formulir dibaca.
          readOnly={isPending}
          invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Kata sandi
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            readOnly={isPending}
            invalid={Boolean(errorMessage)}
            aria-describedby={describedBy}
            className="pr-12"
            required
          />
          {/* Label tetap, keadaannya lewat `aria-pressed`. Kalau label ikut
              berganti, pembaca layar mengumumkan dua hal yang saling bertentangan. */}
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label="Tampilkan kata sandi"
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-muted-foreground transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {showPassword ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Memverifikasi…" : "Masuk"}
      </Button>

      <p className="text-center text-xs text-subtle-foreground">
        Lupa kata sandi? Hubungi administrator.
      </p>
    </form>
  );
}

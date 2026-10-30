"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword } from "@/server/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { IconEye, IconEyeOff } from "@/components/Icons";
import type { ActionResult } from "@/lib/types";
import {
  Alert,
  alertDuration,
  Button,
  FormField,
  Input,
} from "@/components/ui";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

/** Form ganti kata sandi untuk akun yang sedang masuk. */
export function ChangePasswordForm() {
  const [result, formAction, pending] = useActionState(changePassword, INITIAL_RESULT);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = result.ok ? undefined : result.errors;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Setelah berhasil, kosongkan kolom supaya kata sandi tidak tertinggal di layar.
  useEffect(() => {
    if (result.ok && result.message) {
      formRef.current?.reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [result]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {result.message ? (
        <Alert
          key={result.message}
          tone={result.ok ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {result.message}
        </Alert>
      ) : null}

      <FormField
        label="Kata sandi saat ini"
        htmlFor="currentPassword"
        required
        errors={errors?.currentPassword}
      >
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            invalid={Boolean(errors?.currentPassword)}
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showCurrent}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {showCurrent ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      <FormField
        label="Kata sandi baru"
        htmlFor="newPassword"
        required
        errors={errors?.newPassword}
        hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter. Kalimat panjang lebih kuat daripada kata pendek yang dirumitkan.`}
      >
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            invalid={Boolean(errors?.newPassword)}
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showNew}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {showNew ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      <FormField
        label="Ulangi kata sandi baru"
        htmlFor="confirmPassword"
        required
        errors={errors?.confirmPassword}
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            invalid={Boolean(errors?.confirmPassword)}
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showConfirm}
            className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-xl text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Ubah kata sandi"}
      </Button>
    </form>
  );
}

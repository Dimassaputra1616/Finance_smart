"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/server/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
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

  // Setelah berhasil, kosongkan kolom supaya kata sandi tidak tertinggal di layar.
  useEffect(() => {
    if (result.ok && result.message) formRef.current?.reset();
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
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors?.currentPassword)}
          required
        />
      </FormField>

      <FormField
        label="Kata sandi baru"
        htmlFor="newPassword"
        required
        errors={errors?.newPassword}
        hint={`Minimal ${MIN_PASSWORD_LENGTH} karakter. Kalimat panjang lebih kuat daripada kata pendek yang dirumitkan.`}
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors?.newPassword)}
          required
        />
      </FormField>

      <FormField
        label="Ulangi kata sandi baru"
        htmlFor="confirmPassword"
        required
        errors={errors?.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors?.confirmPassword)}
          required
        />
      </FormField>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Ubah kata sandi"}
      </Button>
    </form>
  );
}

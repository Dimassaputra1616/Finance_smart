"use client";

import { useActionState, useRef, useState } from "react";
import { createUser } from "@/server/actions/users";
import { USER_ROLES, USER_ROLE_LABELS, type ActionResult, type UserRole } from "@/lib/types";
import {
  IconEye,
  IconEyeOff,
  IconMail,
  IconReceipt,
  IconShield,
  IconUser,
  IconPlus,
} from "@/components/Icons";
import {
  Alert,
  alertDuration,
  Button,
  FormField,
  Input,
} from "@/components/ui";
import { cx } from "@/components/ui/Card";

const INITIAL_RESULT: ActionResult = { ok: false, message: "" };

interface RoleCardMeta {
  title: string;
  badge: string;
  desc: string;
  icon: typeof IconShield;
  colorClass: string;
  borderActiveClass: string;
}

const ROLE_META: Record<UserRole, RoleCardMeta> = {
  STAFF: {
    title: "Staf Operasional",
    badge: "Pencatat",
    desc: "Mencatat kas masuk/keluar & memindai nota bukti belanja.",
    icon: IconUser,
    colorClass: "text-primary bg-primary/10",
    borderActiveClass: "border-primary ring-2 ring-primary/20 bg-primary/5",
  },
  DIRECTOR: {
    title: "Direktur Keuangan",
    badge: "Approver",
    desc: "Menerima notifikasi approval pengeluaran & otorisasi kas kantor.",
    icon: IconReceipt,
    colorClass: "text-sidebar-brand-from bg-sidebar-brand-from/15",
    borderActiveClass: "border-sidebar-brand-from ring-2 ring-sidebar-brand-from/20 bg-sidebar-brand-from/5",
  },
  ADMIN: {
    title: "Super Admin",
    badge: "Full Control",
    desc: "Akses penuh sistem, Config Master, 9router, & kelola akun pengguna.",
    icon: IconShield,
    colorClass: "text-income bg-income-soft",
    borderActiveClass: "border-income ring-2 ring-income/20 bg-income-soft/20",
  },
};

/**
 * Formulir tambah pengguna baru ke sistem (Khusus Super Admin).
 */
export function UserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [result, formAction, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const res = await createUser(prev, formData);
    if (res.ok) {
      formRef.current?.reset();
      setSelectedRole("STAFF");
      setShowPassword(false);
    }
    return res;
  }, INITIAL_RESULT);

  const errors = result.ok ? undefined : result.errors;

  return (
    <form ref={formRef} action={formAction} className="space-y-4.5">
      {result.message ? (
        <Alert
          key={result.message}
          tone={result.ok ? "success" : "error"}
          duration={alertDuration(result)}
        >
          {result.message}
        </Alert>
      ) : null}

      {/* Input Nama Lengkap */}
      <FormField
        label="Nama lengkap"
        htmlFor="name"
        required
        errors={errors?.name}
      >
        <div className="relative group">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary"
          >
            <IconUser className="h-4 w-4" />
          </span>
          <Input
            id="name"
            name="name"
            placeholder="Contoh: Budi Santoso"
            invalid={Boolean(errors?.name)}
            maxLength={60}
            className="pl-10 font-medium"
            required
          />
        </div>
      </FormField>

      {/* Input Email Perusahaan */}
      <FormField
        label="Email perusahaan"
        htmlFor="email"
        required
        errors={errors?.email}
        hint="Kredensial login masuk ke aplikasi."
      >
        <div className="relative group">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary"
          >
            <IconMail className="h-4 w-4" />
          </span>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@perusahaan.com"
            invalid={Boolean(errors?.email)}
            maxLength={100}
            className="pl-10 font-mono text-xs"
            required
          />
        </div>
      </FormField>

      {/* Seleksi Kartu Peran Otorisasi (Interactive Role Selector Cards) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Peran Otorisasi (RBAC) <span className="text-destructive">*</span>
        </label>

        {/* Input hidden untuk form action */}
        <input type="hidden" name="role" value={selectedRole} />

        <div className="grid gap-2">
          {USER_ROLES.map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={cx(
                  "group relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer active:scale-[0.99]",
                  isSelected
                    ? meta.borderActiveClass
                    : "border-border/80 bg-surface hover:border-muted-foreground/40 hover:bg-surface-hover/60",
                )}
              >
                <span
                  className={cx(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 mt-0.5",
                    meta.colorClass,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">
                      {meta.title}
                    </p>
                    <span className="rounded-full bg-surface border border-border/60 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {meta.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Kata Sandi Awal */}
      <FormField
        label="Kata sandi awal"
        htmlFor="password"
        required
        errors={errors?.password}
        hint="Minimal 8 karakter (dapat diubah nanti di halaman profil)."
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter…"
            invalid={Boolean(errors?.password)}
            minLength={8}
            maxLength={128}
            className="pr-11 font-mono text-xs"
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
      </FormField>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 min-h-11 shadow-sm font-semibold cursor-pointer"
        >
          {pending ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
              />
              <span>Menyimpan Pengguna…</span>
            </>
          ) : (
            <>
              <IconPlus className="h-4 w-4" />
              <span>Tambah Pengguna</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

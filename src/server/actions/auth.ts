"use server";

import { timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getAuthSecret,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth-passwords";
import { db } from "@/lib/db";
import { checkPasswordChange } from "@/lib/password-rules";
import { loginRateLimiter } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { actionError, type ActionResult, type UserRole } from "@/lib/types";

/**
 * Aksi login dan logout enterprise.
 *
 * Mendukung autentikasi database (User table: ADMIN | STAFF) dan satu akun
 * cadangan dari environment. Tidak ada kredensial bawaan di kode.
 */

function passwordMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input, "utf-8");
  const b = Buffer.from(expected, "utf-8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function login(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identifier = String(
    formData.get("email") ?? formData.get("username") ?? "",
  ).trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") !== null;

  if (!identifier || !password) {
    return actionError("Email perusahaan dan kata sandi wajib diisi.");
  }

  // Identifikasi klien berdasarkan IP & kredensial untuk membatasi percobaan brute-force
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "localhost";
  const rateKey = `${clientIp}:${identifier}`;

  const rateCheck = loginRateLimiter.check(rateKey);
  if (!rateCheck.allowed) {
    return actionError(rateCheck.message);
  }

  const authSecret = getAuthSecret();

  // Helper untuk menetapkan cookie sesi dengan aman
  const setSessionCookie = async (user: {
    id: string;
    username: string;
    role: UserRole;
    name: string;
  }) => {
    const token = await createSessionToken(user, authSecret);
    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(rememberMe ? { maxAge: SESSION_MAX_AGE_SECONDS } : {}),
    });
  };

  // Tidak ada kredensial yang ditulis di kode. Super admin dibuat ke tabel User
  // lewat scripts/create-super-admin.ts (password dari SUPER_ADMIN_PASSWORD),
  // atau masuk lewat fallback BASIC_AUTH_USER / BASIC_AUTH_PASS di bawah.

  // 1. Cek akun pada database
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (userDelegate) {
      const user = await userDelegate.findUnique({
        where: { username: identifier },
      });

      if (user && user.isActive) {
        const isMatch = verifyPassword(password, user.passwordHash);
        if (isMatch) {
          loginRateLimiter.reset(rateKey);
          await setSessionCookie({
            id: user.id,
            username: user.username,
            role: user.role === "ADMIN" || user.role === "DIRECTOR" ? user.role : "STAFF",
            name: user.name,
          });

          redirect("/");
        }
      }
    }
  } catch (err) {
    // Teruskan exception NEXT_REDIRECT dari redirect()
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
  }

  // 2. Fallback kredensial environment (Administrator)
  const envUser = process.env.BASIC_AUTH_USER;
  const envPass = process.env.BASIC_AUTH_PASS;
  if (envUser && envPass) {
    if (
      identifier === envUser.toLowerCase() &&
      passwordMatches(password, envPass)
    ) {
      loginRateLimiter.reset(rateKey);
      await setSessionCookie({
        id: envUser,
        username: envUser,
        role: "ADMIN",
        name: "Administrator",
      });

      redirect("/");
    }
  }

  // Gagal: catat kegagalan untuk rate limiting
  loginRateLimiter.recordFailure(rateKey);

  return actionError("Email perusahaan atau kata sandi tidak valid. Silakan periksa kembali.");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

/**
 * Ganti kata sandi akun yang sedang masuk.
 *
 * Kata sandi lama wajib benar walau sesi sudah valid: sesi yang tertinggal di
 * perangkat orang lain tidak boleh cukup untuk mengunci pemilik akun.
 *
 * Batasan: sesi lain yang masih berlaku TIDAK dibatalkan, karena token sesi
 * tidak dicek ke database. Mengubah itu butuh versi sesi di tabel User.
 */
export async function changePassword(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) {
    return actionError("Sesi berakhir. Silakan masuk kembali.");
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const fieldErrors = checkPasswordChange({
    username: session.username,
    current,
    next,
    confirm,
  });

  if (fieldErrors) {
    return actionError("Periksa kembali isian formulir.", fieldErrors);
  }

  try {
    const user = await db.user.findUnique({ where: { id: session.id } });

    if (!user || !user.isActive) {
      return actionError(
        "Akun ini tidak tersimpan di database, jadi kata sandinya tidak bisa diubah dari sini. " +
          "Kalau masuk lewat BASIC_AUTH_USER, ubah BASIC_AUTH_PASS di .env.",
      );
    }

    if (!verifyPassword(current, user.passwordHash)) {
      return actionError("Kata sandi saat ini salah.", {
        currentPassword: ["Kata sandi saat ini salah."],
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(next) },
    });
  } catch {
    return actionError("Gagal menyimpan kata sandi baru. Coba ulangi sekali lagi.");
  }

  return { ok: true, message: "Kata sandi berhasil diubah." };
}

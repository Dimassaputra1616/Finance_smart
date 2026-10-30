import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  getAuthSecret,
  verifySession,
  type SessionUser,
} from "@/lib/auth";
import { canManageMasterData } from "@/lib/transaction-rules";
import { actionError, type ActionResult } from "@/lib/types";

/**
 * Helper sesi pengguna untuk Server Component dan Server Action.
 */

/** Dapatkan pengguna yang sedang login saat ini, atau `null` bila anonim. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token, getAuthSecret());
}

/** Pastikan pengguna sudah login; lempar error bila belum. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Akses ditolak: Anda harus masuk terlebih dahulu.");
  }
  return user;
}

/**
 * Penjaga untuk Server Action data induk (akun, kategori, transfer, piutang).
 *
 * Mengembalikan `ActionResult` galat bila pengguna bukan ADMIN atau DIRECTOR, atau `null`
 * bila boleh lanjut.
 */
export async function adminGuard(): Promise<ActionResult | null> {
  const user = await getCurrentUser();

  if (!canManageMasterData(user?.role)) {
    return actionError(
      "Akses ditolak: hanya Administrator atau Direktur yang dapat mengubah data ini.",
    );
  }

  return null;
}

/**
 * Penjaga khusus pengelolaan pengguna (/pengguna) — EKSKLUSIF Super Admin.
 */
export async function superAdminGuard(): Promise<ActionResult | null> {
  const user = await getCurrentUser();

  if (user?.role !== "ADMIN") {
    return actionError(
      "Akses ditolak: hanya Super Admin yang berwenang mengelola akun pengguna.",
    );
  }

  return null;
}

/**
 * Apakah sesi saat ini boleh mengelola data induk (akun, kategori, transfer, piutang).
 * Berlaku untuk Super Admin dan Direktur.
 */
export async function isAdminSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return canManageMasterData(user?.role);
}

/**
 * Apakah sesi saat ini adalah Super Admin (ADMIN).
 * Digunakan untuk halaman manajemen pengguna (/pengguna).
 */
export async function isSuperAdminSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/** Pastikan pengguna memiliki peran Administrator (Approver). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "DIRECTOR") {
    throw new Error("Akses ditolak: Memerlukan wewenang Administrator atau Direktur.");
  }
  return user;
}

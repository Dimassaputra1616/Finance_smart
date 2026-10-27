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
 * Mengembalikan `ActionResult` galat bila pengguna bukan ADMIN, atau `null`
 * bila boleh lanjut. Dipakai di awal aksi: `const denied = await adminGuard();
 * if (denied) return denied;`. Berbeda dengan `requireAdmin()` yang melempar
 * exception, di sini galat dikembalikan supaya tampil inline di form lewat
 * `useActionState`. Pengguna anonim juga ditolak (peran tidak dikenal).
 *
 * Aturannya ada di `canManageMasterData()` agar bisa diuji tanpa cookie.
 */
export async function adminGuard(): Promise<ActionResult | null> {
  const user = await getCurrentUser();

  if (!canManageMasterData(user?.role)) {
    return actionError(
      "Akses ditolak: hanya Administrator yang dapat mengubah data ini.",
    );
  }

  return null;
}

/**
 * Apakah sesi saat ini boleh mengelola data induk (akun, kategori, transfer,
 * piutang). Dipakai halaman server untuk menolak staf yang membuka URL-nya
 * langsung, sebagai pasangan `adminGuard()` yang menjaga Server Action.
 */
export async function isAdminSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return canManageMasterData(user?.role);
}

/** Pastikan pengguna memiliki peran Administrator (Approver). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Akses ditolak: Memerlukan wewenang Administrator.");
  }
  return user;
}

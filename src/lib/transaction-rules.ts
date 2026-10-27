import type { TransactionStatus } from "./types";

/**
 * Aturan bisnis murni seputar status transaksi dan hak modifikasi RBAC.
 *
 * Dipisahkan dari Server Action agar dapat diuji tanpa menyentuh database
 * (sesuai aturan AGENTS.md §5).
 */

export type UserContext = {
  id: string;
  role: "ADMIN" | "STAFF";
};

export type TransactionContext = {
  createdById?: string | null;
  status: TransactionStatus;
};

/**
 * Menentukan apakah sebuah transaksi sudah sah mempengaruhi saldo akun
 * dan arus kas resmi perusahaan.
 *
 * - PENDING: diajukan staf, belum memotong kas
 * - APPROVED: sah, memotong/menambah kas operasional
 * - REJECTED: ditolak, tidak mempengaruhi kas
 */
export function isTransactionAffectingBalance(
  status: TransactionStatus | string | undefined | null,
): boolean {
  return status === "APPROVED";
}

/**
 * Menentukan apakah pengguna berhak mengubah atau menghapus transaksi.
 *
 * Aturan:
 * - Administrator: bebas mengubah dan menghapus transaksi berstatus apa pun
 * - Staf: hanya boleh mengubah/menghapus transaksi miliknya sendiri yang masih PENDING
 */
export function canModifyTransaction(
  user: UserContext,
  tx: TransactionContext,
): { allowed: boolean; reason?: string } {
  if (user.role === "ADMIN") {
    return { allowed: true };
  }

  if (tx.createdById !== user.id) {
    return {
      allowed: false,
      reason: "Hanya dapat mengelola transaksi yang dicatat sendiri.",
    };
  }

  if (tx.status !== "PENDING") {
    return {
      allowed: false,
      reason: "Transaksi yang sudah disetujui hanya dapat dikelola oleh Administrator.",
    };
  }

  return { allowed: true };
}

/**
 * Menentukan apakah pengguna berhak mengubah data induk dan pembukuan di luar
 * pencatatan transaksi biasa: akun, kategori (termasuk pagu), transfer antar
 * akun, dan piutang.
 *
 * Hanya ADMIN. Staf hanya mengajukan transaksi, yang masih harus disetujui.
 * Kalau staf boleh membuat piutang atau transfer langsung, jalur itu
 * memintas persetujuan: uangnya langsung memotong atau memindah kas.
 * Peran yang tidak dikenal ditolak (aman secara bawaan).
 */
export function canManageMasterData(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/**
 * Menentukan apakah pengguna berhak menyetujui atau menolak transaksi.
 */
export function canApproveTransaction(userRole: "ADMIN" | "STAFF" | string): boolean {
  return userRole === "ADMIN";
}

import type { UserRole } from "./types";

/**
 * Aturan bisnis murni untuk pengelolaan pengguna dan RBAC.
 *
 * Murni tanpa dependensi database sehingga dapat diuji terisolasi (AGENTS.md §5).
 */

export type DeactivateUserContext = {
  targetUserId: string;
  currentUserId: string;
  targetUserRole: UserRole | string;
  activeAdminCount: number;
};

/**
 * Menentukan apakah sebuah akun boleh dinonaktifkan.
 *
 * Aturan:
 * 1. Administrator tidak boleh menonaktifkan akunnya sendiri (mencegah lockout diri sendiri).
 * 2. Akun Administrator tidak boleh dinonaktifkan bila ia adalah satu-satunya Administrator aktif.
 */
export function canDeactivateUser(context: DeactivateUserContext): {
  allowed: boolean;
  reason?: string;
} {
  const { targetUserId, currentUserId, targetUserRole, activeAdminCount } = context;

  if (targetUserId === currentUserId) {
    return {
      allowed: false,
      reason: "Tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.",
    };
  }

  if (targetUserRole === "ADMIN" && activeAdminCount <= 1) {
    return {
      allowed: false,
      reason: "Tidak dapat menonaktifkan Administrator terakhir. Sistem membutuhkan minimal satu Administrator aktif.",
    };
  }

  return { allowed: true };
}

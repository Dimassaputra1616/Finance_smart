import "server-only";

import { db } from "@/lib/db";
import type { UserRole } from "@/lib/types";

export type UserListItem = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdCount: number;
  approvedCount: number;
};

/**
 * Dapatkan seluruh daftar pengguna untuk dashboard manajemen pengguna.
 */
export async function getUsersList(): Promise<UserListItem[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (!userDelegate) return [];

    const users = await userDelegate.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            createdTransactions: true,
            approvedTransactions: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: (u.role === "ADMIN" || u.role === "DIRECTOR" ? u.role : "STAFF") as UserRole,
      isActive: Boolean(u.isActive),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      createdCount: u._count?.createdTransactions ?? 0,
      approvedCount: u._count?.approvedTransactions ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Apakah akun sesi ini tersimpan (dan aktif) di tabel User.
 *
 * Akun yang masuk lewat `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` di environment
 * tidak punya baris di database, jadi kata sandinya tidak bisa diubah dari
 * aplikasi. Halaman profil memakai ini untuk menyembunyikan form yang pasti
 * gagal.
 */
export async function hasStoredAccount(id: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDelegate = (db as any).user;
    if (!userDelegate) return false;

    const user = await userDelegate.findUnique({
      where: { id },
      select: { isActive: true },
    });

    return user?.isActive === true;
  } catch {
    return false;
  }
}

import "server-only";

import { db } from "@/lib/db";

/**
 * Apakah akun sesi ini tersimpan (dan aktif) di tabel User.
 *
 * Akun yang masuk lewat `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` di environment
 * tidak punya baris di database, jadi kata sandinya tidak bisa diubah dari
 * aplikasi. Halaman profil memakai ini untuk menyembunyikan form yang pasti
 * gagal.
 */
export async function hasStoredAccount(id: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id },
    select: { isActive: true },
  });

  return user?.isActive === true;
}

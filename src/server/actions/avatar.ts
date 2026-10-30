"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { saveAvatarFile, deleteAvatarFile } from "@/server/avatar-storage";
import { actionError, type ActionResult } from "@/lib/types";

/**
 * Unggah foto profil pengguna saat ini.
 */
export async function uploadAvatar(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda telah berakhir. Silakan masuk kembali.");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    return actionError("Pilih berkas foto terlebih dahulu.");
  }

  // Batas ukuran maksimal 3 MB
  if (file.size > 3 * 1024 * 1024) {
    return actionError("Ukuran foto maksimal 3 MB.");
  }

  const success = await saveAvatarFile(user.id, file);
  if (!success) {
    return actionError("Gagal menyimpan foto profil di server.");
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Foto profil berhasil diperbarui." };
}

/**
 * Hapus foto profil pengguna saat ini.
 */
export async function removeAvatar(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Sesi Anda tidak valid.");

  await deleteAvatarFile(user.id);
  revalidatePath("/", "layout");
  return { ok: true, message: "Foto profil berhasil dihapus." };
}

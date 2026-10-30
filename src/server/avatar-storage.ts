import "server-only";
import fs from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "storage", "avatars");

/**
 * Menyimpan foto profil pengguna sebagai berkas WebP.
 */
export async function saveAvatarFile(userId: string, file: File): Promise<boolean> {
  try {
    await fs.mkdir(AVATAR_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    await fs.writeFile(path.join(AVATAR_DIR, `${safeId}.webp`), buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Membaca foto profil pengguna dari penyimpanan disk.
 */
export async function readAvatarFile(userId: string): Promise<Buffer | null> {
  try {
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    return await fs.readFile(path.join(AVATAR_DIR, `${safeId}.webp`));
  } catch {
    return null;
  }
}

/**
 * Menghapus foto profil pengguna.
 */
export async function deleteAvatarFile(userId: string): Promise<boolean> {
  try {
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    await fs.unlink(path.join(AVATAR_DIR, `${safeId}.webp`));
    return true;
  } catch {
    return false;
  }
}

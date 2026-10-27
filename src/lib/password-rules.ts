/**
 * Aturan murni untuk mengganti kata sandi.
 *
 * Tanpa akses database (AGENTS.md §5), supaya bisa diuji langsung. Pemeriksaan
 * apakah kata sandi SAAT INI benar tetap dilakukan Server Action terhadap hash
 * di database; fungsi ini hanya memeriksa isian.
 */

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Daftar singkat kata sandi yang terlalu umum. Bukan pengganti pemeriksaan
 * kekuatan penuh; hanya menutup pilihan paling sering dan kata sandi bawaan
 * proyek ini. Entri di bawah panjang minimum tidak perlu ada karena sudah
 * ditolak oleh aturan panjang.
 */
const COMMON_PASSWORDS = new Set([
  "1234567890",
  "0123456789",
  "1q2w3e4r5t",
  "qwertyuiop",
  "password123",
]);

/** Kata sandi bawaan seed. Menyisipkannya di dalam kata sandi baru juga ditolak. */
const DEFAULT_PASSWORD_FRAGMENTS = ["admin123", "staf123"];

/** Kunci galat sama dengan atribut `name` di form. */
export type PasswordFieldErrors = Record<string, string[]>;

export function checkPasswordChange(input: {
  username: string;
  current: string;
  next: string;
  confirm: string;
}): PasswordFieldErrors | null {
  const { username, current, next, confirm } = input;
  const errors: PasswordFieldErrors = {};

  if (current.length === 0) {
    errors.currentPassword = ["Kata sandi saat ini wajib diisi."];
  }

  const nextError = checkNewPassword(next, username, current);
  if (nextError) errors.newPassword = [nextError];

  // Konfirmasi hanya dilaporkan bila BERBEDA dari kata sandi baru. Kalau
  // keduanya kosong, cukup satu pesan "wajib diisi" di kolom kata sandi baru,
  // bukan dua pesan untuk satu kesalahan.
  if (confirm !== next) {
    errors.confirmPassword = ["Konfirmasi tidak sama dengan kata sandi baru."];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

function checkNewPassword(next: string, username: string, current: string): string | null {
  if (next.length === 0) return "Kata sandi baru wajib diisi.";

  if (next.trim().length === 0) return "Kata sandi tidak boleh hanya berisi spasi.";

  if (next.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }

  if (next.length > MAX_PASSWORD_LENGTH) {
    return `Kata sandi baru maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }

  const lower = next.toLowerCase();

  if (COMMON_PASSWORDS.has(lower)) {
    return "Kata sandi ini terlalu umum. Pilih yang lebih sulit ditebak.";
  }

  if (DEFAULT_PASSWORD_FRAGMENTS.some((fragment) => lower.includes(fragment))) {
    return "Kata sandi tidak boleh memuat kata sandi bawaan sistem.";
  }

  const name = username.trim().toLowerCase();
  if (name.length >= 3 && lower.includes(name)) {
    return "Kata sandi tidak boleh memuat nama pengguna.";
  }

  if (next === current) {
    return "Kata sandi baru harus berbeda dari yang sekarang.";
  }

  return null;
}

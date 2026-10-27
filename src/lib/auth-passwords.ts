import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Utilitas hashing password berbasis Node.js crypto (scrypt).
 *
 * Menggunakan salt acak 16 byte dan scrypt dengan key length 64 byte.
 * Menghasilkan hash berformat `salt:keyHex` yang aman dari timing attack
 * dan rainbow table, tanpa dependensi paket eksternal (bcrypt/argon2).
 */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = scryptSync(password, salt, 64);
    return (
      keyBuffer.length === derivedKey.length &&
      timingSafeEqual(keyBuffer, derivedKey)
    );
  } catch {
    return false;
  }
}

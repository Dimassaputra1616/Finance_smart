import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth-passwords";

describe("auth-passwords (scrypt)", () => {
  it("password yang di-hash bisa diverifikasi dengan benar", () => {
    const raw = "KatasandiKu123!";
    const hash = hashPassword(raw);

    expect(hash).toContain(":");
    expect(verifyPassword(raw, hash)).toBe(true);
    expect(verifyPassword("password-salah", hash)).toBe(false);
  });

  it("dua hash dari password yang sama menghasilkan salt berbeda", () => {
    const raw = "password-sama";
    const hash1 = hashPassword(raw);
    const hash2 = hashPassword(raw);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(raw, hash1)).toBe(true);
    expect(verifyPassword(raw, hash2)).toBe(true);
  });

  it("format hash rusak mengembalikan false tanpa melempar exception", () => {
    expect(verifyPassword("test", "format-rusak")).toBe(false);
    expect(verifyPassword("test", "")).toBe(false);
    expect(verifyPassword("test", "salt-tanpa-key:")).toBe(false);
  });
});
